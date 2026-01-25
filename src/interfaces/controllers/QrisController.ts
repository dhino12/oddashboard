import { ProcessMonitoringEvent } from "../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
// in real app, this should be injected via DI

export class QrisController {
    // temporary stub: in registerRoutes you should pass usecase
    async reportHealth(req: any, res: any) {
        // expected body: { ok: boolean }
        // In production wiring, call processMonitoring.execute(...)
        res.json({ ok: true });
    }
}
