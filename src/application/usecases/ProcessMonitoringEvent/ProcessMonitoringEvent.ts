import { v4 as uuidv4 } from "uuid";
import { MonitoringEvent } from "../../../domain/monitoring/MonitoringEvent";
import { MonitoringState } from "../../../domain/monitoring/MonitoringState";
import { Incident } from "../../../domain/incident/Incident";
import { IncidentPolicy } from "../../../domain/incident/IncidentPolicy";

import { EventStore } from "../../ports/EventStore";
import { MonitoringStateStore } from "../../ports/MonitoringStateStore";
import { DeduplicationService } from "../../services/DeduplicationService";
import { SlidingWindowEvaluator } from "../../services/SlidingWindowEvaluator";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { IncidentGateway } from "../../ports/IncidentGateway";

import { ProcessMonitoringEventDTO } from "./ProcessMonitoringEventDTO";
import { ENV } from "../../../config/env";
import { NotificationGateway } from "../../ports/NotificationGateway";

export class ProcessMonitoringEvent {
    constructor(
        private readonly eventStore: EventStore,
        private readonly stateStore: MonitoringStateStore,
        private readonly evaluator: SlidingWindowEvaluator,
        private readonly dedup: DeduplicationService,
        private readonly incidentGateway: IncidentGateway,
        private readonly notificationGateway: NotificationGateway,
        private readonly incidentRepo: IncidentRepository,
        private readonly threshold: number = 3
    ) {}

    async execute(dto: ProcessMonitoringEventDTO): Promise<void> {
        const eventId = dto.id ?? uuidv4();
        const occurredAt = Date.now();

        const event = new MonitoringEvent(
            eventId,
            dto.source,
            dto.entity,
            dto.status,
            occurredAt
        );

        /**
         * 1️⃣ Load previous monitoring state
         */
        const prevState = await this.stateStore.get(
            event.source,
            event.entity
        );

        /**
         * 2️⃣ First time seeing this entity → just record state
         */
        if (!prevState) {
            await this.stateStore.set(
                event.source,
                event.entity,
                new MonitoringState(this.mapToIncidentStatus(event.status), occurredAt)
            );
            return;
        }

        /**
         * 3️⃣ Ignore duplicate status (anti-spam)
         * CLOSED -> CLOSED
         * OPEN   -> OPEN
         */
        console.log(prevState.lastStatus === event.status, " - ", prevState.lastStatus, event.status);
        
        if (prevState.lastStatus === event.status) {
            return;
        }

        /**
         * 4️⃣ Detect meaningful transition
         * Business rule:
         * - BIFAST  : OPEN -> CLOSED (flapping)
         * - QRIS    : SUCCESS -> FAILURE
         */
        const isTransition = IncidentPolicy.isCountableTransition(
            `${prevState.lastStatus}`,
            event.status,
            event.source
        );

        /**
         * Always update latest state
         */
        await this.stateStore.set(
            event.source,
            event.entity,
            new MonitoringState(this.mapToIncidentStatus(event.status), occurredAt)
        );

        /**
         * If transition is NOT countable → stop here
         */
        if (!isTransition) {
            return;
        }

        /**
         * 5️⃣ Append ONLY transition event to sliding window store
         */
        await this.eventStore.append(event);

        /**
         * 6️⃣ Evaluate sliding window threshold
         */
        const exceeded = await this.evaluator.isThresholdExceeded(
            event.source,
            event.entity,
            this.threshold
        );
        console.log(exceeded, occurredAt, this.threshold, " - ", await this.eventStore.countInWindow(event.source, event.entity, 60 * 60 * 1000));
        
        if (!exceeded) {
            return;
        }
        console.log(`✅ Treshold tercapai`);

        /**
         * 🔁 Recovery signal
         * Jika service kembali OPEN dan masih ada open incident → resolve sekarang
         */
        if (event.status == "OPEN") {
            const openIncident = await this.incidentRepo.findOpenIncident(
                event.source, event.entity
            )
            if (openIncident) {
                openIncident.resolve()
                await this.incidentRepo.save(openIncident)
            }
        }

        /**
         * 7️⃣ Prevent duplicate open incident
         */
        const hasOpenIncident = await this.incidentRepo.hasOpenIncident(event.source,event.entity);
        console.log(`hasOpenIncident: ${hasOpenIncident}`);
        
        if (!IncidentPolicy.canCreateIncident(hasOpenIncident)) {
            return;
        }

        /**
         * 8️⃣ Dedup lock (race condition protection)
         */
        const locked = await this.dedup.acquireIncidentLock(event.source,event.entity,ENV.DEDUP_LOCK_TTL_MS);

        if (!locked) {
            return;
        }

        /**
         * 9️⃣ Create incident (DB = source of truth)
         */
        const incident = new Incident(
            uuidv4(),
            event.source,
            event.entity,
            `Unstable state detected (${this.threshold} flaps)`
        );

        await this.incidentRepo.create(incident);
        await this.notificationGateway.notifyIncident({
            source: event.source,
            entity: event.entity,
            message: null
        });

        /**
         * 🔟 Best-effort call external system (Remedy)
         * Never rollback DB if this fails
         */
        try {
            await this.incidentGateway.openIncident({
                id: incident.id,
                title: incident.entity,
                severity: "P3",
            });
        } catch (err) {
        // log + mark external failure if needed
        }
    }

    private mapToIncidentStatus(status: string): "OPEN" | "CLOSED" | null {
        if (status === "FAILURE") return "CLOSED";
        if (status === "CLOSED") return "CLOSED";
        if (status === "OPEN") return "OPEN";
        if (status === "BUKA") return "OPEN";
        return null;
    }
}
