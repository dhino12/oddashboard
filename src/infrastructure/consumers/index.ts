// src/infrastructure/consumers/index.ts
import { DedupLockRedis } from "../persistence/redis/DedupLockRedis";
import { IncidentPrismaRepository } from "../persistence/mysql/IncidentPrismaRepository";
import { SlidingWindowEvaluator } from "../../application/services/SlidingWindowEvaluator";
import { DeduplicationService } from "../../application/services/DeduplicationService";
import { RemedyIncidentClient } from "../external/remedy/RemedyIncidentClient";
import { ProcessMonitoringEvent } from "../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
import { BifastConsumer } from "./whatsapp/BifastConsumer";
import { WhatsAppClient } from "./whatsapp/WhatsappClient";
import { startQrisPolling } from "../scheduler/QrisHealthCheckJob";
import { createQrisHealthConsumer } from "./api/QrisHealthConsumer";
import { ResolveIncident } from "../../application/usecases/ResolveIncident/ResolveIncident";
import { getRedis } from "../../config/redis";
import { EventStoreRedis } from "../persistence/redis/EventStoreRedis";
import { getPrisma } from "../../config/prisma";
import { Logger } from "winston";
import { MonitoringState } from "../../domain/monitoring/MonitoringState";
import { MonitoringStateRedis } from "../persistence/redis/MonitoringStateRedis";
import { startWhatsApp } from "./whatsapp";
import { IncidentGateway } from "../../application/ports/IncidentGateway";
import { EventStore } from "../../application/ports/EventStore";

export async function registerConsumers(logger: Logger) {
    // instantiate infra implementations
    const eventStore: EventStore = new EventStoreRedis();
    const dedupLock: DedupLockRedis = new DedupLockRedis();
    const stateStore: MonitoringStateRedis = new MonitoringStateRedis();
    // const incidentRepo = new IncidentPrismaRepository();

    const sliding: SlidingWindowEvaluator = new SlidingWindowEvaluator(
        eventStore, Number(process.env.SLIDING_WINDOW_MS || 60 * 60 * 1000)
    );
    const dedupSvc: DeduplicationService = new DeduplicationService(dedupLock);
    const remedyGateway: IncidentGateway = new RemedyIncidentClient();

    // create the main usecase
    const processMonitoringEvent = new ProcessMonitoringEvent(
        eventStore,
        stateStore,
        sliding,
        dedupSvc,
        remedyGateway,
        undefined, //incidentRepo,
        Number(process.env.FLAP_THRESHOLD ?? 3)
    );

    // WhatsApp setup
    const waClient = startWhatsApp(logger);
    const bifastConsumer = new BifastConsumer(waClient, processMonitoringEvent);
    bifastConsumer.start();

    // QRIS polling (as before)
    const qrisConsumer = createQrisHealthConsumer(processMonitoringEvent);
    // startQrisPolling(qrisConsumer);

    // Start resolve job
    // const resolveUsecase = new ResolveIncident(incidentRepo, eventStore, Number(process.env.STABLE_OPEN_MS || 15 * 60 * 1000));
    // assume startResolveJob in scheduler:
    // startResolveJob(resolveUsecase);
}
