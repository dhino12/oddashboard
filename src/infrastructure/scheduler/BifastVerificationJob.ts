import { Logger } from "winston";
import { AdvancedBifastVerifier } from "../../application/usecases/AdvancedBifastVerifier/AdvancedBifastVerifier";
import { ENV } from "../../config/env";
import { HealthChecker } from "../external/healthcheck/BiFastHealthChecker";
import findBiFastAbbreviationByBankName from "../../config/bifastlist";
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
        private readonly healthChecker: HealthChecker,
        private readonly logger: Logger
    ) {}

    start(source: string, entity: string) {
        const key = `${source}:${entity}`;

        this.logger.info(`RUNNING JOB BIFAST_VERIFICATION BEFORE IF`);
        if (this.jobs.has(key)) return;
        this.logger.info(`RUNNING JOB BIFAST_VERIFICATION AFTER IF`);

        this.sessions.set(key, {
            startedAt: Date.now(),
            lastResult: "WAIT"
        });

        const timer = setInterval(async () => {
            try {
                this.logger.info(`RUNNING JOB BIFAST_VERIFICATION`);
                const callBiFastASPChecking = await this.healthChecker.callBiFastASP("")
                // const isOpen = false
                const isOpen = await this.healthChecker.isServiceOpenV2(entity, callBiFastASPChecking)
                if (isOpen) {
                    this.logger.info(`Service ${key} already 🛑 STOP Verification`);
                    this.stop(source, entity);
                    return;
                }
                const result = await this.verifier.verfiy(source, findBiFastAbbreviationByBankName(entity));
                const session = this.sessions.get(key);
                if (!session) return;
                session.lastResult = result;
                const elapsed = Date.now() - session.startedAt;
                this.logger.info(`Verification running ${key} → ${result}, elapsed ${elapsed}ms`);
                console.log(`time to break ? `, !(elapsed < this.observationMs));

                if (elapsed < this.observationMs) return;
                if (
                    session.lastResult === "CONFIRMED_INCIDENT" ||
                    session.lastResult === "FALSE_POSITIVE"
                ) {
                    this.logger.info(`Final decision for ${key}: ${session.lastResult}`);
                    this.logger.info(`🛑 STOP JOB BiFAST_VERIFICATION`);
                    this.stop(source, entity);
                }
            } catch (err) {
                this.logger.error(err);
            }
        }, 60 * 1000);

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