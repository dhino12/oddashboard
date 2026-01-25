import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { EventStore } from "../../ports/EventStore";
import { ENV } from "../../../config/env";

export class ResolveIncident {
    constructor(
        private incidentRepo: IncidentRepository, 
        private eventStore: EventStore, 
        private stableMs = ENV.STABLE_OPEN_MS
    ) {}

    async run() {
        const open = await this.incidentRepo.listOpenIncidents();
        for (const inc of open) {
            const failures = await this.eventStore.countInWindow(inc.source, inc.entity, this.stableMs);
            if (failures === 0) {
                inc.resolve();
                await this.incidentRepo.save(inc);
            }
        }
    }
}
