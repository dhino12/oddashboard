import { MonitoringEvent } from "../../domain/monitoring/MonitoringEvent";

export interface EventStore {
    append(event: MonitoringEvent): Promise<void>
    countInWindow(source: string, entity: string, windowMs: number): Promise<number>
    cleanupSourceOlderThan(source: string, entity: string, olderThanMs: number): Promise<void>
    cleanupOlderThan(ms: number): Promise<void>;
}