import { Source } from "../../domain/monitoring/MonitoringEvent";
import { MonitoringState } from "../../domain/monitoring/MonitoringState";

export interface MonitoringStateStore {
    get(source: Source, entity: string): Promise<MonitoringState | null>;
    set(source: Source, entity: string, state: MonitoringState): Promise<void>;
}
