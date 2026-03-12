/**
 * Moltlaunch API client.
 * Moltlaunch is an onchain escrow marketplace for AI agent tasks on Base.
 * API base: https://api.moltlaunch.com
 *
 * Auth: EIP-191 personal sign of `moltlaunch:{action}:{taskId}:{timestamp}:{nonce}`
 * AgentId: uint256 from onchain ERC-8004 registration (stored in AGENT_ID env var)
 * Prices: in Wei (1 ETH = 1e18 Wei)
 */

import { randomUUID } from 'node:crypto';
import { privateKeyToAccount } from 'viem/accounts';

const BASE_URL = process.env.MOLTLAUNCH_API_URL ?? 'https://api.moltlaunch.com';

export interface MoltTask {
  id: string;
  agentId: string;
  clientAddress: string;
  requestText: string;
  priceWei: string;
  createdAt: string;
  status: 'requested' | 'quoted' | 'accepted' | 'submitted' | 'completed' | 'declined' | 'cancelled';
}

// --- Auth ---

function buildAuthMessage(action: string, taskId: string, timestamp: number, nonce: string): string {
  return `moltlaunch:${action}:${taskId}:${timestamp}:${nonce}`;
}

async function signAction(action: string, taskId: string): Promise<{ signature: string; timestamp: number; nonce: string }> {
  const privateKey = process.env.MOLTLAUNCH_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) throw new Error('MOLTLAUNCH_PRIVATE_KEY not set');
  const account = privateKeyToAccount(privateKey);
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomUUID();
  const message = buildAuthMessage(action, taskId, timestamp, nonce);
  const signature = await account.signMessage({ message });
  return { signature, timestamp, nonce };
}

// --- HTTP helper ---

async function moltFetch<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(`Moltlaunch ${method} ${path} failed: ${res.status} — ${err.error ?? res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// --- Public API ---

/** Fetch pending tasks from the agent's inbox. Requires AGENT_ID env var. */
export async function fetchInbox(): Promise<MoltTask[]> {
  const agentId = process.env.AGENT_ID;
  if (!agentId) {
    console.error('[moltlaunch] AGENT_ID not set — run registration first');
    return [];
  }
  try {
    const data = await moltFetch<{ tasks: MoltTask[] }>(`/api/tasks/inbox?agent=${encodeURIComponent(agentId)}`);
    return data.tasks ?? [];
  } catch (err) {
    console.error('[moltlaunch] fetchInbox error:', (err as Error).message);
    return [];
  }
}

/** Submit a price quote for a task. priceEth is a float (e.g. 0.005). */
export async function submitQuote(taskId: string, priceEth: number, message: string): Promise<boolean> {
  try {
    const priceWei = BigInt(Math.round(priceEth * 1e18)).toString();
    const auth = await signAction('quote', taskId);
    await moltFetch(`/api/tasks/${taskId}/quote`, 'POST', { priceWei, message, ...auth });
    return true;
  } catch (err) {
    console.error(`[moltlaunch] submitQuote(${taskId}) error:`, (err as Error).message);
    return false;
  }
}

/** Decline a task. */
export async function declineTask(taskId: string, _reason: string): Promise<void> {
  try {
    const auth = await signAction('decline', taskId);
    await moltFetch(`/api/tasks/${taskId}/decline`, 'POST', { ...auth });
  } catch (err) {
    console.error(`[moltlaunch] declineTask(${taskId}) error:`, (err as Error).message);
  }
}

/** Poll task status. Returns 'accepted' once client locks funds. */
export async function getTaskStatus(taskId: string): Promise<MoltTask['status']> {
  try {
    const data = await moltFetch<{ task: MoltTask }>(`/api/tasks/${taskId}`);
    return data.task.status;
  } catch (err) {
    console.error(`[moltlaunch] getTaskStatus(${taskId}) error:`, (err as Error).message);
    return 'requested';
  }
}

/** Submit the completed deliverable. */
export async function submitDeliverable(taskId: string, result: string): Promise<boolean> {
  try {
    const auth = await signAction('submit', taskId);
    await moltFetch(`/api/tasks/${taskId}/submit`, 'POST', { result, files: [], ...auth });
    return true;
  } catch (err) {
    console.error(`[moltlaunch] submitDeliverable(${taskId}) error:`, (err as Error).message);
    return false;
  }
}

/** Complete a task after the dispute window (requires txHash from escrow release). */
export async function claimPayment(taskId: string): Promise<boolean> {
  try {
    const auth = await signAction('complete', taskId);
    await moltFetch(`/api/tasks/${taskId}/complete`, 'POST', { txHash: '0x0', ...auth });
    return true;
  } catch (err) {
    console.error(`[moltlaunch] claimPayment(${taskId}) error:`, (err as Error).message);
    return false;
  }
}
