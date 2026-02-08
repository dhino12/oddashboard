import axios from "axios";
import { RemedyAuthClient } from "./RemedyAuthClient";
import { RemedyTokenStore } from "./RemedyTokenStore";
import { IncidentGateway, IncidentParsedPayload, OpenIncidentPayload, UserAccountPayload } from "../../../application/ports/IncidentGateway";
import { ENV } from "../../../config/env";

export class RemedyIncidentClient implements IncidentGateway {
    private auth = new RemedyAuthClient();
    private store = new RemedyTokenStore();

    async openIncident(payload: IncidentParsedPayload): Promise<string|null> {
        let userToken = await this.store.getToken();
        console.log("DEBUG parsedPayload:", payload);
        if (!userToken) {
            const fresh = await this.auth.login();
            await this.store.saveToken(fresh.token, fresh.exp, fresh.username);
            userToken = fresh.token;
        }

        try {
            const response = await axios.post(`${ENV.REMEDY_BASE}arsys/v1/entry/HPD:IncidentInterface_Create?fields=values(Incident Number)`, {values: payload}, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            return await response.data.values['Incident Number']
        } catch (err: any) {
            if (err.response?.status === 401) {
                // refresh once
                await this.store.cleanUp();
                const fresh = await this.auth.login();
                await this.store.saveToken(fresh.token, fresh.exp, fresh.username);
                const response = await axios.post(`${ENV.REMEDY_BASE}arsys/v1/entry/HPD:IncidentInterface_Create?fields=values(Incident Number)`, {values: payload}, {
                    headers: { Authorization: `Bearer ${fresh.token}` },
                });
                return await response.data.values['Incident Number']
            } else {
                throw err;
            }
            return null
        }
    }

    mapOpenIncidentPayload(user: UserAccountPayload, incPayload: OpenIncidentPayload): IncidentParsedPayload {
        let impact, urgency 
        switch (incPayload.priority) {
        case 'Very High':
            impact = '1-Extensive/Widespread'
            urgency = '1-Critical'
            break
        case 'High':
            impact = '2-Significant/Large'
            urgency = '2-High'
            break
        case 'Medium':
            impact = '3-Moderate/Limited'
            urgency = '3-Medium'
            break
        case 'Low':
            impact = '4-Minor/Localized'
            urgency = '4-Low'
            break
        default:
            impact = '4-Minor/Localized'
            urgency = '4-Low'
            break
        }
        const parsedPayload = { 
            'Person ID' : user['Person ID'],
            'First_Name' : user['First Name'],
            'Last_Name' : user['Last Name'],
            'Service_Type' : 'User Service Restoration',
            'Status' : 'In Progress',
            'Impact': impact,
            'MDR_ImpactedApplications': incPayload.impactedApplications,
            'Urgency': urgency,
            'MDR_Impact': incPayload.impact,
            'Description': incPayload.description,
            'MDR_DateIncStarted': incPayload.incTimestampStarted,
            'Reported Source': 'Officer on Duty',
            'Assigned Support Company': 'PT. BANK MANDIRI, TBK',
            'Assigned Support Organization': 'IT INFRASTRUCTURE GROUP',
            'Assigned Group': 'IT OCD - COMMAND CENTER',
            'Assigned Group ID': 'SGP000000003114',
            'Assignee': user['Full Name'],
            'Assignee Login ID' : user['Remedy Login ID'],
            'Assigned To' : user['Remedy Login ID'],
            'Matrix Root Cause__c': incPayload.categoryCause,
            //'Category' : 'Production Issue',
            // 'Penyebab Masalah' : incPayload.incidentCaused,
            'MDR_Cause': incPayload.cause,
            'MDR_3rdParty_PIC': incPayload.thirdPartyPIC
        }
        return parsedPayload
    }
}
