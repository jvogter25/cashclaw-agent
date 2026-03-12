/**
 * Discord notifications for Vantage/Sentinel agents.
 * Posts status updates to the configured DISCORD_ENGINEERING_WEBHOOK.
 */

const WEBHOOK_URL = process.env.DISCORD_ENGINEERING_WEBHOOK ?? '';

export async function postToDiscord(message: string): Promise<void> {
  if (!WEBHOOK_URL) {
    console.log('[discord] No DISCORD_ENGINEERING_WEBHOOK set — skipping notification');
    return;
  }

  const chunks: string[] = [];
  let remaining = message;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 1900));
    remaining = remaining.slice(1900);
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: chunk }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        console.error(`[discord] Webhook failed: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error('[discord] Webhook error:', (err as Error).message);
    }
  }
}

export function taskAcceptedMsg(agentName: string, taskId: string, skill: string, priceEth: number, target: string): string {
  return `🤖 **${agentName}** | Task accepted\n\`\`\`\nTask ID : ${taskId}\nSkill   : ${skill.replace(/_/g, ' ')}\nTarget  : ${target}\nPrice   : ${priceEth} ETH\n\`\`\``;
}

export function taskDeclinedMsg(agentName: string, taskId: string, reason: string): string {
  return `🤖 **${agentName}** | Task declined\n\`\`\`\nTask ID : ${taskId}\nReason  : ${reason}\n\`\`\``;
}

export function escrowConfirmedMsg(agentName: string, taskId: string): string {
  return `💰 **${agentName}** | Escrow confirmed — starting work\n\`Task ID: ${taskId}\``;
}

export function deliverableSubmittedMsg(agentName: string, taskId: string): string {
  return `✅ **${agentName}** | Deliverable submitted\n\`Task ID: ${taskId}\` — awaiting client review (24hr claim window)`;
}

export function paymentClaimedMsg(agentName: string, taskId: string, priceEth: number): string {
  return `💸 **${agentName}** | Payment claimed\n\`Task ID: ${taskId}\` — ${priceEth} ETH collected`;
}

export function errorMsg(agentName: string, context: string, err: string): string {
  return `⚠️ **${agentName}** | Error in ${context}\n\`\`\`\n${err.slice(0, 800)}\n\`\`\``;
}
