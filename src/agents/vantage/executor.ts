import { runTokenomicsReview } from './skills/tokenomics-review.js';
import { runWalletAnalysis } from './skills/wallet-analysis.js';
import { runProtocolResearch } from './skills/protocol-research.js';
import { runDaoGovernance } from './skills/dao-governance.js';
import { runCrossChainRisk } from './skills/cross-chain-risk.js';

export async function executeSkill(skill: string, target: string): Promise<string> {
  console.log(`[vantage/executor] skill=${skill} target=${target.slice(0, 60)}`);

  switch (skill) {
    case 'tokenomics_review':
      return runTokenomicsReview(target);
    case 'wallet_analysis':
      return runWalletAnalysis(target);
    case 'protocol_research':
      return runProtocolResearch(target);
    case 'dao_governance':
      return runDaoGovernance(target);
    case 'cross_chain_risk':
      return runCrossChainRisk(target);
    default:
      throw new Error(`Unknown Vantage skill: ${skill}`);
  }
}
