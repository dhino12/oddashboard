import axios from "axios";
import { RemedyAuthClient } from "./RemedyAuthClient";
import { RemedyTokenStore } from "./RemedyTokenStore";
import { IncidentGateway, OpenIncidentPayload } from "../../../application/ports/IncidentGateway";

export class RemedyIncidentClient implements IncidentGateway {
    private auth = new RemedyAuthClient();
    private store = new RemedyTokenStore();

    async openIncident(payload: OpenIncidentPayload) {
        let userToken = await this.store.getToken();
        if (!userToken) {
            const fresh = await this.auth.login();
            await this.store.saveToken(fresh.token, fresh.exp, fresh.username);
            userToken = fresh.token;
        }

        try {
            await axios.post(`${process.env.REMEDY_BASE}/incident/open`, payload, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
        } catch (err: any) {
            if (err.response?.status === 401) {
                // refresh once
                await this.store.cleanUp();
                const fresh = await this.auth.login();
                await this.store.saveToken(fresh.token, fresh.exp, fresh.username);
                await axios.post(`${process.env.REMEDY_BASE}/incident/open`, payload, {
                    headers: { Authorization: `Bearer ${fresh.token}` },
                });
            } else {
                throw err;
            }
        }
    }
}
