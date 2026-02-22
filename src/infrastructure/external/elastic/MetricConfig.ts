import { AnalyzeTrend, MetricSample } from "./ElasticMetricService"

function parseMinute(minute:string): number {
    const now = new Date();
    const [h,m] = minute.split(":").map(Number)
    now.setHours(h,m,0,0);
    return now.getTime()
}

type ConfigAnalyze = {
    trendThreshold: number,       // >6% per langkah → dianggap tren
    stabilityStdDev: number,   // CV >18% → unstable kalau tidak ada tren jelas
    critical: number,
    warning: number
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
        config: ConfigAnalyze,
        windowMs: number
    ) => AnalyzeTrend | null
}

export const avgRespTimeConfig: MetricConfig = {
    name: "AVG_RESP_TIME_BIFAST",
    tableTitle: "Avg Inquiry BIFAST",
    threshold: 4000,

    matchTable: (title) =>
        title.startsWith("Avg") && title.includes("BIFAST"),
    setName: (name) => avgRespTimeConfig.name = name,
    extractSample: (row, entity) => {
        if (row.Filters?.toUpperCase() !== entity?.toUpperCase()) return null

        return {
            source: avgRespTimeConfig.name,
            bankName: row.Filters.toUpperCase(),
            value: Number(row["Average totalTime"]),
            timestampString: row["creationDate per minute"] || row["creationDate per 30 seconds"],
            timestamp: parseMinute(row["creationDate per minute"] || row["creationDate per 30 seconds"]),
            avgRespTime: Number(row["Average totalTime"]),
            u173Count: 0
        }
    },

    analyze: (samples: MetricSample[], config: ConfigAnalyze, windowMs: number) => {
        const data = samples ?? [];
        const insufficientResult: AnalyzeTrend = {
            average: 0,
            percentChange: "0%",
            stdDeviation: 0,
            trend: "insufficient_data",
            level: "UNKNOWN",
        };
        if (!data || data.length < 3) {  // minimal 3 titik biar tren bermakna
            return insufficientResult;
        }

        // Asumsi data sudah diurutkan berdasarkan timestamp (jika belum, sort dulu di luar fungsi)
        const values = data.map(d => Number(d.avgRespTime)).filter(v => !isNaN(v));
        if (values.length < 3) {
            return insufficientResult;
        }

        const n = values.length;
        const avg = values.reduce((a, b) => a + b, 0) / n;

        // --- Hitung simple linear regression slope ---
        const x = Array.from({ length: n }, (_, i) => i); // indeks 0 sampai n-1
        const sumX = (n * (n - 1)) / 2;
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = n * sumX2 - sumX * sumX;
        const slope = denominator !== 0 ? numerator / denominator : 0;

        // Slope relatif terhadap rata-rata (dalam % per langkah waktu)
        const relativeSlopePercent = avg !== 0 ? (slope / avg) * 100 : 0;

        // --- Variance & Std Deviation (pakai populasi biar konsisten dengan kode asli) ---
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        // --- Tentukan trend ---
        let trend = "stable";
        const trendThreshold = config.trendThreshold || 5;     // % per langkah, bisa disesuaikan
        const stabilityThreshold = config.stabilityStdDev || 0.15; // stdDev < 15% dari avg → stabil

        if (Math.abs(relativeSlopePercent) > trendThreshold) {
            trend = relativeSlopePercent > 0 ? "increasing" : "decreasing";
        }

        // Tambahan: kalau fluktuasi terlalu besar → beri label oscillating / unstable
        const cv = avg !== 0 ? stdDev / avg : 0; // coefficient of variation
        if (cv > stabilityThreshold && Math.abs(relativeSlopePercent) < trendThreshold / 2) {
            trend = "unstable";  // naik-turun acak, bukan tren jelas
        }

        // --- Level berdasarkan average ---
        let level: "NORMAL" | "WARNING" | "CRITICAL" | "UNKNOWN" = "NORMAL";
        const criticalThreshold = config.critical || avgRespTimeConfig?.threshold || 5000;
        const warningThreshold  = config.warning  || 1500;

        if (avg > criticalThreshold) level = "CRITICAL";
        else if (avg >= warningThreshold) level = "WARNING";

        return {
            average: Math.round(avg),
            stdDeviation: Math.round(stdDev),
            percentChange: (cv * 100).toFixed(1) + "%",           // coefficient of variation
            relativeSlopePercent: relativeSlopePercent.toFixed(2) + "%",
            trend,
            level,
            dataPoints: values.length,
            // opsional: tambah confidence atau detail lain kalau perlu
        };
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

    analyze: (samples, config, windowMs) => {
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
