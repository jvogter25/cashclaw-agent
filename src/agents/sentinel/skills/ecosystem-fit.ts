import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runEcosystemFit(target: string): Promise<string> {
  console.log(`[ecosystem-fit] Analyzing ecosystem fit for: ${target}`);

  const [ecosystemData, grantData, devData] = await Promise.all([
    braveSearch(`${target} blockchain ecosystem TVL users developers 2024 2025`),
    braveSearch(`${target} ecosystem grants program fund builders 2024 2025`),
    braveSearch(`${target} developer activity GitHub activity builder community`),
  ]);

  const prompt = `You are a Web3 ecosystem strategist. Help this team decide which blockchain ecosystem to build on.

PROJECT/CONTEXT:
${target}

ECOSYSTEM DATA:
${ecosystemData || 'No ecosystem data retrieved.'}

GRANT PROGRAM DATA:
${grantData || 'No grant data retrieved.'}

DEVELOPER ACTIVITY DATA:
${devData || 'No developer data retrieved.'}

Produce a structured ecosystem comparison in markdown:

# Ecosystem Fit Analysis: ${target}

## Project Requirements Profile
Based on the project description, what does this project need from its ecosystem?
- User base type (retail / developer / institutional)
- Transaction volume expectations (high freq / low freq)
- Smart contract complexity
- Cross-chain needs
- Community type needed

## Ecosystem Comparison

### Base
- **TVL & Users:** ...
- **Transaction costs:** ...
- **Developer tooling:** ...
- **Grant programs:** ...
- **Community fit:** ...
- **Fit score for this project:** 🔴/🟡/🟢

### Arbitrum
- **TVL & Users:** ...
- **Transaction costs:** ...
- **Developer tooling:** ...
- **Grant programs:** (Arbitrum Foundation, LTIPP, STIP)
- **Community fit:** ...
- **Fit score:** 🔴/🟡/🟢

### Optimism / Superchain
- **TVL & Users:** ...
- **Transaction costs:** ...
- **Developer tooling:** ...
- **Grant programs:** (RetroPGF, Optimism Grants Council)
- **Community fit:** ...
- **Fit score:** 🔴/🟡/🟢

### Solana
- **TVL & Users:** ...
- **Transaction costs:** ...
- **Developer tooling:** ...
- **Grant programs:** (Solana Foundation)
- **Community fit:** ...
- **Fit score:** 🔴/🟡/🟢

### Other Relevant Ecosystems
(Include any others relevant to the project type)

## Grant Opportunity Map

| Ecosystem | Program | Size | Deadline | Fit |
|---|---|---|---|---|
| ... | ... | ... | ... | HIGH/MED/LOW |

## Decision Matrix

| Factor | Weight | Base | Arbitrum | Optimism | Solana |
|---|---|---|---|---|---|
| User fit | 25% | ... | ... | ... | ... |
| Dev tooling | 20% | ... | ... | ... | ... |
| Grant access | 20% | ... | ... | ... | ... |
| Cost | 15% | ... | ... | ... | ... |
| Community | 20% | ... | ... | ... | ... |
| **Total** | | | | | |

## Recommendation
**BUILD ON: [Ecosystem Name]**

Primary reasons (3-5 bullets):
- ...

Secondary consideration: [Runner-up ecosystem and why]

Timing note: [Any ecosystem-specific timing considerations — upcoming upgrades, grant deadlines, community events]

---
*Sentinel Ecosystem Fit Analysis — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
