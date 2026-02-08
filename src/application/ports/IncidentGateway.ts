export type IncidentParsedPayload = {
    'Person ID': string
    'First_Name': string
    'Last_Name': string
    'Service_Type': string
    'Status': string
    'Impact': string
    'MDR_ImpactedApplications': string
    'Urgency': string
    'MDR_Impact': string
    'Description': string
    'MDR_DateIncStarted': string
    'Reported Source': string
    'Assigned Support Company': string
    'Assigned Support Organization': string
    'Assigned Group': string
    'Assigned Group ID': string
    'Assignee': string
    'Assignee Login ID': string
    'Assigned To': string
    'Matrix Root Cause__c': string
    'MDR_Cause': string
    'MDR_3rdParty_PIC': string
}

export type OpenIncidentPayload = {
    idDraft: string,
    description: string,
    priority: string,
    categoryCause: string,
    impactedApplications: string,
    impact: string,
    cause: string,
    thirdPartyPIC: string,
    incidentCaused: string,
    incTimestampStarted: string,
}

export type UserAccountPayload = {
    "Person ID": string,
    "First Name": string,
    "Last Name": string,
    "Full Name": string,
    "Remedy Login ID": string,
}

export interface IncidentGateway {
    openIncident(payload: IncidentParsedPayload): Promise<string|null>
    mapOpenIncidentPayload(user: UserAccountPayload, incPayload: OpenIncidentPayload): IncidentParsedPayload
}