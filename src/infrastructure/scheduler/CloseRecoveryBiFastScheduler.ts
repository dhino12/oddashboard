import { Logger } from "winston";
import { HealthChecker } from "../external/healthcheck/BiFastHealthChecker";
import { ProcessMonitoringEvent } from "../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
import { SchedulerPort } from "../../application/ports/SchedulerPort";

export type SourceHealthCheck = "BIFAST" | "QRIS";
type Key = string;

export class CloseRecoveryScheduler implements SchedulerPort {
    private timers = new Map<Key, NodeJS.Timeout>()
    constructor(
        private healthChecker: HealthChecker,
        private processMonitoringEvent: ProcessMonitoringEvent,
        private logger: Logger,
    ){}

    start(source: SourceHealthCheck, entity: string) {
        const key = `${source}:${entity}`;
        if (this.timers.has(key)) return;

        const timer = setInterval(async () => {
            try {
                this.logger.info("[CloseRecoveryScheduler:start] ⏳ RUNNING JOB")
                const isOpen = await this.healthChecker.isServiceOpen(source, entity);
                this.logger.info(`[CloseRecoveryScheduler:start] ${key} has been ${isOpen}`)
                if (isOpen) {
                    this.processMonitoringEvent.execute({
                        source, entity, status: "OPEN"
                    })
                    this.logger.info(`[CloseRecoveryScheduler:start] 🛑 STOP ${key} recoverd via health API `)
                    this.stop(source, entity)
                }
            } catch (error) {
                console.error(`[CloseRecoveryScheduler:start] health check failed for ${key}`, error);
            }
        }, 1 * 60 * 1000);
        this.timers.set(key, timer)
    }

    stop(source: SourceHealthCheck, entity: string) {
        const key = `${source}:${entity}`;
        const timer = this.timers.get(key);
        this.logger.info("[CloseRecoveryScheduler:stop] 🛑 STOP " + timer)
        if (timer) {
            clearInterval(timer);
            this.timers.delete(key)
        }
    }
}