export interface SchedulerPort {
    start(source: string, entity: string, timestamp: number): void
    stop(source: string, entity: string): void
}