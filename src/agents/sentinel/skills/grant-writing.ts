import { anthropic } from '../../../lib/anthropic.js';
import { braveSearch } from '../../../lib/brave.js';

export async function runGrantWriting(target: string): Promise<string> {
  console.log(`[grant-writing] Writing grant for: ${target}`);

  const grantProgram = target.split(' ')[0];
  const grantData = await braveSearch(`${grantProgram} grant program requirements criteria 2024 2025`);

  const prompt = `You are an expert grant writer specializing in Web3 ecosystem grants. Write a compelling grant application for the following.

PROJECT / GRANT CONTEXT:
${target}

GRANT PROGRAM DATA:
${grantData || 'No specific program data retrieved — write based on best practices for Web3 grants.'}

Produce a full grant application in markdown:

# Grant Application: ${grantProgram} Ecosystem Grant

## Project Overview
**Project Name:** [Extract from context or use placeholder]
**Team:** [Extract from context or use placeholder]
**Requested Amount:** [Extract from context or suggest appropriate range]
**Category:** [Protocol / Developer Tooling / Consumer App / Education / Other]

## Executive Summary
3-4 sentences that immediately answer: What are you building? Why does it matter? Why should this ecosystem fund it?

## Problem Statement
What problem exists in the ecosystem today? Quantify if possible. Why hasn't it been solved?

## Solution
How does your project solve this problem? What's the core technical approach?

## Why This Ecosystem?
Specific reasons this project belongs on [grant program's chain/ecosystem]:
- Technical fit
- Existing user base / integration opportunities
- Alignment with ecosystem roadmap

## Impact Metrics
How will you measure success? Include:
- Number of users/developers reached
- TVL or transaction volume targets (if applicable)
- Developer adoption metrics
- Timeline for achieving milestones

## Milestones & Budget Breakdown

| Milestone | Deliverable | Timeline | Budget |
|---|---|---|---|
| M1 | ... | Month 1-2 | $X |
| M2 | ... | Month 3-4 | $X |
| M3 | ... | Month 5-6 | $X |

## Team Background
[Framework for team section — adjust with actual details]

## Prior Work / Traction
Existing progress, pilots, user feedback, or related projects.

## Long-term Vision
Where does this go after the grant? Sustainability plan?

---
*Sentinel Grant Writing — ${new Date().toISOString().split('T')[0]}*
*Note: Customize all [placeholder] sections with your specific project details before submitting.*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
