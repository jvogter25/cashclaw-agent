import { anthropic } from '../../lib/anthropic.js';
import type { TaskAnalysis } from '../../inbox.js';

export type SentinelSkill =
  | 'regulatory_intelligence'
  | 'grant_writing'
  | 'kol_research'
  | 'token_legal_risk'
  | 'ecosystem_fit';

const SYSTEM_PROMPT = `You are Sentinel, a Web3 compliance and growth intelligence agent operating on the Moltlaunch marketplace.

You offer exactly 5 services:
1. Regulatory Intelligence — SEC/CFTC/MiCA action tracking, jurisdiction risk scoring, compliance calendar
2. Grant Writing — ecosystem grant applications for Uniswap, Arbitrum, Optimism, and other programs
3. KOL Research — identify relevant influencers/KOLs, analyze reach and on-chain following
4. Token Legal Risk — flag legal risks in token structure and distribution (research, not legal advice)
5. Ecosystem Fit — "which chain should we build on?" — ecosystem comparison, grant programs, community size

Pricing:
- regulatory_intelligence: 0.025 ETH
- grant_writing: 0.025 ETH
- token_legal_risk: 0.025 ETH
- kol_research: 0.02 ETH
- ecosystem_fit: 0.02 ETH

Your response MUST be valid JSON only (no markdown, no explanation outside JSON).`;

const ANALYSIS_PROMPT = (requestText: string) => `Analyze this task request and determine if it matches one of your 5 services:

REQUEST:
${requestText}

Respond with JSON:
{
  "accepted": true/false,
  "skill": "regulatory_intelligence" | "grant_writing" | "kol_research" | "token_legal_risk" | "ecosystem_fit" | null,
  "priceEth": 0.02 or 0.025 (number, only if accepted),
  "target": "the specific subject extracted from the request (jurisdiction, grant program, project name, token details, chain comparison)",
  "quoteMessage": "confident 2-3 sentence acceptance message explaining what you'll deliver",
  "declineReason": "short polite decline reason (only if accepted=false)"
}`;

export async function analyzeTask(requestText: string): Promise<TaskAnalysis> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: ANALYSIS_PROMPT(requestText) }],
    });

    const raw = (msg.content[0] as { type: 'text'; text: string }).text.trim();
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned) as TaskAnalysis;

    if (parsed.accepted && parsed.priceEth) {
      parsed.priceEth = Math.max(0.02, Math.min(0.025, parsed.priceEth));
    }

    return parsed;
  } catch (err) {
    console.error('[sentinel/analyze] Failed:', (err as Error).message);
    return {
      accepted: false,
      skill: null,
      priceEth: 0,
      quoteMessage: '',
      declineReason: 'Internal analysis error — please try again.',
      target: '',
    };
  }
}
