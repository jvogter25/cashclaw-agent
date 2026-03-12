import 'dotenv/config';
import { loadOrCreateWallet } from './wallet.js';
import { createAgentPoller } from './inbox.js';
import { postToDiscord } from './discord.js';
import { analyzeTask as vantageAnalyze } from './agents/vantage/analyze.js';
import { executeSkill as vantageExecute } from './agents/vantage/executor.js';
import { analyzeTask as sentinelAnalyze } from './agents/sentinel/analyze.js';
import { executeSkill as sentinelExecute } from './agents/sentinel/executor.js';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

function startAgentLoop(
  agentId: string | undefined,
  agentName: string,
  analyzeTask: typeof vantageAnalyze,
  executeSkill: typeof vantageExecute,
): void {
  if (!agentId) {
    console.warn(`[init] ${agentName}: no AGENT_ID set — skipping (register first)`);
    return;
  }

  const pollInbox = createAgentPoller(agentId, agentName, analyzeTask, executeSkill);

  // Initial poll immediately
  pollInbox().catch(err => console.error(`[${agentName}] Initial poll error:`, err));

  // Then poll every 2 minutes
  setInterval(() => {
    pollInbox().catch(err => console.error(`[${agentName}] Poll error:`, err));
  }, POLL_INTERVAL_MS);

  console.log(`[init] ${agentName} running — polling every ${POLL_INTERVAL_MS / 1000}s`);
}

async function main() {
  console.log('[init] Vantage + Sentinel agents starting up...');

  const wallet = loadOrCreateWallet();
  console.log(`[init] Agent address: ${wallet.address}`);

  const vantageId = process.env.AGENT_ID_VANTAGE;
  const sentinelId = process.env.AGENT_ID_SENTINEL;

  await postToDiscord(
    `🔭 **Vantage** + **Sentinel** agents online\n` +
    `\`\`\`\n` +
    `Address  : ${wallet.address}\n` +
    `Polling  : every 2 minutes\n` +
    `Vantage  : ${vantageId ? `ID ${vantageId}` : 'NOT REGISTERED'}\n` +
    `Sentinel : ${sentinelId ? `ID ${sentinelId}` : 'NOT REGISTERED'}\n` +
    `\`\`\``
  );

  startAgentLoop(vantageId, 'Vantage', vantageAnalyze, vantageExecute);
  startAgentLoop(sentinelId, 'Sentinel', sentinelAnalyze, sentinelExecute);
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
