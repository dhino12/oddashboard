import { Logger } from "winston";
import { AdvancedBifastVerifier } from "../../application/usecases/AdvancedBifastVerifier/AdvancedBifastVerifier";
import { ENV } from "../../config/env";
type VerificationSession = {
    startedAt: number;
    lastResult: "WAIT" | "CONFIRMED_INCIDENT" | "FALSE_POSITIVE";
};

// application/schedulers/BifastVerificationJob.ts
export class BifastVerificationJob {
    private readonly jobs = new Map<string, NodeJS.Timeout>();
    private sessions = new Map<string, VerificationSession>();
    private readonly observationMs = 5 * 60 * 1000;

    constructor(
        private readonly verifier: AdvancedBifastVerifier,
        private readonly logger: Logger
    ) {}

    start(source: string, entity: string) {
        const key = `${source}:${entity}`;

        if (this.jobs.has(key)) return;

        this.sessions.set(key, {
            startedAt: Date.now(),
            lastResult: "WAIT"
        });

        const timer = setInterval(async () => {
            try {
                const result = await this.verifier.verfiy(source, entity);
                const session = this.sessions.get(key);
                if (!session) return;
                session.lastResult = result;
                const elapsed = Date.now() - session.startedAt;
                this.logger.info(
                    `Verification running ${key} → ${result}, elapsed ${elapsed}ms`
                );

                if (elapsed < this.observationMs) return;
                if (
                    session.lastResult === "CONFIRMED_INCIDENT" ||
                    session.lastResult === "FALSE_POSITIVE"
                ) {
                    this.logger.info(`Final decision for ${key}: ${session.lastResult}`);
                    this.stop(source, entity);
                }
            } catch (err) {
                this.logger.error(err);
            }
        }, 60 * 40000);

        this.jobs.set(key, timer);
    }

    stop(source: string, entity: string) {
        const key = `${source}:${entity}`;

        const timer = this.jobs.get(key);
        if (timer) {
            clearInterval(timer);
            this.jobs.delete(key);
        }

        this.sessions.delete(key);
    }
}