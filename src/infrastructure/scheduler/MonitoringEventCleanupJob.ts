import { Logger } from "winston";
import { CleanupMonitoringJob } from "../../application/usecases/CleanupMonitoringJob/CleanupMonitoringJob";

/**
 *  Cleanup Temporary event close -> open -> close, after 24 hours
 * @param cleanup 
 * @param retentionMs 
 * @param logger 
 */
export function startCleanupEventsJob(cleanup: CleanupMonitoringJob, retentionMs: number, logger: Logger) {
    setInterval(async () => {
        try {
            const deleted = await cleanup.execute(retentionMs);
            logger.info(`[cleanup] deleted ${deleted} monitoring events`);
        } catch (err) {
            console.error("resolve job error", err);
        }
    }, 6 * 60 * 60 * 1000); // run every minute
}
