export type ProcessMonitoringEventDTO = {
    id?: string;
    source: "BIFAST" | "QRIS";
    entity: string;
    status: "OPEN" | "CLOSED" | "SUCCESS" | "FAILURE";
    occurredAt?: number;
};
