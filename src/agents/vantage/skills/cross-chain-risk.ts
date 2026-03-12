import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runCrossChainRisk(target: string): Promise<string> {
  console.log(`[cross-chain-risk] Analyzing: ${target}`);

  const bridgeName = target.split(' ')[0];
  const [securityData, incidentData, tvlData] = await Promise.all([
    braveSearch(`${bridgeName} bridge audit security review`),
    braveSearch(`${bridgeName} bridge hack exploit incident vulnerability`),
    braveSearch(`${bridgeName} bridge TVL volume stats`),
  ]);

  const prompt = `You are a cross-chain security analyst. Analyze the risk profile of the following bridge or cross-chain routing scenario.

BRIDGE / ROUTING SCENARIO: ${target}

SECURITY & AUDIT DATA:
${securityData || 'No audit data retrieved.'}

INCIDENT HISTORY:
${incidentData || 'No incident data retrieved.'}

TVL & VOLUME DATA:
${tvlData || 'No TVL data retrieved.'}

Produce a structured risk report in markdown:

# Cross-Chain Risk Report: ${target}

## Bridge Overview
- What type of bridge is this? (Lock-and-mint, liquidity network, optimistic, ZK, etc.)
- Chains supported
- Approximate TVL and daily volume
- Operator: team, multisig, or decentralized?

## Risk Factor Analysis

### Smart Contract Risk
- Audit history (who, when)
- Complexity and attack surface
- Upgradability / admin key risk
- Rating: LOW / MEDIUM / HIGH / CRITICAL

### Centralization Risk
- Validator set size and diversity
- Operator control / emergency pause capability
- Multisig structure (if applicable)
- Rating: LOW / MEDIUM / HIGH / CRITICAL

### Historical Incidents
- Any past hacks, exploits, or near-misses
- Total funds lost (if any)
- Response quality post-incident

### Liquidity Risk
- Depth of liquidity on target chain
- Slippage risk for large transfers
- Rebalancing mechanisms

## Overall Security Score: X/10
One-line rationale.

## Alternatives
For the same routing objective, consider:
1. [Alternative 1] — pros/cons
2. [Alternative 2] — pros/cons

## Verdict
**USE / USE WITH CAUTION / AVOID**
3-5 sentence recommendation covering: risk tolerance match, position sizing guidance, monitoring recommendations.

---
*Vantage Cross-Chain Risk Report — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
