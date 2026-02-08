export type ProcessMonitoringEventDTO = {
    id?: string;
    source: "BIFAST" | "QRIS";
    entity: string;
    status: "OPEN" | "CLOSED" | "SUCCESS" | "FAILURE";
    occurredAt?: number;
};

export type IncidentDTO = {
    bankName:string,
    incidentNumber:string,
    incidentDescription:string,
    impactedApplication:string,
    priority:string,
    typeIncident:string,
    impact:string,
    suspect:string,
    incTimestamp:string 
    incTimestamps:string,
    incTimestampNextUpdate:string,
    closedTimestamp:string,
    estimation:string,
    picConfirmation:string,
    statusNextUpdate:string,
    status:string,
}