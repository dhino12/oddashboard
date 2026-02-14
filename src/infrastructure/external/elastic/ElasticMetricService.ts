import axios from "axios"
import { Logger } from "winston"

type MetricSample = {
    timestamp: number
    timestampString: string
    avgRespTime: number
    u173Count: number,
    bankName?: string
}

type AnalyzeTrend = {
    average: number,
    percentChange: string,
    stdDeviation: number,
    trend: string,
    level: "CRITICAL" | "WARNING" | "NORMAL"
};

type BankData = {
    "2": { value: number },
    doc_count: number
};

export interface MetricConfig {
    name: string
    threshold: number
    queryType: "INQUIRY" | "TRANSACTION"
    channel: "BIFAST" | "CIHUB"
    urlCrawling: string,
    reqBody: string
}

export interface MetricTrendResult {
    source: string
    trend: AnalyzeTrend | null
}

export interface MetricFetchResult {
    overallLevel: "CRITICAL" | "WARNING" | "NORMAL"
    signals: MetricTrendResult[]
}

export class ElasticMetricService {
    private readonly windowMs = 5 * 60 * 1000

    private samples: {
        [key: string]: MetricSample[]
    } = {}
    constructor(
        private readonly logger: Logger, 
        private readonly metricConfigs: MetricConfig[]
    ) {}

    async fetch(source: string,entity: string): Promise<MetricFetchResult> {
        const signals: MetricTrendResult[] = []
        for (const config of this.metricConfigs) {
            const metric = await this.fetchFromElastic(entity, config)
            const key = `${source}:${entity}:${config.name}`

            if (!this.samples[key]) this.samples[key] = []
            this.recordSample(key, metric)
            const trend = this.analyzeTrend(key, config.threshold)
            signals.push({
                source: config.name,
                trend
            })
        }

        return {
            overallLevel: this.aggregateLevel(signals), // minimal satu signal yang CRITICAL
            signals
        }
    }

    private async fetchFromElastic(entity: string, config: MetricConfig): Promise<MetricSample> {
        /**
         * TODO: 
         * Ini harus diubah sesuai dengan result / response callElastic()
         */
        const data = await this.callElastic(config.urlCrawling, config.reqBody)
        const buckets = data.rawResponse.aggregations["0"].buckets
        const latestBucket = buckets[buckets.length - 1]
        const bankBuckets = latestBucket["1"].buckets
        const bankEntry = Object.entries(bankBuckets).find((bankName) => {
            return bankName[0].toUpperCase() === entity
        })
        const bankData = bankEntry?.[1] as BankData | undefined
        this.logger.info(bankData)
        if (!bankData) {
            this.logger.info("This bank is not included in the Bank BUKU 4")
            return {
                avgRespTime: 0,
                u173Count: 0,
                timestamp: 0,
                bankName: "",
                timestampString: ""
            }
        }

        return {
            avgRespTime: bankData["2"].value,
            u173Count: bankData.doc_count,
            timestamp: new Date(latestBucket.key_as_string).getTime(),
            timestampString: latestBucket.key_as_string,
            bankName: entity
        }
    }
    
    private recordSample(key: string, metric: MetricSample) {
        const eventTime = metric.timestamp

        this.samples[key].push({
            timestamp: eventTime,
            avgRespTime: metric.avgRespTime,
            u173Count: metric.u173Count,
            timestampString: metric.timestampString
        })
        console.log("================= SAMPLE RESP_TIME");
        this.logger.info(this.samples)

        // sliding window cleanup berdasarkan event time
        this.samples[key] = this.samples[key].filter(s => eventTime - s.timestamp <= this.windowMs)
    }
    
    private analyzeTrend(key: string, threshold = 2000): AnalyzeTrend | null {
        const data = this.samples[key] ?? [];
        if (!data || data.length < 2) return null;

        const values = data.map(d => Number(d.avgRespTime));

        const first = values[0];
        const last = values[values.length - 1];

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const percentChange = first !== 0 ? ((last - first) / first) * 100 : 0;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        let trend: "stable" | "increasing" | "decreasing" = "stable";

        if (percentChange > 10) trend = "increasing";
        else if (percentChange < -10) trend = "decreasing";

        let level: "CRITICAL" | "WARNING" | "NORMAL" = "NORMAL";

        if (avg > threshold) level = "CRITICAL";
        else if (avg >= 1500) level = "WARNING";

        return {
            average: Math.round(avg),
            percentChange: percentChange.toFixed(2) + "%",
            stdDeviation: Math.round(stdDev),
            trend,
            level
        };
    }
    private aggregateLevel(
        signals: MetricTrendResult[]
    ): "CRITICAL" | "WARNING" | "NORMAL" {
        if (signals.some(s => s.trend?.level === "CRITICAL")) return "CRITICAL"
        if (signals.some(s => s.trend?.level === "WARNING")) return "WARNING"
        return "NORMAL"
    }

    private async callElastic(url: string, reqBody: {}): Promise<any> {
        const res = axios.post(url, reqBody);
        const rawData = (await res).data
        return rawData.data
    }
}