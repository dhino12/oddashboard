import axios from "axios"
import { Logger } from "winston"
import { resultAxiosElastic1 } from "../../../config/bifastlist"
import { MetricConfig } from "./MetricConfig"

export type MetricSample = {
    source: string
    bankName?: string
    avgRespTime: number
    u173Count: number
    value: number            // nilai utama (resp_time / error_count)
    ratio?: number           // optional (error percentage)
    timestamp: number
    timestampString: string
}

export type AnalyzeTrend = {
    metricName?: string
    average: number,
    percentChange: string,
    stdDeviation: number,
    trend: string,
    level: "CRITICAL" | "WARNING" | "NORMAL"
};

export interface MetricTrendResult {
    key: string,
    source: string
    trend: AnalyzeTrend | null
}

export interface MetricFetchResult {
    overallLevel: "CRITICAL" | "WARNING" | "NORMAL"
    signals: MetricTrendResult[]
    relatedLevel: MetricTrendResult[]
}

export class ElasticMetricService {
    private readonly windowMs = 5 * 60 * 1000

    private samples: {
        [key: string]: MetricSample[]
    } = {}
    constructor(
        private readonly logger: Logger, 
        private readonly metricConfigs: MetricConfig[],
        private readonly apiClient: any
    ) {}

    async fetch(source: string, entity?: string): Promise<MetricFetchResult> {
        const signals: MetricTrendResult[] = []
        // const raw = await this.callElastic(this.apiClient.urlCrawling, this.apiClient.reqBody)
        const raw = resultAxiosElastic1.data.chart_extracts

        for (const config of this.metricConfigs) {
            const tables = raw.filter(t => config.matchTable(t.title))

            for (const table of tables) {
                config.setName(table.title)
                const samples = table.table
                    .map(row => config.extractSample(row, entity))
                    .filter(Boolean) as MetricSample[]
                
                this.logger.info("======samples")
                this.logger.info(samples)
                if (samples.length === 0) continue

                const key = `${source}:${config.name}:${entity}`
                if (!this.samples[key]) this.samples[key] = []

                this.samples[key].push(...samples)
                this.samples[key] = this.samples[key].filter(
                    s => Date.now() - s.timestamp <= this.windowMs
                )
                const trend = config.analyze(this.samples[key], this.windowMs)
                this.logger.info("======trend==== " + key + " ===")
                this.logger.info(trend)
                this.logger.info("🚩 =============")
                if (trend) {
                    signals.push({
                        key,
                        source: table.title,
                        trend
                    })
                }
            }
        }

        return {
            overallLevel: this.aggregateLevel(signals),
            relatedLevel: signals.filter(signal => signal.trend?.level == this.aggregateLevel(signals)),
            signals
        }
    }


    // private async fetchFromElastic(entity: string, dataRespTime: any): Promise<MetricSample[]> {
    //     const data = resultAxiosElastic1;
    //     const samples: MetricSample[] = []
    //     const tables = data.data.chart_extracts ?? []

    //     for (const table of tables) {
    //         for (const row of table.table) {
    //             console.log(table.table.length, row.Filters, entity);
    //             if (row["Filters"]?.toUpperCase() !== entity.toUpperCase()) continue
    //             const timestampString = row["creationDate per minute"]
    //             const avgRespTime = Number(row["Average totalTime"] ?? 0)

    //             samples.push({
    //                 source: table.title,
    //                 bankName: entity,
    //                 avgRespTime,
    //                 u173Count: 0, // kalau belum ada, isi 0 dulu
    //                 timestamp: this.parseMinute(timestampString),
    //                 timestampString
    //             })
    //         }
    //     }
    //     this.logger.info("fetchFromElastic - " + entity)
    //     this.logger.info(samples)
    //     return samples
    // }
    
    private parseMinute(minute:string): number {
        const now = new Date();
        const [h,m] = minute.split(":").map(Number)
        now.setHours(h,m,0,0);
        return now.getTime()
    }

    // private recordSample(key: string, metric: MetricSample) {
    //     const eventTime = metric.timestamp

    //     this.samples[key].push({
    //         source: metric.source,
    //         bankName: metric.bankName,
    //         timestamp: eventTime,
    //         avgRespTime: metric.avgRespTime,
    //         u173Count: metric.u173Count,
    //         timestampString: metric.timestampString
    //     })
    //     console.log("================= SAMPLE RESP_TIME");
    //     this.logger.info(this.samples)

    //     // sliding window cleanup berdasarkan event time
    //     this.samples[key] = this.samples[key].filter(s => eventTime - s.timestamp <= this.windowMs)
    // }
    
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
        const res = await axios.post(url, reqBody);
        const rawData = (await res).data
        return rawData.data
    }
}