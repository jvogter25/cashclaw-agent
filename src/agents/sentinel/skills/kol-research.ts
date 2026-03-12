import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runKolResearch(target: string): Promise<string> {
  console.log(`[kol-research] Researching KOLs for: ${target}`);

  const [kolData, nichData] = await Promise.all([
    braveSearch(`${target} crypto KOL influencer Twitter YouTube 2024 2025`),
    braveSearch(`${target} crypto community Discord Telegram builders`),
  ]);

  const prompt = `You are a Web3 growth analyst specializing in influencer and KOL strategy. Research and identify the most relevant KOLs for the following project.

PROJECT/NICHE: ${target}

KOL & INFLUENCER DATA:
${kolData || 'No specific data retrieved.'}

COMMUNITY DATA:
${nichData || 'No community data retrieved.'}

Produce a structured KOL research report in markdown:

# KOL Research Report: ${target}

## Target Audience Profile
Who are the ideal users/buyers of this project? What do they follow? Where do they spend time?

## Tier 1 KOLs (Macro — 100K+ followers)
For each relevant macro KOL:
- **Name / Handle**
- Platform(s) and approximate reach
- Content focus and relevance score (HIGH/MEDIUM/LOW)
- Estimated engagement rate
- Known rate or "contact via" if public
- Red flags (paid posts that underperform, rug promotions, etc.)

## Tier 2 KOLs (Mid — 10K–100K followers)
Same format. These often deliver better ROI per dollar.

## Tier 3 KOLs (Nano — 1K–10K, high engagement)
Builders, developers, DAO members who influence technical decisions.

## On-Chain KOL Signals
Notable wallets that follow this niche (large holders, protocol contributors, DAO voters).

## Platform Strategy
- Twitter/X: key hashtags, spaces hosts, engagement pods relevant to this niche
- YouTube: relevant channels
- Telegram/Discord: key communities

## Outreach Recommendations
3-5 specific, actionable recommendations for engaging these KOLs:
1. Cold DM template framework
2. Value-first approach (co-marketing, research sharing, etc.)
3. Budget allocation guidance

## Red Flags to Avoid
Known bad actors, pumpers, or low-quality influencers in this niche.

---
*Sentinel KOL Research — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
