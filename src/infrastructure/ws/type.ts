export type WhatsAppEventPayload = {
    event: {
        Info: {
            Chat: string
            Sender: string
            IsFromMe: boolean
            IsGroup: boolean
            AddressingMode: string
            SenderAlt: string
            RecipientAlt: string
            BroadcastListOwner: string
            BroadcastRecipients: string[] | null
            ID: string
            ServerID: number
            Type: string
            PushName: string
            Timestamp: string
            Category: string
            Multicast: boolean
            MediaType: string
            Edit: string
            MsgBotInfo: {
                EditType: string
                EditTargetID: string
                EditSenderTimestampMS: string
            }
            MsgMetaInfo: {
                TargetID: string
                TargetSender: string
                TargetChat: string
                DeprecatedLIDSession: string | null
                ThreadMessageID: string
                ThreadMessageSenderJID: string
            }
            VerifiedName: string | null
            DeviceSentMeta: unknown | null
        }
        Message: {
        conversation: string
        extendedTextMessage: {
            text: string
        }
        messageContextInfo: {
                deviceListMetadata: {
                    senderKeyHash: string
                    senderTimestamp: number
                    recipientKeyHash: string
                    recipientTimestamp: number
                }
                deviceListMetadataVersion: number
                messageSecret: string
            }
        }
        IsEphemeral: boolean
        IsViewOnce: boolean
        IsViewOnceV2: boolean
        IsViewOnceV2Extension: boolean
        IsDocumentWithCaption: boolean
        IsLottieSticker: boolean
        IsBotInvoke: boolean
        IsEdit: boolean
        SourceWebMsg: unknown | null
        UnavailableRequestID: string
        RetryCount: number
        NewsletterMeta: unknown | null
        RawMessage: {
            conversation: string
            messageContextInfo: {
                deviceListMetadata: {
                    senderKeyHash: string
                    senderTimestamp: number
                    recipientKeyHash: string
                    recipientTimestamp: number
                }
                deviceListMetadataVersion: number
                messageSecret: string
            }
        }
    }
    type: string
}