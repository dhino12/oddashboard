import { AnalyzeTrend, MetricSample } from "./ElasticMetricService"

function parseMinute(minute:string): number {
    const now = new Date();
    const [h,m] = minute.split(":").map(Number)
    now.setHours(h,m,0,0);
    return now.getTime()
}

export interface MetricConfig {
    name: string
    tableTitle: string
    threshold: number
    // queryType: "INQUIRY" | "TRANSACTION"
    // channel: "BIFAST" | "CIHUB"
    // urlCrawling: string,
    // reqBody: string
    matchTable: (title: string) => boolean
    setName: (name: string) => void,
    extractSample: (row: any, entity?: string) => MetricSample | null

    analyze: (
        samples: MetricSample[],
        windowMs: number
    ) => AnalyzeTrend | null
}

export const avgRespTimeConfig: MetricConfig = {
    name: "AVG_RESP_TIME_BIFAST",
    tableTitle: "Avg Inquiry BIFAST",
    threshold: 2000,

    matchTable: (title) =>
        title.startsWith("Avg") && title.includes("BIFAST"),
    setName: (name) => avgRespTimeConfig.name = name,
    extractSample: (row, entity) => {
        if (row.Filters?.toUpperCase() !== entity?.toUpperCase()) return null

        return {
            source: avgRespTimeConfig.name,
            bankName: row.Filters.toUpperCase(),
            value: Number(row["Average totalTime"]),
            timestampString: row["creationDate per minute"],
            timestamp: parseMinute(row["creationDate per minute"]),
            avgRespTime: Number(row["Average totalTime"]),
            u173Count: 0
        }
    },

    analyze: (samples) => {
        const data = samples ?? [];
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

        if (avg > avgRespTimeConfig.threshold) level = "CRITICAL";
        else if (avg >= 1500) level = "WARNING";

        return {
            average: Math.round(avg),
            percentChange: percentChange.toFixed(2) + "%",
            stdDeviation: Math.round(stdDev),
            trend,
            level
        };


        // if (samples.length < 2) return null

        // const values = samples.map(s => s.value)
        // const avg = values.reduce((a,b)=>a+b,0) / values.length

        // let level: AnalyzeTrend["level"] = "NORMAL"
        // if (avg > 2000) level = "CRITICAL"
        // else if (avg > 1500) level = "WARNING"

        // return {
        //     average: Math.round(avg),
        //     percentChange: "N/A",
        //     stdDeviation: 0,
        //     trend: "stable",
        //     level
        // }
    }
}
export const inquiryDanaErrorConfig: MetricConfig = {
    name: "INQUIRY_DANA_ERROR",
    tableTitle: "Inquiry Dana",
    threshold: 2,

    matchTable: (title) => title.startsWith("Inquiry") || title.includes("Transfer"),
    setName: (name) => inquiryDanaErrorConfig.name = name,
    extractSample: (row) => {
        if (row["filters"] == "U000") return null
        const count = Number(row["Count"]?.replace(/,/g,"") ?? 0)
        const ratio = Number(row["Count Percentages"]?.replace("%","") ?? 0)

        return {
            source: inquiryDanaErrorConfig.name,
            bankName: row["filters"],
            value: count,
            ratio,
            timestamp: Date.now(),
            timestampString: new Date().toISOString(),
            avgRespTime: 0,
            u173Count: 0
        }
    },

    analyze: (samples, windowMs) => {
        const windowSamples = samples.filter(
            s => samples[samples.length - 1].timestamp - s.timestamp <= windowMs
        )
        const results: AnalyzeTrend[] = []
        const grouped: Record<string, MetricSample[]> = {}

        for (const s of windowSamples) {
            if (!s.bankName) continue
            if (!grouped[s.bankName]) grouped[s.bankName] = []
            grouped[s.bankName].push(s)
        }

        for (const [bank, bankSamples] of Object.entries(grouped)) {
            if (bankSamples.length < 3) continue

            const values = bankSamples.map(s => s.value)
            const ratios = bankSamples.map(s => s.ratio ?? 0)

            let inc = 0
            let dec = 0

            for (let i = 1; i < values.length; i++) {
                if (values[i] > values[i - 1]) inc++
                if (values[i] < values[i - 1]) dec++
            }

            const first = values[0]
            const last = values[values.length - 1]
            const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length
            let trend: "increasing" | "decreasing" | "stable" = "stable"

            if (last > first && inc >= values.length / 2) {
                trend = "increasing"
            } else if (last < first && dec >= values.length / 2) {
                trend = "decreasing"
            }
            let level: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL"
            if (trend !== "decreasing") {
                if (avgRatio > 2.5) level = "CRITICAL"
                else if (avgRatio >= 1.5) level = "WARNING"
            } else {
                if (avgRatio >= 1.5) level = "WARNING"
                else level = "NORMAL"
            }
            results.push({
                metricName: bank,
                average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
                percentChange:
                    (((last - first) / Math.max(first, 1)) * 100).toFixed(2) + "%",
                stdDeviation: 0,
                trend,
                level
            })
        }
        results.sort((a, b) => {
            const ra = samples.find(s => s.bankName === a.metricName)?.ratio ?? 0
            const rb = samples.find(s => s.bankName === b.metricName)?.ratio ?? 0
            return rb - ra
        })
        return results[0]
    }
}
