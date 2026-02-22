# Open Incident Bot
https://www.prisma.io/docs/orm/overview/databases/mysql

## Structure Folder

```
src/
├── main.ts
├── app.ts
│
├── config/
│   ├── env.ts
│   ├── redis.ts
│   ├── prisma.ts
│   └── logger.ts
│
├── domain/
│   ├── incident/
│   │   ├── Incident.ts
│   │   ├── IncidentStatus.ts
│   │   ├── IncidentSource.ts
│   │   ├── IncidentRepository.ts        <-- interface (port)
│   │   └── IncidentPolicy.ts
│   │
│   ├── monitoring/
│   │   ├── MonitoringEvent.ts
│   │   ├── MonitoringStatus.ts
│   │   └── MonitoringState.ts
│   │
│   └── shared/
│       ├── Entity.ts
│       ├── ValueObject.ts
│       └── DomainEvent.ts
│
├── application/
│   ├── ports/
│   │   ├── EventStore.ts                <-- Mysql ZSET port
│   │   ├── MonitoringStateStore.ts
│   │   ├── DedupLock.ts
│   │   └── IncidentGateway.ts           <-- external system port (Remedy)
│   │
│   ├── services/
│   │   ├── SlidingWindowEvaluator.ts
│   │   ├── DeduplicationService.ts
│   │   └── MonitoringStateService.ts
│   │
│   └── usecases/
│       ├── ProcessMonitoringEvent/
│       │   ├── ProcessMonitoringEvent.ts
│       │   └── ProcessMonitoringEventDTO.ts
│       ├── EvaluateIncident/
│       │   ├── EvaluateIncident.ts
│       │   └── EvaluateIncidentResult.ts
│       ├── CreateIncident/
│       │   └── CreateIncident.ts
│       └── ResolveIncident/
│           └── ResolveIncident.ts
│
├── infrastructure/
│   ├── http/
│   │   ├── express.ts
│   │   └── routes/
│   │       ├── qris.routes.ts
│   │       └── health.routes.ts
│   │
│   ├── consumers/
│   │   ├── whatsapp/
│   │   │   ├── WhatsAppClient.ts
│   │   │   ├── MessageParser.ts
│   │   │   └── BifastConsumer.ts
│   │   └── api/
│   │       └── QrisHealthConsumer.ts
│   │
│   ├── external/
│   │   └── remedy/
│   │       ├── RemedyAuthClient.ts         <-- calls /jwt/login
│   │       ├── RemedyTokenStore.ts         <-- mysql-backed token cache
│   │       ├── RemedyIncidentClient.ts     <-- uses token to call open_incident
│   │       └── RemedyCircuitBreaker.ts
│   │
│   ├── persistence/
│   │   ├── redis/
│   │   │   ├── RedisClient.ts               <-- Redis Cache for plan B
│   │   │   ├── EventStoreRedis.ts
│   │   │   ├── MonitoringStateRedis.ts
│   │   │   └── DedupLockRedis.ts
│   │   └── mysql/
│   │       ├── PrismaClient.ts
│   │       └── IncidentPrismaRepository.ts <-- implements domain IncidentRepository
│   │
│   ├── scheduler/
│   │   ├── QrisHealthCheckJob.ts
│   │   └── IncidentResolveJob.ts
│   │
│   └── logger/
│       └── WinstonLogger.ts
│
├── interfaces/
│   ├── controllers/
│   │   ├── QrisController.ts
│   │   └── IncidentController.ts
│   ├── presenters/
│   │   └── IncidentPresenter.ts
│   └── mappers/
│       └── MonitoringEventMapper.ts
│
├── utils/
│   ├── Time.ts
│   ├── UUID.ts
│   └── Guard.ts
│
└── tests/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── e2e/
```

# Example Message / API Response
## Whatsapp Message BiFast
```
💡 BI Fast [CT Outgoing] 
DANAIDJ1 Has successfully Closed Automatically on 2026-01-22 17:24:15.0

source: autoclose_bifast
```
```
❌ BI Fast DANA [CT Outgoing] 
DANAIDJ1 Has successfully Closed Automatically on 2026-01-22 17:24:15.0

source: autoclose_bifast
```
```
❌ BI FAST [CT Outgoing]
Error rate U173 DANAIDJ1 : 3.95%
Error Count: 9 out of 228 is U173

source: autoclose_bifast
```

# TODO
- ✅ fetchFromElastic harus diubah seluruhnya hasil dari respbody callElastic by crawling playwright service
- ✅ buat parseComplaint by WhatsappGroup HelpdeskBiFast
- ✅ Jika bifast service sudah open pada CloseRecoveryBiFastScheduler isServiceOpen, maka saat ini BiFastVerificationJob belum menghentikan interval otomatis ketika isServiceOpen sudah buka
- Logger dengan membuat template custom yang memuat: data, message, dll
- [ALTERNATE] Mencoba untuk menambah flow close -> open -> close, di `ProcessMonitoringEvent.ts` agar, open -> close 2x, lalu check crawling elastic (apakah kenaikan atau penurunan), lalu check wag bifast helpdesk (apakah ada complaint), create incident
- ✅ menambahkan request json untuk crawling ini, semua setelah extract_table jangan lupa click `button[aria-label='Close Inspector']`
- mengubah create pada IncidentPrismaRepository.ts menjadi upsert saja

{
  "action": "scrape",
  "url": "http://kibana.soabiru.corp.bankmandiri.co.id:5600/app/dashboards#/view/18f4bb53-8bf7-4759-930a-5bd9de96db7e?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-15m,to:now))",
  "viewport": {
    "width": 1920,
    "height": 900
  },
  "steps": [
    {
      "type": "form",
      "selectors": {
        "username": "input[data-test-subj='loginUsername']",
        "password": "input[data-test-subj='loginPassword']",
        "submit": "button[data-test-subj='loginSubmit']"
      },
      "values": {
        "username": "mdr.monitoring",
        "password": "Mandiri123"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Options for panel 6']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Options for panel 4']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Options for panel 8']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Options for panel 10']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Inquiry BCA']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Inquiry BRI']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Inquiry BNI']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Inquiry BSI']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Inquiry Dana']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Inquiry Sea Bank']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Transfer BCA']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Transfer BRI']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Transfer BNI']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Transfer BSI']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Transfer Dana']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    },
    {
      "type": "interaction",
      "actions": [
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[aria-label='Panel options for Transfer Sea Bank']"
          }
        },
        {
          "type": "click",
          "selector": {
            "buttonDetail": "button[data-test-subj='embeddablePanelAction-openInspector']"
          }
        },
        {
          "type": "wait",
          "selector": {
            "table": "div[data-test-subj='inspectorTable'] table"
          }
        }
      ]
    },
    {
      "type": "extract-table",
      "selectors": {
        "table": "div[data-test-subj='inspectorTable']"
      },
      "pagination": {
        "nextButton": "button[data-test-subj='pagination-button-next']"
      }
    }
  ],
  "screenshot": {
    "enabled": true,
    "options": [
      {
        "selector": "",
        "fullPage": false
      }
    ]
  }
}
```