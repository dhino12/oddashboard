import axios from "axios";
import { resultAxiosRequest } from "../../../config/bifastlist";

export interface HealthChecker {
    isServiceOpen(source: string, entity: string): Promise<boolean>;
}

export class BiFastHealthChecker implements HealthChecker {
    async isServiceOpen(source: string, entity: string): Promise<boolean> {
        // const res = await axios.post(``, {

        // })
        // const resultJson = await res.data;
        const resultJson = resultAxiosRequest;
        const findStatusBank = resultJson.data.chart_extracts[0].table.find(item => item["BANK NAME"].toUpperCase() == entity);
        return findStatusBank?.STATUS.toUpperCase() == "OPEN"
    }
    
}