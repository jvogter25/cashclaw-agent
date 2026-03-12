import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runDaoGovernance(target: string): Promise<string> {
  console.log(`[dao-governance] Analyzing governance: ${target.slice(0, 80)}`);

  const searchResults = await braveSearch(`${target.split('\n')[0]} DAO governance proposal vote`);

  const prompt = `You are a DAO governance strategist. Analyze the following governance proposal and produce a clear voting recommendation.

PROPOSAL / DAO CONTEXT:
${target}

ADDITIONAL RESEARCH:
${searchResults || 'No additional context retrieved.'}

Produce a structured governance analysis in markdown:

# Governance Analysis

## Proposal Summary
What is being proposed? Plain language, 2-4 sentences. Include key parameters (amounts, timelines, permissions).

## Proposer Context
Who is the proposer? Track record? Any conflicts of interest? (Note if unknown.)

## Key Arguments FOR
Bulleted list of the strongest reasons to vote YES.

## Key Arguments AGAINST
Bulleted list of the strongest reasons to vote NO or ABSTAIN.

## Risk Assessment
- **Execution Risk**: Can this actually be implemented as described?
- **Financial Risk**: Any treasury, liquidity, or economic risks?
- **Governance Risk**: Does this concentrate power or set a concerning precedent?
- **Smart Contract Risk**: Any new contracts or parameter changes involved?

## Comparable Precedents
1-3 similar proposals from other DAOs and their outcomes, if relevant.

## Recommendation
**VOTE: YES / NO / ABSTAIN**

Rationale: 3-5 sentences explaining the recommendation.

Conditions (if any): What would change this recommendation?

---
*Vantage Governance Analysis — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
