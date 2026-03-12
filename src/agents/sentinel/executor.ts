import { runRegulatoryIntelligence } from './skills/regulatory-intelligence.js';
import { runGrantWriting } from './skills/grant-writing.js';
import { runKolResearch } from './skills/kol-research.js';
import { runTokenLegalRisk } from './skills/token-legal-risk.js';
import { runEcosystemFit } from './skills/ecosystem-fit.js';

export async function executeSkill(skill: string, target: string): Promise<string> {
  console.log(`[sentinel/executor] skill=${skill} target=${target.slice(0, 60)}`);

  switch (skill) {
    case 'regulatory_intelligence':
      return runRegulatoryIntelligence(target);
    case 'grant_writing':
      return runGrantWriting(target);
    case 'kol_research':
      return runKolResearch(target);
    case 'token_legal_risk':
      return runTokenLegalRisk(target);
    case 'ecosystem_fit':
      return runEcosystemFit(target);
    default:
      throw new Error(`Unknown Sentinel skill: ${skill}`);
  }
}
