import {
  fetchInbox,
  submitQuote,
  declineTask,
  getTaskStatus,
  submitDeliverable,
  claimPayment,
  type MoltTask,
} from './moltlaunch.js';
import {
  postToDiscord,
  taskAcceptedMsg,
  taskDeclinedMsg,
  escrowConfirmedMsg,
  deliverableSubmittedMsg,
  paymentClaimedMsg,
  errorMsg,
} from './discord.js';

export interface TaskAnalysis {
  accepted: boolean;
  skill: string | null;
  priceEth: number;
  quoteMessage: string;
  declineReason?: string;
  target: string;
}

interface PendingEscrow {
  taskId: string;
  skill: string;
  target: string;
  priceEth: number;
  quotedAt: number;
}

interface SubmittedTask {
  submittedAt: number;
  priceEth: number;
}

/** Create an isolated poll loop for one agent. Call the returned function on an interval. */
export function createAgentPoller(
  agentId: string,
  agentName: string,
  analyzeTask: (text: string) => Promise<TaskAnalysis>,
  executeSkill: (skill: string, target: string) => Promise<string>,
) {
  const processedTaskIds = new Set<string>();
  const pendingEscrow = new Map<string, PendingEscrow>();
  const submittedTasks = new Map<string, SubmittedTask>();

  async function handleNewTask(task: MoltTask): Promise<void> {
    console.log(`[${agentName}] New task ${task.id}: "${task.task.slice(0, 80)}"`);
    const analysis = await analyzeTask(task.task);

    if (!analysis.accepted || !analysis.skill) {
      await declineTask(task.id, analysis.declineReason ?? 'Skill not available.');
      await postToDiscord(taskDeclinedMsg(agentName, task.id, analysis.declineReason ?? 'Skill not available.'));
      return;
    }

    const quoted = await submitQuote(task.id, analysis.priceEth, analysis.quoteMessage);
    if (!quoted) {
      console.error(`[${agentName}] Failed to quote task ${task.id}`);
      return;
    }

    await postToDiscord(taskAcceptedMsg(agentName, task.id, analysis.skill, analysis.priceEth, analysis.target));
    pendingEscrow.set(task.id, {
      taskId: task.id,
      skill: analysis.skill,
      target: analysis.target,
      priceEth: analysis.priceEth,
      quotedAt: Date.now(),
    });
  }

  async function checkEscrowAndExecute(taskId: string, pending: PendingEscrow): Promise<void> {
    const status = await getTaskStatus(taskId);

    if (status !== 'accepted') {
      const ageMs = Date.now() - pending.quotedAt;
      if (ageMs > 48 * 60 * 60 * 1000) {
        console.log(`[${agentName}] Task ${taskId} quote expired`);
        pendingEscrow.delete(taskId);
      }
      return;
    }

    pendingEscrow.delete(taskId);
    await postToDiscord(escrowConfirmedMsg(agentName, taskId));
    console.log(`[${agentName}] Task ${taskId} accepted — executing skill=${pending.skill}`);

    try {
      const deliverable = await executeSkill(pending.skill, pending.target);
      const submitted = await submitDeliverable(taskId, deliverable);
      if (submitted) {
        await postToDiscord(deliverableSubmittedMsg(agentName, taskId));
        submittedTasks.set(taskId, { submittedAt: Date.now(), priceEth: pending.priceEth });
      } else {
        await postToDiscord(errorMsg(agentName, `submit task ${taskId}`, 'submitDeliverable returned false'));
      }
    } catch (err) {
      await postToDiscord(errorMsg(agentName, `execute task ${taskId}`, (err as Error).message));
    }
  }

  async function attemptClaimPayment(taskId: string, priceEth: number): Promise<void> {
    console.log(`[${agentName}] Claiming payment for task ${taskId}`);
    const claimed = await claimPayment(taskId);
    if (claimed) {
      await postToDiscord(paymentClaimedMsg(agentName, taskId, priceEth));
    } else {
      await postToDiscord(errorMsg(agentName, `claim payment ${taskId}`, 'claimPayment returned false'));
    }
  }

  return async function pollInbox(): Promise<void> {
    console.log(`[${agentName}] Polling Moltlaunch inbox...`);

    const tasks = await fetchInbox(agentId);
    for (const task of tasks) {
      if (processedTaskIds.has(task.id)) continue;
      processedTaskIds.add(task.id);
      await handleNewTask(task).catch(err =>
        postToDiscord(errorMsg(agentName, 'handleNewTask', (err as Error).message))
      );
    }

    for (const [taskId, pending] of pendingEscrow.entries()) {
      await checkEscrowAndExecute(taskId, pending).catch(err =>
        postToDiscord(errorMsg(agentName, 'checkEscrow', (err as Error).message))
      );
    }

    const now = Date.now();
    const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;
    for (const [taskId, sub] of submittedTasks.entries()) {
      if (now - sub.submittedAt >= CLAIM_WINDOW_MS) {
        await attemptClaimPayment(taskId, sub.priceEth);
        submittedTasks.delete(taskId);
      }
    }

    console.log(`[${agentName}] Done. Pending escrow: ${pendingEscrow.size}, Awaiting claim: ${submittedTasks.size}`);
  };
}
