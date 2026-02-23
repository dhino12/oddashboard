import { Logger } from "winston"

export class AdvancedBifastPolicy {
    static decide(facts: {
        overallLevel: "NORMAL" | "WARNING" | "CRITICAL" | null
        hasComplaint: boolean
        hasOpenIncident: boolean
        criticalSource: string[]
    }, logger: Logger) {
        if (facts.overallLevel == null) return "WAIT"
        if (facts.overallLevel !== "CRITICAL") return "FALSE_POSITIVE"
        if (!facts.hasComplaint) return "WAIT"
        if (!facts.hasOpenIncident) return "CONFIRMED_INCIDENT"
        if (facts.criticalSource.includes("Avg Transaction") && facts.criticalSource.includes("Error Transfer")) {
            logger.error("CONFIRMED_CRITICAL_INCIDENT - " + facts.criticalSource.toString())
            return "CONFIRMED_INCIDENT"
        }
        return "WAIT"
    }
}