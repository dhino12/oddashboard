import axios, { AxiosError } from "axios";
import { Logger } from "winston";
import { NauraGateway, NauraPayload } from "../../../application/ports/NauraGateway";

export class NauraClient implements NauraGateway {
    constructor(
        private readonly logger: Logger,
        private readonly groups: String[]
    ) {}
    async postToNaura(payload: NauraPayload): Promise<void> {
        let monMetrix = `\n*Incident :*\n${payload.incidentDescription}\n\n*Impacted Applications :*\n${payload.impactedApplications}\n\n*Severity :*\n${payload.priority}\n\n*Type Incident :*\n${payload.typeIncident}\n\n*Impact :*\n${payload.impact}\n\n*Suspect :*\n${payload.suspect}\n\n*Waktu Terindikasi :*\n${payload.waktuTerindikasi}\n\n*Durasi Gangguan :*\n${payload.durasiGangguan}\n\n*Konfirmasi / PIC :*\n${payload.konfirmasiPIC}\n\n*Status / Next Update:*\n${payload.status}\n*Solusi:*\n${payload.solusiNextUpdate}\n\nTerima kasih (${payload.officerName})`;
        this.logger.info(payload)
        let response
        for (const group of this.groups) {
            try {
                const parsedPayload = {
                    // app_name: title,
                    mon_metric: `*🚫 Incident ${payload?.incidentNumber ?? "_TEST"}*\n` + monMetrix, //Metric Name (Wajib)
                    group, //WAG TUJUAN (Value ini didapat dari tim Naura (MONSI IFS)
                    criticality: "", //Parameter ini untuk menentukan Criticality nya -> Normal | Warning | Critical
                    source_id: "robot_comcen_amtix"
                }
                this.logger.info(`naura - sent_to_group: ${group}`)
                response = await axios.post(
                    "http://naura.corp.bankmandiri.co.id/api/receiver/index.php",
                    parsedPayload
                );
                const responseJson = await response.data
                this.logger.info(`naura - ${responseJson?.message} - sent_to_group: ${group}`, {
                    statusCode: response.status,
                    url: response.config.baseURL,
                    respBody: responseJson
                })
            } catch (error: any) {
                const resTmp = error.response;
                console.log(resTmp);
                
                this.logger.error(`naura - ${resTmp?.message} - sent_to_group: ${group}`, {
                    statusCode: resTmp?.status,
                    url: response?.config?.url ?? "/remedy/naura/index.php",
                    respBody: await response?.data ?? resTmp?.data 
                })
            }
        }
    }

    async postNotifyFromNaura(message: string): Promise<void> {
        let response
        for (const group of this.groups) {
        
            const parsedPayload = {
                // app_name: title,
                mon_metric: message, //Metric Name (Wajib)
                group, //WAG TUJUAN (Value ini didapat dari tim Naura (MONSI IFS)
                criticality: "", //Parameter ini untuk menentukan Criticality nya -> Normal | Warning | Critical
                source_id: "robot_comcen_amtix"
            }
            try {
                response = await axios.post(
                    "http://naura.corp.bankmandiri.co.id/api/receiver/index.php",
                    parsedPayload
                );
                const responseJson = await response.data
                this.logger.info(`naura - ${responseJson?.message} - sent_to_group: ${group}`, {
                    statusCode: response.status,
                    url: response.config.baseURL,
                    respBody: responseJson
                })
            } catch (error) {
                this.logger.error(error)
            }
        }
    }

    // async mapNauraPayload(payload: any) {
    //     const parsedItem = {
    //         idDraft: item.idDraft,
    //         incidentNumber: item?.incidentNumber ?? "INC01210212121",
    //         incidentDescription: item.incidentDescription,
    //         impactedApplications: item.impactedApplication,
    //         priority: item.priority,
    //         typeIncident: item.typeIncident,
    //         impact: item.impact,
    //         suspect: item.suspect,
    //         waktuTerindikasi: item.timeIndication,
    //         durasiGangguan: item.estimation,
    //         konfirmasiPIC: item.picConfirmation,
    //         status: item.statusNextUpdate,
    //         solusiNextUpdate: item.statusNextUpdate,
    //         ticketStatus: item.statusDraft,
    //         user: this.officerName,
    //         groups: this.whatsappSelecteds,
    //     };
    //     return 
    // }
}