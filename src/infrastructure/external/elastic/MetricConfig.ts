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
        const now = samples[samples.length - 1]?.timestamp ?? Date.now();
        const windowSamples = samples.filter(
            s => now - s.timestamp <= windowMs
        );

        if (!windowSamples || windowSamples.length === 0) {
            return {
                average: 0,
                percentChange: "0%",
                stdDeviation: 0,
                trend: "no_data",
                level: "UNKNOWN",
                relativeSlopePercent: "0%",
                dataPoints: 0
            };
        }

        // Group by bankName (karena sample campur bank)
        const grouped: Record<string, MetricSample[]> = {};
        for (const s of windowSamples) {
            const bank = s.bankName || "unknown";
            if (!grouped[bank]) grouped[bank] = [];
            grouped[bank].push(s);
        }

        // Karena kamu ingin return SATU objek AnalyzeTrend (bukan array)
        // → kita ambil bank dengan avgRatio TERBURUK (paling tinggi) sebagai representasi
        let worstResult: AnalyzeTrend = {
            metricName: "no_valid_bank",
            average: 0,
            percentChange: "0%",
            stdDeviation: 0,
            trend: "insufficient_data",
            level: "UNKNOWN",
            relativeSlopePercent: "0%",
            dataPoints: 0
        };

        let maxAvgRatio = -1;

        for (const [bankName, bankSamples] of Object.entries(grouped)) {
            // Urutkan berdasarkan waktu (penting untuk slope)
            bankSamples.sort((a, b) => a.timestamp - b.timestamp);

            const ratios = bankSamples
                .map(s => Number(s.ratio ?? 0))
                .filter(r => !isNaN(r));

            if (ratios.length < 2) continue; // minimal 2 titik untuk deteksi tren

            const n = ratios.length;
            const avgRatio = ratios.reduce((a, b) => a + b, 0) / n;

            // Hitung std deviasi
            const variance = ratios.reduce((sum, r) => sum + (r - avgRatio) ** 2, 0) / n;
            const stdDev = Math.sqrt(variance);

            // Hitung simple linear regression slope
            const x = Array.from({ length: n }, (_, i) => i);
            const sumX = (n * (n - 1)) / 2;
            const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
            const sumY = ratios.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * ratios[i], 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = n * sumX2 - sumX ** 2;
            const slope = denominator !== 0 ? numerator / denominator : 0;

            const relativeSlopePercent = avgRatio !== 0 ? (slope / avgRatio) * 100 : 0;

            // Tentukan trend berdasarkan slope + stabilitas
            let trend = "stable";
            const trendThreshold = 4;      // % per langkah, bisa dari config
            const cv = avgRatio !== 0 ? stdDev / avgRatio : 0;
            const cvHigh = cv > 0.25;      // fluktuasi besar → kemungkinan spike

            if (Math.abs(relativeSlopePercent) > trendThreshold) {
                trend = relativeSlopePercent > 0 ? "increasing" : "decreasing";
            } else if (cvHigh && n >= 4) {
                // fluktuasi tinggi tapi slope kecil → kemungkinan hanya spike/noise
                trend = "spike_or_noise";
            }

            // Level berdasarkan avgRatio (max threshold 2.5)
            let level: "CRITICAL" | "WARNING" | "NORMAL" | "UNKNOWN" = "NORMAL";
            if (avgRatio > 2.5) {
                level = "CRITICAL";
            } else if (avgRatio >= 1.5) {
                level = "WARNING";
            }

            const result: AnalyzeTrend = {
                metricName: bankName,
                average: Number(avgRatio.toFixed(2)),
                percentChange: "n/a",               // tidak dipakai lagi, bisa dihapus atau tetap untuk backward compat
                stdDeviation: Number(stdDev.toFixed(2)),
                trend,
                level,
                relativeSlopePercent: relativeSlopePercent.toFixed(2) + "%",
                dataPoints: n
            };

            // Pilih yang paling buruk (avgRatio tertinggi)
            if (avgRatio > maxAvgRatio) {
                maxAvgRatio = avgRatio;
                worstResult = result;
            }
        }

        return worstResult;
    }
}
