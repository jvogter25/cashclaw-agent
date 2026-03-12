import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runTokenLegalRisk(target: string): Promise<string> {
  console.log(`[token-legal-risk] Analyzing legal risk: ${target}`);

  const [howeyData, enforcementData] = await Promise.all([
    braveSearch(`Howey test crypto token security utility classification SEC 2024 2025`),
    braveSearch(`SEC enforcement token unregistered security 2024 2025`),
  ]);

  const prompt = `You are a crypto legal risk researcher. Analyze the following token structure for potential legal risks. This is research and intelligence, not legal advice.

TOKEN/PROJECT DETAILS:
${target}

HOWEY TEST & CLASSIFICATION DATA:
${howeyData || 'No data retrieved.'}

RECENT ENFORCEMENT PRECEDENTS:
${enforcementData || 'No enforcement data retrieved.'}

Produce a structured token legal risk report in markdown:

# Token Legal Risk Analysis: ${target}

**DISCLAIMER: This is research and intelligence only, not legal advice. Consult a qualified securities attorney before making any compliance decisions.**

## Token Classification Analysis

### Howey Test Assessment
- Investment of money? YES/NO/PARTIAL
- Common enterprise? YES/NO/PARTIAL
- Expectation of profits? YES/NO/PARTIAL
- From efforts of others? YES/NO/PARTIAL

**Preliminary classification: LIKELY SECURITY / LIKELY UTILITY / AMBIGUOUS**

Rationale: 3-4 sentences explaining the assessment.

## Distribution Risk Factors

### Public Sale Structure
- Sale type and risk level
- Geographic restrictions needed
- KYC/AML requirements

### Allocation Risks
- Team/investor allocation as % of total
- Lock-up adequacy
- Concentration concerns

## Jurisdiction-Specific Risks

| Jurisdiction | Risk | Trigger | Mitigation |
|---|---|---|---|
| United States | 🔴/🟡/🟢 | ... | ... |
| European Union | 🔴/🟡/🟢 | ... | ... |
| UK | 🔴/🟡/🟢 | ... | ... |

## Most Relevant Enforcement Precedents
2-3 SEC/CFTC actions most analogous to this token structure and what they tell us.

## Red Flags Identified
Bulleted list of specific elements in this token design that create legal exposure.

## Risk Mitigation Recommendations
Specific structural changes or legal steps that would reduce exposure:
1. ...
2. ...
3. ...

## Overall Risk Level: LOW / MEDIUM / HIGH / CRITICAL

**Next Step:** [Specific type of attorney or legal resource recommended — e.g., "Seek a securities attorney specializing in digital assets who can provide a legal opinion letter on the Howey analysis."]

---
*Sentinel Token Legal Risk Analysis — ${new Date().toISOString().split('T')[0]}*
*NOT LEGAL ADVICE. For informational purposes only.*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
