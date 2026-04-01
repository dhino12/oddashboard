import { Logger } from "winston";
import { AdvancedBifastVerifier } from "../../application/usecases/AdvancedBifastVerifier/AdvancedBifastVerifier";
import { ENV } from "../../config/env";
import { HealthChecker } from "../external/healthcheck/BiFastHealthChecker";
import findBiFastAbbreviationByBankName from "../../config/bifastlist";
import { VerifyBifastIncidentUseCase } from "../../application/usecases/AdvancedBifastVerifier/VerifyBifastIncidentUseCase";
import { SchedulerPort } from "../../application/ports/SchedulerPort";
import { StateTrackerUseCase } from "../../application/usecases/StateTrackerUseCase/StateTrackerUseCase";

type VerificationSession = {
    startedAt: number;
    lastResult: "WAIT" | "CONFIRMED_INCIDENT" | "FALSE_POSITIVE";
};

export class BifastVerificationJob implements SchedulerPort {
    private readonly jobs = new Map<string, NodeJS.Timeout>();
    private sessions = new Map<string, VerificationSession>();
    private readonly observationMs = 5 * 60 * 1000;

    constructor(
        private readonly verifier: VerifyBifastIncidentUseCase,
        private readonly healthChecker: HealthChecker,
        private readonly logger: Logger
    ) {}

    start(source: string, entity: string, timestamp: number) {
        const key = `${source}:${entity}`;
        let intervalCount = 0
        if (this.jobs.has(key)) return;
        this.sessions.set(key, {
            startedAt: Date.now(),
            lastResult: "WAIT"
        });

        const timer = setInterval(async () => {
            intervalCount++
            try {
                this.logger.info(`[BiFASTVerificationJob:start] ⏳ RUNNING JOB - ${key}`);
                const callBiFastASPChecking = await this.healthChecker.callBiFastASP("")
                const bankName = findBiFastAbbreviationByBankName(entity)
                const isOpen = await this.healthChecker.isServiceOpenV2(entity, callBiFastASPChecking)
                if (isOpen) {
                    this.logger.info(`[BiFASTVerificationJob:start] 🛑 STOP Service ${key} already ${isOpen}`);
                    this.stop(source, entity);
                    intervalCount = 0
                    return;
                }
                const result = await this.verifier.execute(source, bankName, {
                    interval: intervalCount, 
                    isOpen
                });
                const session = this.sessions.get(key);
                if (!session) return;
                session.lastResult = result;
                const elapsed = Date.now() - session.startedAt;
                const duration = new Date(elapsed).toISOString().substr(11, 8)
                this.logger.info(`[BiFASTVerificationJob:start] Verification running ${key} → ${result}, elapsed ${duration}ms`);
                console.log(`time to break ? `, !(elapsed < this.observationMs));
                if (
                    elapsed < this.observationMs && 
                    result !== "CONFIRMED_INCIDENT" && 
                    result !== "FALSE_POSITIVE"
                ) return;
                if (
                    session.lastResult === "CONFIRMED_INCIDENT" ||
                    session.lastResult === "FALSE_POSITIVE"
                ) {
                    this.logger.info(`[BiFASTVerificationJob:start] Final decision for ${key}: ${session.lastResult}`);
                    this.logger.info(`[BiFASTVerificationJob:start] 🛑 STOP JOB ${key} after ${duration}`);
                    this.stop(source, entity);
                    intervalCount = 0
                }
            } catch (error:any) {
                this.logger.error(`[BiFASTVerificationJob:start] ❌ ${error.message}`, {error});
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