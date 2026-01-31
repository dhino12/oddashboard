import axios from "axios";
import { ENV } from "../../../config/env";

export class RemedyAuthClient {
    async login() {
        const params = new URLSearchParams();
        params.append("username", ENV.REMEDY_USER);
        params.append("password", ENV.REMEDY_PASS);

        const res = await axios.post(`${ENV.REMEDY_BASE}/jwt/login`, params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            // add rejectUnauthorized false if self-signed in dev (not recommended in prod)
        });
        const token = res.data?.access_token;
        // parse exp from JWT (optional)
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        const exp = payload.exp; // seconds
        return { token, exp, username: ENV.REMEDY_USER };
    }
}
