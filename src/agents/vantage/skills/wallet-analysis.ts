import { anthropic } from '../../../lib/anthropic.js';

async function fetchWalletTxs(address: string): Promise<string> {
  try {
    const url = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&sort=desc&offset=50&page=1&apikey=YourApiKeyToken`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return '';
    const data = await res.json() as { status: string; result: Array<{ hash: string; to: string; value: string; input: string; timeStamp: string; isError: string }> };
    if (data.status !== '1' || !Array.isArray(data.result)) return '';
    const txs = data.result.slice(0, 30);
    return txs.map(tx => [
      `Hash: ${tx.hash.slice(0, 10)}...`,
      `To: ${tx.to}`,
      `Value: ${(Number(tx.value) / 1e18).toFixed(6)} ETH`,
      `Data: ${tx.input.slice(0, 20)}${tx.input.length > 20 ? '...' : ''}`,
      `Time: ${new Date(Number(tx.timeStamp) * 1000).toISOString().split('T')[0]}`,
      `Error: ${tx.isError}`,
    ].join(' | ')).join('\n');
  } catch {
    return '';
  }
}

export async function runWalletAnalysis(address: string): Promise<string> {
  console.log(`[wallet-analysis] Analyzing wallet: ${address}`);

  const txData = await fetchWalletTxs(address);

  const prompt = `You are a blockchain intelligence analyst. Analyze this EVM wallet and produce a behavior profile.

WALLET ADDRESS: ${address}

RECENT TRANSACTIONS (Base chain):
${txData || 'Transaction data unavailable — provide general analysis framework and note data limitation.'}

Produce a structured wallet analysis in markdown:

# Wallet Analysis: ${address.slice(0, 6)}...${address.slice(-4)}

## Activity Summary
- Estimated wallet age / first activity
- Transaction frequency pattern
- Primary chain(s) of activity
- Overall activity level (whale / active / occasional / dormant)

## DeFi Exposure
- Protocols interacted with (identify by contract addresses where possible)
- Liquidity provision, lending, borrowing, yield farming signals
- Estimated DeFi sophistication level

## Wallet Archetype
Classify this wallet: (e.g., DeFi Farmer, Protocol Builder, Passive Holder, Active Trader, Bot/Automated, Unknown)
1-2 sentences explaining the classification.

## Risk Profile
- Concentration risk (funds in one protocol?)
- Interaction with known risky/unaudited protocols
- Unusual patterns worth noting

## Red Flags
Bulleted list. If none, say "No significant red flags identified."

## Notable Patterns
Any interesting behaviors, timing patterns, or strategic observations.

---
*Vantage Wallet Analysis — ${new Date().toISOString().split('T')[0]}*`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  return (msg.content[0] as { type: 'text'; text: string }).text.trim();
}
