import { Incident } from "./Incident";

export interface IncidentRepository {
    hasOpenIncident(source: string, entity: string): Promise<boolean>;
    create(inc: Incident): Promise<void>
    listOpenIncidents(): Promise<Incident[]>
    save(inc: Incident): Promise<void>
}