import { IncidentPrismaRepository } from "../persistence/mysql/IncidentPrismaRepository";
import { SlidingWindowEvaluator } from "../../application/services/SlidingWindowEvaluator";
import { DeduplicationService } from "../../application/services/DeduplicationService";
import { RemedyIncidentClient } from "../external/remedy/RemedyIncidentClient";
import { ProcessMonitoringEvent } from "../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
import { BifastConsumer } from "./whatsapp/BifastConsumer";
import { createQrisHealthConsumer } from "./api/QrisHealthConsumer";
import { ResolveIncident } from "../../application/usecases/ResolveIncident/ResolveIncident";
import { Logger } from "winston";
import { startWhatsApp } from "./whatsapp";
import { IncidentGateway } from "../../application/ports/IncidentGateway";
import { EventStore } from "../../application/ports/EventStore";
import { EventStorePrismaRepository } from "../persistence/mysql/EventStorePrisma";
import { DedupLockDb } from "../persistence/mysql/DedupLockPrisma";
import { MonitoringStatePrismaRepository } from "../persistence/mysql/MonitoringStatePrisma";
import { startResolveJob } from "../scheduler/IncidentResolveJob";
import { ENV } from "../../config/env";
import { WhatsAppNotificationGateway } from "./whatsapp/WhatsappNotificationGW";
import { startCleanupEventsJob } from "../scheduler/MonitoringEventCleanupJob";
import { CleanupMonitoringJob } from "../../application/usecases/CleanupMonitoringJob/CleanupMonitoringJob";
import { NauraGateway } from "../../application/ports/NauraGateway";
import { NauraClient } from "../external/naura/NauraClient";
import { CloseRecoveryScheduler } from "../scheduler/CloseRecoveryBiFastScheduler";
import { BiFastHealthChecker } from "../external/healthcheck/BiFastHealthChecker";
import { MonitoringStateStore } from "../../application/ports/MonitoringStateStore";
import { BifastVerificationJob } from "../scheduler/BifastVerificationJob";
import { AdvancedBifastVerifier } from "../../application/usecases/AdvancedBifastVerifier/AdvancedBifastVerifier";
import { ElasticMetricClient } from "../external/elastic/ElasticMetricClient";
import { BIFAST_ELASTIC_CLIENT_CRAWLING } from "../../config/bifastlist"; 
import { InMemoryWagComplaintStoreRepository } from "../persistence/memory/InMemoryWagComplaint";
import { avgRespTimeConfig, inquiryDanaErrorConfig } from "../external/elastic/MetricConfig";
import { VerifyBifastIncidentUseCase } from "../../application/usecases/AdvancedBifastVerifier/VerifyBifastIncidentUseCase";
import { WuzApiWsClient } from "./whatsapp/WuzApiClient";
import { WhatsAppClientV2 } from "./whatsapp/WhatsappClientv2";
import { WagHelpdeskClient } from "../external/elastic/WagHelpdeskClient";
import { BifastMessageHandler } from "../../application/usecases/BiFastMessageHandler/BiFastMessageHandler";
import { InMemoryIncidentEventStore, InMemoryIncidentStateMachine, InMemoryIncidentStateStore } from "../persistence/memory/InMemoryIncidentStateMachine";

export async function registerConsumers(logger: Logger) {
    // Domain
    // const bifastAdvancedPolicy = new AdvancedBifastPolicy();
    // const incidentPolicy = new IncidentPolicy()
    // =========================== REPOSITORY ===================
    const incidentRepo = new IncidentPrismaRepository();
    const eventStore: EventStore = new EventStorePrismaRepository();
    const dedupLock: DedupLockDb = new DedupLockDb();
    const stateStore: MonitoringStateStore = new MonitoringStatePrismaRepository();
    const inMemoryWagComplaint: InMemoryWagComplaintStoreRepository = new InMemoryWagComplaintStoreRepository();

    const inMemoryIncStateStore = new InMemoryIncidentStateStore();
    const inMemoryIncEventStore = new InMemoryIncidentEventStore()
    const inMemoryIncStateMachine = new InMemoryIncidentStateMachine(
        inMemoryIncStateStore, inMemoryIncEventStore
    )
    // =========================== SERVICE ===================
    const sliding: SlidingWindowEvaluator = new SlidingWindowEvaluator(
        eventStore, Number(ENV.SLIDING_WINDOW_MS)
    );
    const dedupSvc: DeduplicationService = new DeduplicationService(dedupLock);
    // =========================== CLIENT ===================
    const remedyGateway: IncidentGateway = new RemedyIncidentClient();
    const nauraGateway: NauraGateway = new NauraClient(logger, [
        ENV.BROADCAST_WHATSAPP_GROUP_APPIUM,
        // ENV.BROADCAST_WHATSAPP_GROUP_COMCEN,
        // ENV.BROADCAST_WHATSAPP_GROUP_MANDIRI_CARE,
        // ENV.BROADCAST_WHATSAPP_GROUP_PTR_BROADCAST,
    ])
    const elasticMatricService = new ElasticMetricClient(logger, [
        avgRespTimeConfig,
        inquiryDanaErrorConfig
    ], BIFAST_ELASTIC_CLIENT_CRAWLING);
    const wagHelpDeskService = new WagHelpdeskClient(inMemoryWagComplaint);
    // WhatsApp setup
    const waClient = new WhatsAppClientV2("http://localhost:3000", logger);
    waClient.start();
    const whatsappNotify = new WhatsAppNotificationGateway(waClient, ENV.ALERT_WA_NUMBER)
    // =========================== USECASE ===================
    const advancedBifastVerify = new AdvancedBifastVerifier(
        elasticMatricService, 
        wagHelpDeskService, 
        incidentRepo,
        inMemoryIncStateMachine,
        logger,
    )
    const verifyBifastIncidentUseCase = new VerifyBifastIncidentUseCase(
        advancedBifastVerify, 
        nauraGateway,
        incidentRepo
    )
    const processMonitoringEvent = new ProcessMonitoringEvent(
        eventStore,
        stateStore,
        sliding,
        dedupSvc,
        remedyGateway,
        nauraGateway,
        whatsappNotify,
        incidentRepo, //incidentRepo,
        verifyBifastIncidentUseCase,
        Number(process.env.FLAP_THRESHOLD ?? 3)
    );

    // =========================== SCHEDULER ===================
    const monitoringEvent = new CleanupMonitoringJob(eventStore)
    const biFastHealthChecker = new BiFastHealthChecker(nauraGateway)
    const closeRecoveryScheduler = new CloseRecoveryScheduler(
        biFastHealthChecker,
        processMonitoringEvent,
        logger
    )
    const bifastVerificationJob = new BifastVerificationJob(
        verifyBifastIncidentUseCase, 
        biFastHealthChecker,
        logger
    );
    const bifastMessageHandler = new BifastMessageHandler(
        processMonitoringEvent, closeRecoveryScheduler, bifastVerificationJob,
        stateStore, inMemoryWagComplaint, inMemoryIncStateMachine, logger
    )
    const bifastConsumer = new BifastConsumer(
        waClient, 
        bifastMessageHandler
    );
    bifastConsumer.start();

    // QRIS polling (as before)
    const qrisConsumer = createQrisHealthConsumer(processMonitoringEvent);
    // startQrisPolling(qrisConsumer);

    // Start resolve job
    const resolveUsecase = new ResolveIncident(incidentRepo, eventStore, Number(ENV.STABLE_OPEN_MS));
    // assume startResolveJob in scheduler:
    startResolveJob(resolveUsecase);
    startCleanupEventsJob(monitoringEvent, 24 * 60 * 60 * 100, logger)
}