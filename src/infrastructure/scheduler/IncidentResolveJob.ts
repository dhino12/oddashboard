import { ResolveIncident } from "../../application/usecases/ResolveIncident/ResolveIncident";

export function startResolveJob(resolveUsecase: ResolveIncident) {
    setInterval(async () => {
        try {
            console.log(`RUNNING Resolve JOB`);
            
            await resolveUsecase.run();
        } catch (err) {
            console.error("resolve job error", err);
        }
    }, 60 * 1000); // run every minute
}
