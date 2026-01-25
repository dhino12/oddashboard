import { MonitoringEvent } from "../../domain/monitoring/MonitoringEvent";

export interface EventStore {
    append(event: MonitoringEvent): Promise<void>
    countInWindow(source: string, entity: string, windowMs: number): Promise<number>
    cleanupOlderThan(source: string, entity: string, olderThanMs: number): Promise<void>
}