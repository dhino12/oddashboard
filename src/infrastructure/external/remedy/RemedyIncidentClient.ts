import axios from "axios";
import { RemedyAuthClient } from "./RemedyAuthClient";
import { RemedyTokenStore } from "./RemedyTokenStore";
import { IncidentGateway, OpenIncidentPayload } from "../../../application/ports/IncidentGateway";

export class RemedyIncidentClient implements IncidentGateway {
    private auth = new RemedyAuthClient();
    private store = new RemedyTokenStore();

    async openIncident(payload: OpenIncidentPayload) {
        let token = await this.store.getToken();
        if (!token) {
        const fresh = await this.auth.login();
        await this.store.saveToken(fresh.token, fresh.exp);
        token = fresh.token;
        }

        try {
        await axios.post(`${process.env.REMEDY_BASE}/incident/open`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        } catch (err: any) {
        if (err.response?.status === 401) {
            // refresh once
            const fresh = await this.auth.login();
            await this.store.saveToken(fresh.token, fresh.exp);
            await axios.post(`${process.env.REMEDY_BASE}/incident/open`, payload, {
                headers: { Authorization: `Bearer ${fresh.token}` },
            });
        } else {
            throw err;
        }
        }
    }
}
