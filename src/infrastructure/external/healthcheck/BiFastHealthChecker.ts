import axios from "axios";
import { resultAxiosRequest } from "../../../config/bifastlist";
import { NauraGateway } from "../../../application/ports/NauraGateway";
import { ENV } from "../../../config/env";

export interface HealthChecker {
    isServiceOpen(source: string, entity: string): Promise<boolean>;
    isServiceOpenV2(entity: string, resultJson: any): Promise<boolean>;
    callNaura(bankName: string): Promise<any>;
    callBiFastASP(url: string): Promise<any>
}

export class BiFastHealthChecker implements HealthChecker {
    constructor(private readonly nauraGateway: NauraGateway) {
        
    }
    async callNaura(bankName: string): Promise<any> {
        this.nauraGateway.postNotifyFromNaura(
            ENV.MESSAGE_NOTIFY_BIFAST_OPENED_NAURA("BIFAST", bankName, "6281119350138")
        )
        return true
    }
    async callBiFastASP(url: string): Promise<any> {
        // const res = await axios.post(``, {

        // })
        // const resultJson = await res.data;
        const resultJson = resultAxiosRequest;
        return resultJson
    }
    async isServiceOpenV2(entity: string, resultJson: any): Promise<boolean> {
        const entityUpperCase = entity.toUpperCase()
        const findStatusBank = resultJson.data.chart_extracts[0].table.find((item:any) => item["BANK NAME"].toUpperCase() == entityUpperCase || item["ABBREVIATION"].toUpperCase() == entityUpperCase);
        if (findStatusBank?.STATUS.toUpperCase() == "OPEN") {
            return true
        }
        return false
    }
    async isServiceOpen(source: string, entity: string): Promise<boolean> {
        // const res = await axios.post(``, {

        // })
        // const resultJson = await res.data;
        const resultJson = resultAxiosRequest;
        const entityUpperCase = entity.toUpperCase()
        const findStatusBank = resultJson.data.chart_extracts[0].table.find(item => item["BANK NAME"].toUpperCase() == entityUpperCase || item["ABBREVIATION"].toUpperCase() == entityUpperCase);
        if (findStatusBank?.STATUS.toUpperCase() == "OPEN") {
            this.nauraGateway.postNotifyFromNaura(
                ENV.MESSAGE_NOTIFY_BIFAST_OPENED_NAURA("BIFAST", findStatusBank["BANK NAME"], "6281119350138")
            )
            return true
        }
        return false
    }
    
}