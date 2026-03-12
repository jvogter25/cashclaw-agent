import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runTokenomicsReview(target: string): Promise<string> {
  console.log(`[tokenomics-review] Analyzing: ${target}`);

  const searchResults = await braveSearch(`${target} tokenomics supply schedule vesting`);

  const prompt = `You are a senior tokenomics analyst. Perform a rigorous tokenomics review of the following token/project.

TOKEN/PROJECT: ${target}

RESEARCH DATA:
${searchResults || 'No external data available — analyze based on provided details.'}

Produce a structured tokenomics review in markdown:

# Tokenomics Review: ${target}

## Executive Summary
2-3 sentence overview of the token design quality.

## Supply & Distribution
- Total supply
- Allocation breakdown (team, investors, community, treasury, etc.)
- Any concentration risks

## Vesting & Unlock Schedule
- Key vesting cliffs
- Unlock timeline risk assessment
- Potential sell pressure events

## Inflation & Emissions
- Emission rate and schedule
- Long-term inflation impact
- Burn or deflationary mechanisms (if any)

## Value Accrual
- How does the token capture protocol value?
- Fee sharing, governance rights, staking utility
- Strength of value accrual mechanism

## Red Flags
Bulleted list of concerns. Be direct. If there are none, say so.

## Comparable Tokens
2-3 relevant comparisons with commentary on how this design compares.

## Score: X/10
One-line rationale.

## Recommendations
3-5 specific, actionable improvements.

---
*Vantage Tokenomics Review — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
