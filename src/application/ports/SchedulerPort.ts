export interface SchedulerPort {
    start(source: string, entity: string): void
    stop(source: string, entity: string): void
}