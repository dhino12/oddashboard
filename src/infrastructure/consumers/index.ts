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
import { EventStorePrisma } from "../persistence/mysql/EventStorePrisma";
import { DedupLockDb } from "../persistence/mysql/DedupLockPrisma";
import { MonitoringStatePrisma } from "../persistence/mysql/MonitoringStatePrisma";
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
import { ElasticMetricService } from "../external/elastic/ElasticMetricService";
import { BIFAST_ELASTIC_CLIENT_CRAWLING } from "../../config/bifastlist";
import { WagHelpdeskService } from "../external/elastic/WagHelpdeskService";
import { InMemoryWagComplaintStore } from "../persistence/memory/InMemoryWagComplaint";
import { avgRespTimeConfig, inquiryDanaErrorConfig, MetricConfig } from "../external/elastic/MetricConfig";

export async function registerConsumers(logger: Logger) {
    // instantiate infra implementations
    const eventStore: EventStore = new EventStorePrisma();
    const dedupLock: DedupLockDb = new DedupLockDb();
    const stateStore: MonitoringStateStore = new MonitoringStatePrisma();
    const incidentRepo = new IncidentPrismaRepository();

    const sliding: SlidingWindowEvaluator = new SlidingWindowEvaluator(
        eventStore, Number(ENV.SLIDING_WINDOW_MS)
    );
    const dedupSvc: DeduplicationService = new DeduplicationService(dedupLock);
    const remedyGateway: IncidentGateway = new RemedyIncidentClient();
    const nauraGateway: NauraGateway = new NauraClient(logger, [
        ENV.BROADCAST_WHATSAPP_GROUP_APPIUM,
        ENV.BROADCAST_WHATSAPP_GROUP_COMCEN,
        ENV.BROADCAST_WHATSAPP_GROUP_MANDIRI_CARE,
        ENV.BROADCAST_WHATSAPP_GROUP_PTR_BROADCAST,
    ])
    const inMemoryWagComplaint = new InMemoryWagComplaintStore();
    const elasticMatricService = new ElasticMetricService(logger, [
        avgRespTimeConfig,
        inquiryDanaErrorConfig
    ], BIFAST_ELASTIC_CLIENT_CRAWLING);
    const wagHelpDeskService = new WagHelpdeskService(inMemoryWagComplaint);

    // WhatsApp setup
    const waClient = startWhatsApp(logger);
    const whatsappNotify = new WhatsAppNotificationGateway(waClient, ENV.ALERT_WA_NUMBER)

    // create the main usecase
    const advancedBifastVerify = new AdvancedBifastVerifier(elasticMatricService, wagHelpDeskService, incidentRepo)
    const processMonitoringEvent = new ProcessMonitoringEvent(
        eventStore,
        stateStore,
        sliding,
        dedupSvc,
        remedyGateway,
        nauraGateway,
        whatsappNotify,
        incidentRepo, //incidentRepo,
        Number(process.env.FLAP_THRESHOLD ?? 3)
    );

    // Cleanup setup
    const monitoringEvent = new CleanupMonitoringJob(eventStore)
    const biFastHealthChecker = new BiFastHealthChecker(nauraGateway)
    const closeRecoveryScheduler = new CloseRecoveryScheduler(
        biFastHealthChecker,
        processMonitoringEvent,
        logger
    )
    const bifastVerificationJob = new BifastVerificationJob(
        advancedBifastVerify, 
        biFastHealthChecker,
        logger
    );
    const bifastConsumer = new BifastConsumer(
        waClient, 
        processMonitoringEvent,
        closeRecoveryScheduler,
        bifastVerificationJob,
        stateStore,
        inMemoryWagComplaint
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
