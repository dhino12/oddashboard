export class AdvancedBifastPolicy {
    static decide(facts: {
        overallLevel: "NORMAL" | "WARNING" | "CRITICAL" | null
        hasComplaint: boolean
        hasOpenIncident: boolean
        criticalSource: string[]
    }) {
        if (facts.overallLevel == null) return "WAIT"
        if (facts.overallLevel !== "CRITICAL") return "FALSE_POSITIVE"
        if (!facts.hasComplaint) return "WAIT"
        if (!facts.hasOpenIncident) return "CONFIRMED_INCIDENT"
        if (facts.criticalSource.includes("BIFAST_TX") && facts.criticalSource.includes("BIFAST_TX_CIHUB")) {
            return "CONFIRMED_INCIDENT"
        }
        return "WAIT"
    }
}