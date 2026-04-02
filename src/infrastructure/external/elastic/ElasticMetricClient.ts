import axios from "axios"
import { Logger } from "winston"
import { resultAxiosElastic1 } from "../../../config/bifastlist"
import { getMaxDataPerMinute, MetricConfig } from "./MetricConfig"
import { stripKeyPrefix } from "../../../utils/RemoveStringNoise"

export type MetricSample = {
    source: string
    bankName?: string
    avgRespTime: number
    u173Count: number
    value: number            // nilai utama (resp_time / error_count)
    ratio?: number           // optional (error percentage)
    codeError?: string
    timestamp: number
    timestampString: string
}

export type AnalyzeTrend = {
    codeError ?:string,
    metricName?: string
    average: number,
    percentChange: string,
    stdDeviation: number,
    trend: string,
    level: "CRITICAL" | "WARNING" | "NORMAL" | "UNKNOWN",
    relativeSlopePercent?: string,
    dataPoints ?: number
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

type Options = {
    interval: number
}

// helpers.ts (bisa taruh di same file atau utils/)
function normalizeFilterValue(raw?: any): string | null {
    if (!raw && raw !== 0) return null;
    const s = String(raw).trim();
    // Some rows have "FiltersBCA", "Filters BCA", "FiltersDana", "DANA", "FiltersSea Bank"
    // Try to extract the bank/label token (letters, numbers, spaces)
    // Remove a leading "Filters" (case-insensitive) and other prefixes
    const stripped = s.replace(/^filters[:\s-]*/i, "")
                        .replace(/^filter[:\s-]*/i, "")
                        .replace(/^creationDate.*$/i, "")
                        .trim();
    // also remove any non-printable or newlines
    const cleaned = stripped.replace(/\s+/g, " ").trim();
    return cleaned.length ? cleaned : null;
}

function parseAvgTotalTime(raw?: any): number {
    if (raw == null) return 0;
    // raw examples: "Average totalTime669", "Average totalTime1,755", "Average totalTime null"
    // We remove non-digit characters except comma then parse
    const s = String(raw);
    // Extract digits and commas
    const digits = s.replace(/[^\d,.-]/g, "");
    // remove commas then parse
    const plain = digits.replace(/,/g, "");
    const v = Number(plain);
    return Number.isFinite(v) ? v : 0;
}
function isErrorTable(title: string): boolean {
    return /error inquiry|error transfer/i.test(title);
}
function tableBelongsToEntity(title: string, entity?: string): boolean {
    if (!entity) return true;

    // Error tables → entity ada di title
    if (/error inquiry|error transfer/i.test(title)) {
        return title.toLowerCase().includes(entity.toLowerCase());
    }

    // Avg / normal tables → boleh lanjut (difilter di row)
    return true;
}
export class ElasticMetricClient {
    private readonly windowMs = 5 * 60 * 1000

    private samples: {
        [key: string]: MetricSample[]
    } = {}
    constructor(
        private readonly logger: Logger, 
        private readonly metricConfigs: MetricConfig[],
        private readonly apiClient: any
    ) {}

    // modified fetch in ElasticMetricService (replace inner part)
    async fetch(source: string, entity?: string, option?: Options): Promise<MetricFetchResult> {
        const signals: MetricTrendResult[] = [];
        this.logger.info(`[ElasticMetricClient:fetch] 🧲 FETCH ElasticMetricService`); 
        if (option?.interval == 1) {
            this.apiClient.reqBody.url = "http://kibana.soabiru.corp.bankmandiri.co.id:5600/app/dashboards#/view/18f4bb53-8bf7-4759-930a-5bd9de96db7e?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-5m,to:now))";
        } else {
            this.apiClient.reqBody.url = "http://kibana.soabiru.corp.bankmandiri.co.id:5600/app/dashboards#/view/18f4bb53-8bf7-4759-930a-5bd9de96db7e?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-1m,to:now))";
        }

        const raw = await this.callElastic(this.apiClient.urlCrawling, this.apiClient.reqBody)
        // const raw = resultAxiosElastic1.data;
        const resultRaw = [
            {
                "title": "Avg Inquiry BIFAST",
                "table": [
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "505",
                    "__time": null,
                    "__minute": "",
                    "avg": 505
                },
                {
                    "creationDate per second": "05:43:11",
                    "Filters": "BRI",
                    "Average totalTime": "397",
                    "__time": null,
                    "__minute": "",
                    "avg": 397
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BNI",
                    "Average totalTime": "571",
                    "__time": null,
                    "__minute": "",
                    "avg": 571
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "505",
                    "__time": null,
                    "__minute": "",
                    "avg": 505
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "creationDate per second": "05:43:11",
                    "Filters": "Sea Bank",
                    "Average totalTime": "447",
                    "__time": null,
                    "__minute": "",
                    "avg": 447
                }
                ]
            },
            {
                "title": "Avg Inquiry BIFAST",
                "table": [
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "505",
                    "__time": null,
                    "__minute": "",
                    "avg": 505
                },
                {
                    "creationDate per second": "05:43:11",
                    "Filters": "BRI",
                    "Average totalTime": "397",
                    "__time": null,
                    "__minute": "",
                    "avg": 397
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BNI",
                    "Average totalTime": "571",
                    "__time": null,
                    "__minute": "",
                    "avg": 571
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "505",
                    "__time": null,
                    "__minute": "",
                    "avg": 505
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "creationDate per second": "05:43:11",
                    "Filters": "Sea Bank",
                    "Average totalTime": "447",
                    "__time": null,
                    "__minute": "",
                    "avg": 447
                }
                ]
            },
            {
                "title": "Avg Inquiry CIHUB",
                "table": [
                {
                    "per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "517",
                    "__time": null,
                    "__minute": "",
                    "avg": 517
                },
                {
                    "per second": "05:43:11",
                    "Filters": "BRI",
                    "Average totalTime": "364",
                    "__time": null,
                    "__minute": "",
                    "avg": 364
                },
                {
                    "per second": "05:43:12",
                    "Filters": "BNI",
                    "Average totalTime": "535",
                    "__time": null,
                    "__minute": "",
                    "avg": 535
                },
                {
                    "per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "471",
                    "__time": null,
                    "__minute": "",
                    "avg": 471
                },
                {
                    "per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "per second": "05:43:11",
                    "Filters": "Sea Bank",
                    "Average totalTime": "414",
                    "__time": null,
                    "__minute": "",
                    "avg": 414
                }
                ]
            },
            {
                "title": "Avg Inquiry CIHUB",
                "table": [
                {
                    "per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "517",
                    "__time": null,
                    "__minute": "",
                    "avg": 517
                },
                {
                    "per second": "05:43:11",
                    "Filters": "BRI",
                    "Average totalTime": "364",
                    "__time": null,
                    "__minute": "",
                    "avg": 364
                },
                {
                    "per second": "05:43:12",
                    "Filters": "BNI",
                    "Average totalTime": "535",
                    "__time": null,
                    "__minute": "",
                    "avg": 535
                },
                {
                    "per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "471",
                    "__time": null,
                    "__minute": "",
                    "avg": 471
                },
                {
                    "per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "per second": "05:43:11",
                    "Filters": "Sea Bank",
                    "Average totalTime": "414",
                    "__time": null,
                    "__minute": "",
                    "avg": 414
                }
                ]
            },
            {
                "title": "Avg Transaction BIFAST",
                "table": [
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "846",
                    "__time": null,
                    "__minute": "",
                    "avg": 846
                },
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BRI",
                    "Average totalTime": "712",
                    "__time": null,
                    "__minute": "",
                    "avg": 712
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BNI",
                    "Average totalTime": "812",
                    "__time": null,
                    "__minute": "",
                    "avg": 812
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "535",
                    "__time": null,
                    "__minute": "",
                    "avg": 535
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "Sea Bank",
                    "Average totalTime": "649",
                    "__time": null,
                    "__minute": "",
                    "avg": 649
                }
                ]
            },
            {
                "title": "Avg Transaction BIFAST",
                "table": [
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "846",
                    "__time": null,
                    "__minute": "",
                    "avg": 846
                },
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BRI",
                    "Average totalTime": "712",
                    "__time": null,
                    "__minute": "",
                    "avg": 712
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BNI",
                    "Average totalTime": "812",
                    "__time": null,
                    "__minute": "",
                    "avg": 812
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "535",
                    "__time": null,
                    "__minute": "",
                    "avg": 535
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "Sea Bank",
                    "Average totalTime": "649",
                    "__time": null,
                    "__minute": "",
                    "avg": 649
                }
                ]
            },
            {
                "title": "Avg Transaction CIHUB",
                "table": [
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "658",
                    "__time": null,
                    "__minute": "",
                    "avg": 658
                },
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BRI",
                    "Average totalTime": "496",
                    "__time": null,
                    "__minute": "",
                    "avg": 496
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "BNI",
                    "Average totalTime": "500",
                    "__time": null,
                    "__minute": "",
                    "avg": 500
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "408",
                    "__time": null,
                    "__minute": "",
                    "avg": 408
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Sea Bank",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                }
                ]
            },
            {
                "title": "Avg Transaction CIHUB",
                "table": [
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BCA",
                    "Average totalTime": "658",
                    "__time": null,
                    "__minute": "",
                    "avg": 658
                },
                {
                    "creationDate per second": "05:43:13",
                    "Filters": "BRI",
                    "Average totalTime": "496",
                    "__time": null,
                    "__minute": "",
                    "avg": 496
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "BNI",
                    "Average totalTime": "500",
                    "__time": null,
                    "__minute": "",
                    "avg": 500
                },
                {
                    "creationDate per second": "05:43:12",
                    "Filters": "BSI",
                    "Average totalTime": "408",
                    "__time": null,
                    "__minute": "",
                    "avg": 408
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Dana",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                },
                {
                    "creationDate per second": "05:43:10",
                    "Filters": "Sea Bank",
                    "Average totalTime": "null",
                    "__time": null,
                    "__minute": "",
                    "avg": 0
                }
                ]
            },
            {
                "title": "BCA Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "257",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BCA Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "257",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BRI Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "351",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BRI Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "351",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BNI Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "111",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BNI Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "111",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BSI Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "60",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BSI Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "60",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Dana Error Inquiry",
                "table": [
                {
                    "filters": "U173",
                    "Count": "2",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U000",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Dana Error Inquiry",
                "table": [
                {
                    "filters": "U173",
                    "Count": "2",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U000",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Sea Bank Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "61",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Sea Bank Error Inquiry",
                "table": [
                {
                    "filters": "U000",
                    "Count": "61",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BCA Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "214",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BCA Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "214",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BRI Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "313",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BRI Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "313",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BNI Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "94",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BNI Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "94",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BSI Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "61",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "BSI Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "61",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Dana Error Transfer",
                "table": [
                {
                    "filters": "U173",
                    "Count": "2",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U000",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Dana Error Transfer",
                "table": [
                {
                    "filters": "U173",
                    "Count": "2",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U000",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Sea Bank Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "46",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            },
            {
                "title": "Sea Bank Error Transfer",
                "table": [
                {
                    "filters": "U000",
                    "Count": "46",
                    "Count percentages": "100%"
                },
                {
                    "filters": "U170",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U173",
                    "Count": "0",
                    "Count percentages": "0%"
                },
                {
                    "filters": "U992",
                    "Count": "0",
                    "Count percentages": "0%"
                }
                ]
            }
            ];

        for (const config of this.metricConfigs) {
            // find tables that match this config (could be multiple)
            const tables = resultRaw.filter((t: any) =>
                config.matchTable(t.title) &&
                tableBelongsToEntity(t.title, entity)
            );
            this.logger.info(`[ElasticMetricClient:fetch] 🎯 tablesMatch Config`, {tables, name: config.name}); 
            
            if (!tables.length) continue;

            for (const table of tables) {
                // --- STEP A: pre-filter rows by entity (normalize Filter value) ---
                const rows = Array.isArray(table.table) ? table.table : [];
                const filteredRows =
                    entity && entity.length && !isErrorTable(table.title)
                        ? rows.filter((row: any) => {
                            const rawFilter =
                                row["Filters"] ??
                                row["filters"] ??
                                row["Filters "];
                            const normalized = normalizeFilterValue(rawFilter);
                            if (!normalized) return false;

                            return normalized
                                .toLowerCase()
                                .includes(entity.toLowerCase());
                        }) : rows; // ❗ error table atau entity kosong → ambil semua
                // console.log(table.title, filteredRows);
                // if nothing matches for this entity on this table -> skip
                if (!filteredRows.length) continue;

                // --- STEP B: build MetricSample[] using config.extractSample (unchanged) ---
                const samples = filteredRows
                    .map((row: any) => {
                        // We pass cleaned/normalized fields to extractSample so config doesn't need to hack
                        // Build a small normalized row object for config.extractSample to consume:
                        const normalizedFilter = normalizeFilterValue(row["Filters"] ?? row["filters"]);
                        const normalizedRow = {
                            ...row,
                            Filters: normalizedFilter,
                            "Average totalTime": row["Average totalTime"] ?? row["Average totalTime "],
                            // preserve other keys as-is
                        };
                        // If your extractSample expects raw kibana row, it's still okay because we didn't remove fields
                        return config.extractSample(normalizedRow, entity, table.title);
                    })
                    .filter(Boolean) as MetricSample[];
                if (samples.length === 0) continue;

                // --- STEP C: append into samples store per source:table:entity (no mixing) ---
                const key = `${source}:${table.title}:${entity ?? "ALL"}`;
                if (!this.samples[key]) this.samples[key] = [];

                // push new samples (they already contain timestamp from extractSample)
                this.samples[key].push(...samples);

                // keep sliding window based on sample.timestamp (extractSample should set timestamp)
                // this.samples[key] = this.samples[key].filter(
                //     s => Date.now() - (s.timestamp ?? Date.now()) <= this.windowMs
                // );

                this.logger.info(`[ElasticMetricClient:fetch] 🔎 samples ${key}`);
                this.logger.info(`[ElasticMetricClient:fetch] 🔎 samples ${key}`, {data: this.samples[key]});

                // --- STEP D: analyze using config-specific analyzer ---
                const trend = config.analyze(this.samples[key], {
                    trendThreshold: 6,
                    stabilityStdDev: 0.18,
                    critical: 4000,
                    warning: 2000
                }, this.windowMs);

                this.logger.info(`[ElasticMetricClient:fetch] 🗝️ trend ${key}`);
                this.logger.info("[ElasticMetricClient:fetch] trend analyze", {...trend, name: config.name});
                this.logger.info("[ElasticMetricClient:fetch] 🚩 =============");

                if (trend) {
                    signals.push({
                        key,
                        source: table.title,
                        trend
                    });
                }
            }
        }

        return {
            overallLevel: this.aggregateLevel(signals),
            relatedLevel: signals.filter(signal => signal.trend?.level == this.aggregateLevel(signals)),
            signals
        };
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
        try {
            // const res = await axios.post(url, reqBody);
            // const rawData = (await res).data    
            // console.log(reqBody);
            const dataTable = resultAxiosElastic1.data.chart_extracts.map((chart) => {
                if (!chart.title.toLowerCase().includes("avg")) {
                    return {
                        title: chart.title,
                        table: chart.table.map((row:any) =>
                            Object.fromEntries(
                                Object.entries(row).map(([key, value]) => [
                                    key,
                                    stripKeyPrefix(key, value)
                                ])
                            )
                        )
                    }
                }
                const normalized = chart.table.map((row:any) => {
                    const cleaned = Object.fromEntries(
                        Object.entries(row).map(([key, value]) => [
                            key,
                            stripKeyPrefix(key, value)
                        ])
                    )
                    return cleaned
                })
                const filtered = getMaxDataPerMinute(normalized)
                return {
                    title: chart.title,
                    table: filtered
                }
            })
            return {chart_extracts: dataTable}
        } catch (error: any) {
            this.logger.error(`[ElasticMetricClient:callElastic] Error CallApiElasticKibana ${error?.message}`);
        }
    }
}