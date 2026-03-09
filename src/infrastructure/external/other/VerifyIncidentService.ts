// import { InMemoryVerifyIncidents } from "../../persistence/memory/InMemoryVerifyIncident";

// interface VerifyIncidentRecord {
//     entity: string,
//     timestamp: number,
//     level: string,
//     metricName: string
// }

// // infrastructure/external/WagHelpdeskService.ts
// export class VerifyIncidentService {
//     constructor(
//         private readonly verifyInc: InMemoryVerifyIncidents
//     ) {}

//     async save({entity, level, metricName}: {entity: string, level: string, metricName: string}): Promise<boolean> {
//         this.verifyInc.save({
//             entity, level, metricName
//         })
//         return true
//     }

//     getByEntity(entity: string): VerifyIncidentRecord[] {
//         return this.verifyInc.getByEntity(entity)
//     }
// }
