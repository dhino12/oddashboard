// WhatsappSender Contract
export interface NotificationGateway {
    notifyIncident(payload: {
        source: string,
        entity: string,
        message?: string | null,
    }): Promise<void>
}