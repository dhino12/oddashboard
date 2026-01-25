import { Source } from "../monitoring/MonitoringEvent";

export class IncidentPolicy {
    static isCountableTransition(
        prev: string,
        current: string,
        source: Source
    ): boolean {
        if (source === "BIFAST") {
            return prev === "OPEN" && current === "CLOSED";
        }

        if (source === "QRIS") {
            return prev === "SUCCESS" && current === "FAILURE";
        }

        return false;
    }

    static canCreateIncident(hasOpenIncident: boolean): boolean {
        return !hasOpenIncident;
    }
}
