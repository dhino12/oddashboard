import axios from "axios"
import { Logger } from "winston"
import { resultAxiosElastic1 } from "../../../config/bifastlist"

type MetricSample = {
    source: string
    bankName?: string
    avgRespTime: number
    u173Count: number
    timestamp: number
    timestampString: string
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
    key: string,
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
            const samples = await this.fetchFromElastic(entity, config)
            for (const sample of samples) {
                const key = `${source}:${entity}:${sample.source}`
                if (!this.samples[key]) this.samples[key] = []
                this.recordSample(key, sample)
                const trend = this.analyzeTrend(key, config.threshold)
                if (trend) {
                    signals.push({
                        key,
                        source: sample.source,
                        trend
                    })
                }
            }
        }
        this.logger.info("======= signals")
        this.logger.info(signals)

        return {
            overallLevel: this.aggregateLevel(signals),
            signals
        }
    }

    private async fetchFromElastic(entity: string, config: MetricConfig): Promise<MetricSample[]> {
        // const data = await this.callElastic(config.urlCrawling, config.reqBody)
        const data = resultAxiosElastic1;
        const samples: MetricSample[] = []
        const tables = data.data.chart_extracts ?? []

        for (const table of tables) {
            for (const row of table.table) {
                if (row["Filters"]?.toUpperCase() !== entity.toUpperCase()) continue
                const timestampString = row["creationDate per minute"]
                const avgRespTime = Number(row["Average totalTime"] ?? 0)

                samples.push({
                    source: table.title,
                    bankName: entity,
                    avgRespTime,
                    u173Count: 0, // kalau belum ada, isi 0 dulu
                    timestamp: this.parseMinute(timestampString),
                    timestampString
                })
            }
        }
        this.logger.info("fetchFromElastic - " + entity)
        this.logger.info(samples)
        return samples
    }
    
    private parseMinute(minute:string): number {
        const now = new Date();
        const [h,m] = minute.split(":").map(Number)
        now.setHours(h,m,0,0);
        return now.getTime()
    }

    private recordSample(key: string, metric: MetricSample) {
        const eventTime = metric.timestamp

        this.samples[key].push({
            source: metric.source,
            bankName: metric.bankName,
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
    private aggregateLevel(signals: MetricTrendResult[]): "CRITICAL" | "WARNING" | "NORMAL" {
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