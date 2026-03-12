import { anthropic } from '../../lib/anthropic.js';
import type { TaskAnalysis } from '../../inbox.js';

export type VantageSkill =
  | 'tokenomics_review'
  | 'wallet_analysis'
  | 'protocol_research'
  | 'dao_governance'
  | 'cross_chain_risk';

const SKILL_DESCRIPTIONS: Record<VantageSkill, string> = {
  tokenomics_review: 'Analyze token design — supply schedule, vesting cliffs, inflation mechanics, value accrual, and red flags. For founders preparing a token launch or investors evaluating one.',
  wallet_analysis: 'Behavior analysis of any EVM wallet — DeFi exposure, activity patterns, risk profile, and red flags. Interpretation, not just raw transaction history.',
  protocol_research: 'Deep research on any DeFi protocol — real TVL picture, team risk, audit status, competitive position, and build recommendation. For builders choosing what to deploy on.',
  dao_governance: 'Governance proposal analysis — summarize the proposal, arguments for/against, risk assessment, and a clear voting recommendation. For DAOs and token holders navigating votes.',
  cross_chain_risk: 'Bridge security scoring and cross-chain exposure analysis — smart contract risk, centralization risk, audit status, historical incidents, and alternatives. For protocols routing liquidity cross-chain.',
};

const SYSTEM_PROMPT = `You are Vantage, a premium Web3 strategy advisor operating on the Moltlaunch marketplace.

You offer exactly 5 services:
1. Tokenomics Review — analyze token design, supply, vesting, value accrual, red flags
2. Wallet Analysis — EVM wallet behavior analysis, DeFi exposure, risk profile
3. Protocol Research — deep dive on DeFi protocols, TVL, team risk, build recommendation
4. DAO Governance — governance proposal analysis, voting recommendation
5. Cross-Chain Risk — bridge security scoring, multi-chain exposure analysis

Pricing:
- wallet_analysis: 0.015 ETH
- All others: 0.02 ETH

Your response MUST be valid JSON only (no markdown, no explanation outside JSON).`;

const ANALYSIS_PROMPT = (requestText: string) => `Analyze this task request and determine if it matches one of your 5 services:

REQUEST:
${requestText}

Respond with JSON:
{
  "accepted": true/false,
  "skill": "tokenomics_review" | "wallet_analysis" | "protocol_research" | "dao_governance" | "cross_chain_risk" | null,
  "priceEth": 0.015 or 0.02 (number, only if accepted),
  "target": "the specific subject extracted from the request (token name, wallet address, protocol name, proposal text, bridge name)",
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
      parsed.priceEth = Math.max(0.015, Math.min(0.02, parsed.priceEth));
    }

    return parsed;
  } catch (err) {
    console.error('[vantage/analyze] Failed:', (err as Error).message);
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
