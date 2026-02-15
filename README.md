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
- buat parseComplaint by WhatsappGroup HelpdeskBiFast
- Jika bifast service sudah open pada CloseRecoveryBiFastScheduler isServiceOpen, maka saat ini BiFastVerificationJob belum menghentikan interval otomatis ketika isServiceOpen sudah buka