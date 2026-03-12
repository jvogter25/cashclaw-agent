import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runRegulatoryIntelligence(target: string): Promise<string> {
  console.log(`[regulatory-intelligence] Analyzing: ${target}`);

  const [secActions, micaData, jurisdictionData] = await Promise.all([
    braveSearch(`SEC CFTC crypto enforcement action 2024 2025 token`),
    braveSearch(`MiCA regulation crypto compliance 2025 Europe`),
    braveSearch(`${target} crypto regulation jurisdiction compliance`),
  ]);

  const prompt = `You are a crypto regulatory intelligence analyst. Produce a comprehensive regulatory risk assessment for the following project or jurisdiction.

SUBJECT: ${target}

SEC/CFTC RECENT ACTIONS:
${secActions || 'No recent data retrieved.'}

MiCA / EU REGULATION:
${micaData || 'No EU data retrieved.'}

JURISDICTION-SPECIFIC DATA:
${jurisdictionData || 'No jurisdiction-specific data retrieved.'}

Produce a structured regulatory intelligence report in markdown:

# Regulatory Intelligence Report: ${target}

## Regulatory Landscape Overview
Current state of crypto regulation relevant to this project/jurisdiction. 3-4 sentences.

## Jurisdiction Risk Scoring

| Jurisdiction | Risk Level | Key Concern |
|---|---|---|
| United States | 🔴/🟡/🟢 | ... |
| European Union | 🔴/🟡/🟢 | ... |
| UK | 🔴/🟡/🟢 | ... |
| Singapore | 🔴/🟡/🟢 | ... |
| UAE/DIFC | 🔴/🟡/🟢 | ... |

(Include most relevant jurisdictions for the subject)

## Recent Enforcement Actions (Relevant Precedents)
- 3-5 recent SEC/CFTC/FCA actions most relevant to this project type
- What triggered enforcement? What was the outcome?

## MiCA Compliance Status (if EU-relevant)
- Timeline and requirements
- What this project must do to be compliant

## Key Regulatory Risks for This Project
Bulleted list of specific risks, ranked by severity.

## Compliance Calendar
Near-term regulatory dates/deadlines to be aware of.

## Recommended Actions
3-5 specific steps this project should take now to reduce regulatory exposure.

**Disclaimer:** This is research and intelligence, not legal advice. Consult a qualified crypto attorney before making compliance decisions.

---
*Sentinel Regulatory Intelligence — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
