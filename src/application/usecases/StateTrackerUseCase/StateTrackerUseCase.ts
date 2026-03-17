import { IncidentState, InMemoryIncidentStateMachine } from "../../../infrastructure/persistence/memory/InMemoryIncidentStateMachine";

export class StateTrackerUseCase {
    constructor (private readonly stateMachine: InMemoryIncidentStateMachine) {}
    setTransition(entity: string, decisionPolicy: IncidentState, criticalSource: string[], hasTotalComplaint: number) {
        const current = this.stateMachine.getCurrentState(entity)
        let noteMessage = `total complaint ${hasTotalComplaint}`;
        if (decisionPolicy === "CONFIRMED_INCIDENT") {
            this.stateMachine.transition(entity, criticalSource.join(", "), "WAIT", noteMessage)
            noteMessage = `INCIDENT HAS BEEN CONFIRMED`
        } 
        if (decisionPolicy === "FALSE_POSITIVE") {
            noteMessage = ''
        }
        if (current === decisionPolicy && decisionPolicy !== "WAIT") {
            return 
        }
        if (decisionPolicy == "CONFIRMED_INCIDENT" && current == "WAIT") {
            this.stateMachine.transition(entity, criticalSource.join(", "), "WAIT", `total complaint: ${hasTotalComplaint}`)
        }
        this.stateMachine.transition(entity, criticalSource.join(", "), decisionPolicy, noteMessage)
    }
    setOpenTransition(entity: string) {
        this.stateMachine.transition(entity, undefined, "NORMAL", `Trx BiFast ${entity} has been open`)
    }
}