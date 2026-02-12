import axios from "axios";
import { resultAxiosRequest } from "../../../config/bifastlist";
import { NauraGateway } from "../../../application/ports/NauraGateway";
import { ENV } from "../../../config/env";

export interface HealthChecker {
    isServiceOpen(source: string, entity: string): Promise<boolean>;
}

export class BiFastHealthChecker implements HealthChecker {
    constructor(private readonly nauraGateway: NauraGateway) {
        
    }
    async isServiceOpen(source: string, entity: string): Promise<boolean> {
        // const res = await axios.post(``, {

        // })
        // const resultJson = await res.data;
        const resultJson = resultAxiosRequest;
        const findStatusBank = resultJson.data.chart_extracts[0].table.find(item => item["BANK NAME"].toUpperCase() == entity.toUpperCase());
        if (findStatusBank?.STATUS.toUpperCase() == "OPEN") {
            this.nauraGateway.postNotifyFromNaura(ENV.MESSAGE_NOTIFY_BIFAST_OPENED_NAURA("BIFAST", findStatusBank["BANK NAME"], "6281119350138"))
            return true
        }
        return false
    }
    
}