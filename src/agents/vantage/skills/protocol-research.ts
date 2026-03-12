import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runProtocolResearch(protocol: string): Promise<string> {
  console.log(`[protocol-research] Researching: ${protocol}`);

  const [tvlData, securityData, competitiveData] = await Promise.all([
    braveSearch(`${protocol} TVL site:defillama.com OR site:dune.com`),
    braveSearch(`${protocol} audit security hack vulnerability`),
    braveSearch(`${protocol} competitors alternatives comparison 2024 2025`),
  ]);

  const prompt = `You are a senior DeFi protocol analyst. Produce an investment-grade research note on the following protocol.

PROTOCOL: ${protocol}

TVL & METRICS DATA:
${tvlData || 'No TVL data retrieved.'}

SECURITY & AUDIT DATA:
${securityData || 'No security data retrieved.'}

COMPETITIVE LANDSCAPE:
${competitiveData || 'No competitive data retrieved.'}

Produce a structured research note in markdown:

# Protocol Research: ${protocol}

## Overview
What does this protocol do? Core mechanism in plain language. 2-3 sentences.

## TVL & Traction
- TVL (current estimate or trend)
- User/transaction activity
- Revenue or fee generation
- Growth trajectory

## Team & Credibility
- Team background (doxxed vs anon)
- Track record
- Backers / investors
- Community size

## Security & Audit Status
- Audit history (who, when, findings)
- Bug bounty program
- Historical incidents
- Smart contract risk level: LOW / MEDIUM / HIGH

## Competitive Position
- Top 3 direct competitors
- Protocol's differentiated edge
- Moat strength: WEAK / MODERATE / STRONG

## Build Recommendation
**Should you build on ${protocol}?**
RECOMMENDED / CONDITIONAL / NOT RECOMMENDED
3-5 sentence rationale covering: stability, ecosystem support, risk, longevity.

## Key Risks
Bulleted list of top risks to monitor.

---
*Vantage Protocol Research — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
