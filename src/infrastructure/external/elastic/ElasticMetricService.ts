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

const dataResponseElastic = {
    "rawResponse": {
        "took": 156,
        "timed_out": false,
        "_shards": {
            "total": 14,
            "successful": 14,
            "skipped": 12,
            "failed": 0
        },
        "hits": {
            "total": 18453,
            "max_score": null,
            "hits": []
        },
        "aggregations": {
            "0": {
                "buckets": [
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 876.175
                        },
                        "doc_count": 80
                        },
                        "BNI": {
                        "2": {
                            "value": 547.5238095238095
                        },
                        "doc_count": 21
                        },
                        "BRI": {
                        "2": {
                            "value": 961.515625
                        },
                        "doc_count": 64
                        },
                        "BSI": {
                        "2": {
                            "value": 760.875
                        },
                        "doc_count": 8
                        },
                        "Dana": {
                        "2": {
                            "value": 766.25
                        },
                        "doc_count": 4
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 639.6470588235294
                        },
                        "doc_count": 17
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:57:45.000+07:00",
                    "key": 1770699465000,
                    "doc_count": 208
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 920.605504587156
                        },
                        "doc_count": 109
                        },
                        "BNI": {
                        "2": {
                            "value": 652.7692307692307
                        },
                        "doc_count": 39
                        },
                        "BRI": {
                        "2": {
                            "value": 641.75
                        },
                        "doc_count": 96
                        },
                        "BSI": {
                        "2": {
                            "value": 594.3846153846154
                        },
                        "doc_count": 13
                        },
                        "Dana": {
                        "2": {
                            "value": 799.7777777777778
                        },
                        "doc_count": 9
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 615.5263157894736
                        },
                        "doc_count": 19
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:57:50.000+07:00",
                    "key": 1770699470000,
                    "doc_count": 324
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 873.4883720930233
                        },
                        "doc_count": 129
                        },
                        "BNI": {
                        "2": {
                            "value": 641.90625
                        },
                        "doc_count": 32
                        },
                        "BRI": {
                        "2": {
                            "value": 696.9578947368421
                        },
                        "doc_count": 95
                        },
                        "BSI": {
                        "2": {
                            "value": 725.4285714285714
                        },
                        "doc_count": 7
                        },
                        "Dana": {
                        "2": {
                            "value": 1071.2727272727273
                        },
                        "doc_count": 11
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 712.9583333333334
                        },
                        "doc_count": 24
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:57:55.000+07:00",
                    "key": 1770699475000,
                    "doc_count": 334
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 927.6299212598425
                        },
                        "doc_count": 127
                        },
                        "BNI": {
                        "2": {
                            "value": 688.2666666666667
                        },
                        "doc_count": 30
                        },
                        "BRI": {
                        "2": {
                            "value": 917.2916666666666
                        },
                        "doc_count": 96
                        },
                        "BSI": {
                        "2": {
                            "value": 643.7777777777778
                        },
                        "doc_count": 9
                        },
                        "Dana": {
                        "2": {
                            "value": 1574.6666666666667
                        },
                        "doc_count": 6
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 738.6666666666666
                        },
                        "doc_count": 12
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:58:00.000+07:00",
                    "key": 1770699480000,
                    "doc_count": 308
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 851.5137614678899
                        },
                        "doc_count": 109
                        },
                        "BNI": {
                        "2": {
                            "value": 552.7586206896551
                        },
                        "doc_count": 29
                        },
                        "BRI": {
                        "2": {
                            "value": 1229.4351851851852
                        },
                        "doc_count": 108
                        },
                        "BSI": {
                        "2": {
                            "value": 546.7
                        },
                        "doc_count": 10
                        },
                        "Dana": {
                        "2": {
                            "value": 1989.25
                        },
                        "doc_count": 4
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 578.2105263157895
                        },
                        "doc_count": 19
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:58:05.000+07:00",
                    "key": 1770699485000,
                    "doc_count": 322
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 877.0975609756098
                        },
                        "doc_count": 123
                        },
                        "BNI": {
                        "2": {
                            "value": 552.75
                        },
                        "doc_count": 28
                        },
                        "BRI": {
                        "2": {
                            "value": 1884.8217821782177
                        },
                        "doc_count": 101
                        },
                        "BSI": {
                        "2": {
                            "value": 550
                        },
                        "doc_count": 6
                        },
                        "Dana": {
                        "2": {
                            "value": 1864.888888888889
                        },
                        "doc_count": 9
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 564.0666666666667
                        },
                        "doc_count": 15
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:58:10.000+07:00",
                    "key": 1770699490000,
                    "doc_count": 317
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 920.6302521008404
                        },
                        "doc_count": 119
                        },
                        "BNI": {
                        "2": {
                            "value": 597.1714285714286
                        },
                        "doc_count": 35
                        },
                        "BRI": {
                        "2": {
                            "value": 775.8255813953489
                        },
                        "doc_count": 86
                        },
                        "BSI": {
                        "2": {
                            "value": 606.0833333333334
                        },
                        "doc_count": 12
                        },
                        "Dana": {
                        "2": {
                            "value": 3934.8888888888887
                        },
                        "doc_count": 9
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 565
                        },
                        "doc_count": 16
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:58:15.000+07:00",
                    "key": 1770699495000,
                    "doc_count": 317
                },
                {
                    "1": {
                    "buckets": {
                        "BCA": {
                        "2": {
                            "value": 964.0603448275862
                        },
                        "doc_count": 116
                        },
                        "BNI": {
                        "2": {
                            "value": 628.4761904761905
                        },
                        "doc_count": 21
                        },
                        "BRI": {
                        "2": {
                            "value": 728.2543859649123
                        },
                        "doc_count": 114
                        },
                        "BSI": {
                        "2": {
                            "value": 616.5714285714286
                        },
                        "doc_count": 14
                        },
                        "Dana": {
                        "2": {
                            "value": 2263.8333333333335
                        },
                        "doc_count": 6
                        },
                        "Sea Bank": {
                        "2": {
                            "value": 591.2142857142857
                        },
                        "doc_count": 14
                        }
                    }
                    },
                    "key_as_string": "2026-02-10T11:58:20.000+07:00",
                    "key": 1770699500000,
                    "doc_count": 335
                },
                ]
            }
        }
    }
}

export class ElasticMetricService {
    private readonly windowMs = 5 * 60 * 1000

    private samples: {
        [key: string]: MetricSample[]
    } = {}

    constructor(private readonly logger: Logger) {}

    async fetch(source: string,entity: string): Promise<{
        trend: "CRITICAL" | "WARNING" | "NORMAL" | null
        avgRespTime: number
        u173Count: number
    }> {
        const key = `${source}:${entity}`
        const metric = await this.fetchFromElastic(entity)
        if (Object.keys(this.samples).length == 0 || this.samples[key] == undefined) {
            this.samples[key] = []
        }
        this.recordSample(key, metric)
        const trend = this.analyzeTrend(key)
        console.log("======================= TREND");
        this.logger.info(trend)

        return {
            trend: trend ? trend.level : null,
            avgRespTime: metric.avgRespTime,
            u173Count: metric.u173Count
        }
    }

    private async fetchFromElastic(entity: string): Promise<MetricSample> {
        const data = await this.callElastic() // your real API call
        const buckets = data.rawResponse.aggregations["0"].buckets
        // ambil bucket terakhir (latest time)
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

    // ============================
    // RECORD SAMPLE
    // ============================

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

    // ============================
    // TREND ANALYZER
    // ============================

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

    // ============================
    // MOCK CALL
    // ============================

    private async callElastic(): Promise<any> {
        // real elastic API call here
        const res = axios.get("http://localhost:4000/bifast-resptime");
        const rawData = (await res).data
        return rawData.data
    }
}


// infrastructure/external/WagHelpdeskService.ts
export class WagHelpdeskService {
    async hasComplaint(entity: string): Promise<boolean> {
        // scrape / API / bot parse
        return true;
    }
}
