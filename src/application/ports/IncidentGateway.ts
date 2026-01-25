export type OpenIncidentPayload = {
    id: string,
    title: string,
    severity: string
}

export interface IncidentGateway {
    openIncident(payload: OpenIncidentPayload): Promise<void>
}