import axios from "axios";
import { NauraGateway } from "../../../application/ports/NauraGateway";
import { ENV } from "../../../config/env";
import { resultAxiosRequest } from "../../../config/bifastlist";

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
        const res = await axios.post(`http://localhost:4000/api/v1/run`, {
            "action": "scrape",
            "url": "https://monitoringtools.corp.bankmandiri.co.id/asp/channel/everest/bifast-livin",
            "viewport": { "width": 1600, "height": 900 },
            "steps": [
                {
                    "type": "extract-table",
                    "selectors": { "table": "#DataTables_Table_0_wrapper" },
                    "pagination": { "nextButton": "#DataTables_Table_0_paginate li:nth-child(9) a" }
                }
            ],
            "screenshot": { "enabled": true, "options": [{ "selector": "", "fullPage": false }] }
        })
        const resultJson = await res.data;
        // const resultJson = resultAxiosRequest;
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
        const res = await axios.post(`http://localhost:4000/api/v1/run`, {
            "action": "scrape",
            "url": "https://monitoringtools.corp.bankmandiri.co.id/asp/channel/everest/bifast-livin",
            "viewport": { "width": 1600, "height": 900 },
            "steps": [
                {
                    "type": "extract-table",
                    "selectors": { "table": "#DataTables_Table_0_wrapper" },
                    "pagination": { "nextButton": "#DataTables_Table_0_paginate li:nth-child(9) a" }
                }
            ],
            "screenshot": { "enabled": true, "options": [{ "selector": "", "fullPage": false }] }
        })
        const resultJson = await res.data;
        // const resultJson = resultAxiosRequest;
        const entityUpperCase = entity.toUpperCase()
        const findStatusBank = resultJson.data.chart_extracts[0].table.find((item: any) => item["BANK NAME"].toUpperCase() == entityUpperCase || item["ABBREVIATION"].toUpperCase() == entityUpperCase);
        if (findStatusBank?.STATUS.toUpperCase() == "OPEN") {
            this.nauraGateway.postNotifyFromNaura(
                ENV.MESSAGE_NOTIFY_BIFAST_OPENED_NAURA("BIFAST", findStatusBank["BANK NAME"], "6281119350138")
            )
            return true
        }
        return false
    }
    
}
