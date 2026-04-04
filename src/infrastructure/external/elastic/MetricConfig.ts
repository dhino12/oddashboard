import { AnalyzeTrend, MetricSample } from "./ElasticMetricClient"

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
    extractSample: (row: any, entity?: string, source?: string) => MetricSample | null

    analyze: (
        samples: MetricSample[],
        config: ConfigAnalyze,
        windowMs: number
    ) => AnalyzeTrend | null
}
function extractNumber(value?: string): number {
    if (!value) return 0;
    const match = value.match(/[\d,]+/);
    return match ? Number(match[0].replace(/,/g, "")) : 0;
}
function extractTime(value?: string): string | null {
    if (!value) return null;
    const match = value.match(/(\d{2}:\d{2}:\d{2})|(\d{2}:\d{2})/);
    return match ? match[0] : null;
}
function toMinute(time: string): string {
    return time.slice(0, 5); // 23:04
}

function parseAvg(value: string): number {
    if (!value) return 0;
    const num = value.replace(/[^\d]/g, ""); // hapus teks + koma
    return Number(num || 0);
}

function groupByCodeError(samples: MetricSample[]): Record<string, MetricSample[]> {
  return samples.reduce((acc, s) => {
    if (!s.codeError) return acc;
    acc[s.codeError] ??= [];
    acc[s.codeError].push(s);
    return acc;
  }, {} as Record<string, MetricSample[]>);
}

export const avgRespTimeConfig: MetricConfig = {
  name: "Avg",
  tableTitle: "Avg Response Time",
  threshold: 4000,

  matchTable: (title) => title.startsWith("Avg") && (title.includes("BIFAST") || title.includes("CIHUB") || title.includes("Inquiry") || title.includes("Transaction")),

  setName: function (name) { this.name = name; },

  extractSample: (row, entity, source) => {
    if (!entity || row.Filters?.toUpperCase() !== entity.toUpperCase()) return null;

    const rawTime =
        row["creationDate per minute"] ||
        row["creationDate per 30 seconds"] ||
        row["creationDate per 5 seconds"] ||
        row["creationDate per seconds"] ||
        row["per 30 seconds"];
        row["per 5 seconds"];

    const timeStr = extractTime(rawTime);
    if (!timeStr) return null;

    const avg = extractNumber(row["Average totalTime"]);

    return {
        source: avgRespTimeConfig.name,
        bankName: row.Filters.toUpperCase(),
        value: avg,
        avgRespTime: avg,
        timestamp: parseMinute(timeStr),
        timestampString: timeStr,
        ratio: 0,
        u173Count: 0
    }; 
  },

  analyze: (windowSamples: MetricSample[], config: ConfigAnalyze, windowMs: number): AnalyzeTrend => {
    if (windowSamples.length < 3) {
      return {
        average: 0,
        percentChange: "0%",
        stdDeviation: 0,
        trend: "insufficient_data",
        level: "UNKNOWN",
        relativeSlopePercent: "0%",
        dataPoints: windowSamples.length
      };
    }

    // Sort ulang berdasarkan waktu
    windowSamples.sort((a, b) => a.timestamp - b.timestamp);

    const values = windowSamples.map(s => s.avgRespTime).filter(v => !isNaN(v) && v > 0);

    if (values.length < 3) return {  
        average: 0,
        percentChange: "0%",
        stdDeviation: 0,
        trend: "insufficient_data",
        level: "UNKNOWN",
        relativeSlopePercent: "0%",
        dataPoints: windowSamples.length
    };

    const n = values.length;
    const avg = values.reduce((a, b) => a + b, 0) / n;

    // Linear regression slope
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = (n * (n - 1)) / 2;
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator !== 0 ? numerator / denominator : 0;

    const relativeSlopePercent = avg > 0 ? (slope / avg) * 100 : 0;

    // Std dev & CV
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0;

    // Deteksi tren
    let trend = "stable";
    const trendThreshold = config.trendThreshold ?? 5;      // % per step
    const stabilityThreshold = config.stabilityStdDev ?? 0.15;

    if (Math.abs(relativeSlopePercent) > trendThreshold) {
      trend = relativeSlopePercent > 0 ? "increasing" : "decreasing";
      if (cv < stabilityThreshold) {
        trend += "_gradual";  // turun/naik bertahap (stabil)
      } else {
        trend += "_with_spike";  // ada fluktuasi besar
      }
    } else if (cv > stabilityThreshold * 1.5) {
      trend = "unstable_or_spike";
    }

    // Level
    let level: "CRITICAL" | "WARNING" | "NORMAL" | "UNKNOWN" = "NORMAL";
    if (avg > 4000) level = "CRITICAL";
    else if (avg >= 2000) level = "WARNING";

    return {
      metricName: `${windowSamples[0].bankName} - ${avgRespTimeConfig.name}`,  // atau windowSamples[0].bankName
      average: Math.round(avg),
      percentChange: (cv * 100).toFixed(1) + "%",
      stdDeviation: Math.round(stdDev),
      trend,
      level,
      relativeSlopePercent: relativeSlopePercent.toFixed(2) + "%",
      dataPoints: n
    };
  }
};
export const inquiryDanaErrorConfig: MetricConfig = {
    name: "ERROR",
    tableTitle: "Error Inquiry/Transfer",
    threshold: 2.5,

    matchTable: (title) => {
        // console.log(title, title.includes("Error Inquiry") || title.includes("Error Transfer"));
        return title.includes("Error Inquiry") || title.includes("Error Transfer")
    },

  setName: function (name) { this.name = name; },

  extractSample: (row, entity, source) => {
    if (!entity) return null;

    const code = String(row["Filters"] ?? row["filters"] ?? "").toUpperCase();
    if (code === "U000") return null;

    const percentageStr =
        row["Count percentages"]
        ?.replace("%", "")
        .replace("Count percentages", "") || "0";

    const errorPct = Number(percentageStr);

    return {
        source: source ?? "UNKNOWN",
        bankName: entity.toUpperCase(),
        value: 0,
        ratio: errorPct,   // murni error %
        codeError: code,
        timestamp: Date.now(),
        timestampString: new Date().toISOString(),
        avgRespTime: 0,
        u173Count: code === "U173" ? Number(row["Count"]?.replace(/,/g, "") || 0) : 0,
    };
    },

  analyze: (windowSamples: MetricSample[], config: ConfigAnalyze, windowMs: number): AnalyzeTrend => {
    const now = windowSamples[windowSamples.length - 1]?.timestamp ?? Date.now();
    // const windowSamples = samples.filter(s => now - s.timestamp <= windowMs);
    const grouped = groupByCodeError(windowSamples);

    if (windowSamples.length < 2) {
      return {
        average: 0,
        percentChange: "0%",
        stdDeviation: 0,
        trend: windowSamples.length === 0 ? "no_data" : "insufficient_data",
        level: "UNKNOWN",
        relativeSlopePercent: "0%",
        dataPoints: windowSamples.length
      };
    }

    const results: AnalyzeTrend[] = [];

    // 🔹 STEP 2: analyze per codeError
    for (const [codeError, series] of Object.entries(grouped)) {

      const windowSamples = series.filter(
        s => now - s.timestamp <= windowMs
      );

      if (windowSamples.length < 2) {
        results.push({
          average: 0,
          percentChange: "0%",
          stdDeviation: 0,
          trend: windowSamples.length === 0 ? "no_data" : "insufficient_data",
          level: "UNKNOWN",
          relativeSlopePercent: "0%",
          dataPoints: windowSamples.length
        });
        continue;
      }

      /* ============================================================
        ❗ BLOK STATISTIK — TIDAK DIUBAH SAMA SEKALI
        ============================================================ */

      windowSamples.sort((a, b) => a.timestamp - b.timestamp);

      const ratios = windowSamples.map(s => s.ratio ?? 0).filter(r => !isNaN(r));

      const n = ratios.length;
      const avg = ratios.reduce((a, b) => a + b, 0) / n;

      const x = Array.from({ length: n }, (_, i) => i);
      const sumX = (n * (n - 1)) / 2;
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const sumY = ratios.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * ratios[i], 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = n * sumX2 - sumX * sumX;
      const slope = denominator !== 0 ? numerator / denominator : 0;

      const relativeSlopePercent = avg > 0 ? (slope / avg) * 100 : 0;

      const variance = ratios.reduce((sum, r) => sum + (r - avg) ** 2, 0) / n;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? stdDev / avg : 0;

      let trend = "stable";
      const trendThreshold = 8;
      const stabilityThreshold = 0.25;

      if (Math.abs(relativeSlopePercent) > trendThreshold) {
        trend = relativeSlopePercent > 0 ? "increasing" : "decreasing";
        if (cv < stabilityThreshold) trend += "_gradual";
        else trend += "_volatile";
      } else if (cv > stabilityThreshold) {
        trend = "unstable_or_spike";
      }

      let level: "CRITICAL" | "WARNING" | "NORMAL" | "UNKNOWN" = "NORMAL";
      if (avg > 2.5) level = "CRITICAL";
      else if (avg >= 1.5) level = "WARNING";

      /* ============================================================ */

      results.push({ 
        codeError: codeError,
        metricName: windowSamples[0]?.source,
        average: Number(avg.toFixed(2)),
        percentChange: (cv * 100).toFixed(1) + "%",
        stdDeviation: Number(stdDev.toFixed(2)),
        trend,
        level,
        relativeSlopePercent: relativeSlopePercent.toFixed(2) + "%",
        dataPoints: n
        // codeError,
        // metricName: windowSamples[0]?.source,
        // average: Number(avg.toFixed(2)),
        // percentChange: (cv * 100).toFixed(1) + "%",
        // stdDeviation: Number(stdDev.toFixed(2)),
        // trend,
        // level,
        // relativeSlopePercent: relativeSlopePercent.toFixed(2) + "%",
        // dataPoints: n
      });
    }

    return results.filter(r => r.level == "CRITICAL")[0];
  }
}

export const getMaxDataPerMinute = (rows: any[]) => {
    const map = new Map<string, any>();
    for (const row of rows) {
        const timeRaw = row["creationDate per 30 seconds"] || row["per 30 seconds"];
        const time = extractTime(timeRaw);
        const minute = toMinute(time ?? "");

        const entity = row["Filters"]; // BCA, BRI, dll
        const avg = parseAvg(row["Average totalTime"]);

        const key = `${minute}-${entity}`;

        if (!map.has(key) || map.get(key).avg < avg) {
            map.set(key, {
                ...row,
                __time: time,
                __minute: minute,
                avg
            });
        }
    }
    return Array.from(map.values());
}