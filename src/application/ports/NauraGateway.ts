export type NauraPayload = {
    idDraft: string,
    incidentNumber?: string,
    incidentDescription: string,
    impactedApplications: string,
    priority: string,
    typeIncident: string,
    impact: string,
    suspect: string,
    waktuTerindikasi: string,
    durasiGangguan: string,
    konfirmasiPIC: string,
    status: string,
    solusiNextUpdate: string,
    ticketStatus: string,
    officerName: string,
}

export interface NauraGateway {
    postToNaura(payload: NauraPayload): Promise<void>
}