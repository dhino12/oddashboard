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
        if (!facts.hasOpenIncident) {
            const findCritical = (
                facts.criticalSource.find(source => source.includes("Avg Transaction")) &&
                facts.criticalSource.find(source => source.includes("Error Transfer - increasing"))
            )
            if (findCritical) {
                logger.error("CONFIRMED_CRITICAL_INCIDENT - " + facts.criticalSource.toString())
                logger.info("[AdvancedBifastPolicy:decide] CONFIRMED_CRITICAL_INCIDENT " + facts.criticalSource.toString())
                return "CONFIRMED_INCIDENT"
            }
            if (facts.criticalSource.find(source => source.includes("Error Transfer - increasing"))) {
                return "CONFIRMED_INCIDENT"
            }
            // return "CONFIRMED_INCIDENT"
        }
        return "WAIT"
    }
}