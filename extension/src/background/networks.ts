import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { mainnet, polygon, base } from 'viem/chains';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import type { Signer } from '@solana/web3.js';
import type { LocalAccount } from 'viem/accounts';

export const evmChains = {
  ethereum: mainnet,
  polygon: polygon,
  base: base,
};

// Define RPC URLs from environment variables, fallback to public defaults
const ETH_RPC = import.meta.env.VITE_ETH_RPC_URL || undefined; // undefined falls back to viem's default public node
const POLYGON_RPC = import.meta.env.VITE_POLYGON_RPC_URL || undefined;
const BASE_RPC = import.meta.env.VITE_BASE_RPC_URL || undefined;
const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const BTC_RPC = import.meta.env.VITE_BTC_RPC_URL || undefined;

// Configure EVM clients with custom HTTP transports if env vars are present
export const evmClients = {
  ethereum: createPublicClient({ chain: mainnet, transport: http(ETH_RPC) }),
  polygon: createPublicClient({ chain: polygon, transport: http(POLYGON_RPC) }),
  base: createPublicClient({ chain: base, transport: http(BASE_RPC) }),
};

export const solanaConnection = new Connection(SOLANA_RPC, "confirmed");

export async function getEvmBalance(address: string, chain: keyof typeof evmClients = 'ethereum') {
  try {
    const client = evmClients[chain];
    const balance = await client.getBalance({ address: address as `0x${string}` });
    return formatEther(balance);
  } catch (e) {
    console.error("EVM balance fetch error", e);
    return "0.0";
  }
}

export async function getSolanaBalance(address: string) {
  try {
    const pubKey = new PublicKey(address);
    const balance = await solanaConnection.getBalance(pubKey);
    return (balance / LAMPORTS_PER_SOL).toString();
  } catch (e) {
    console.error("Solana balance fetch error", e);
    return "0.0";
  }
}

export async function getBtcBalance(address: string) {
  try {
    if (!BTC_RPC) return "0.00";
    
    // Assuming Blockbook API format standard for GetBlock (or Esplora)
    // GetBlock Blockbook format: /api/v2/address/<address>
    const response = await fetch(`${BTC_RPC}/api/v2/address/${address}`);
    if (!response.ok) return "0.00";
    
    const data = await response.json();
    if (data && data.balance) {
      return (Number(data.balance) / 100000000).toString(); // Convert satoshis to BTC
    }
    return "0.00";
  } catch (e) {
    console.error("BTC balance fetch error", e);
    return "0.00";
  }
}

export async function sendEvmTransaction(
  account: LocalAccount, 
  to: string, 
  amountEth: string, 
  chain: keyof typeof evmClients = 'ethereum'
) {
  const walletClient = createWalletClient({
    account,
    chain: evmChains[chain],
    transport: http()
  });

  const hash = await walletClient.sendTransaction({
    to: to as `0x${string}`,
    value: parseEther(amountEth)
  });

  // Optional: wait for receipt
  // const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return hash;
}

export async function sendRawEvmTransaction(
  account: LocalAccount,
  txParams: any,
  chain: keyof typeof evmClients = 'ethereum'
) {
  const walletClient = createWalletClient({
    account,
    chain: evmChains[chain],
    transport: http()
  });

  const tx: any = {
    to: txParams.to as `0x${string}`,
    value: txParams.value ? BigInt(txParams.value) : undefined,
    data: txParams.data as `0x${string}`,
  };
  
  if (txParams.gas) tx.gas = BigInt(txParams.gas);
  if (txParams.gasPrice) tx.gasPrice = BigInt(txParams.gasPrice);

  const hash = await walletClient.sendTransaction(tx);
  return hash;
}

export async function sendSolanaTransaction(
  signer: Signer, 
  to: string, 
  amountSol: string
) {
  const fromPubkey = signer.publicKey;
  const toPubkey = new PublicKey(to);
  
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: parseFloat(amountSol) * LAMPORTS_PER_SOL,
    })
  );

  const hash = await sendAndConfirmTransaction(solanaConnection, tx, [signer]);
  return hash;
}

export async function getActivity(solAddress: string, btcAddress: string) {
  const activities: any[] = [];
  
  // Solana Activity
  try {
    if (solAddress) {
      const pubKey = new PublicKey(solAddress);
      const sigs = await solanaConnection.getSignaturesForAddress(pubKey, { limit: 10 });
      if (sigs.length > 0) {
        const txs = await solanaConnection.getParsedTransactions(sigs.map(s => s.signature), { maxSupportedTransactionVersion: 0 });
        txs.forEach((tx, i) => {
          if (!tx || !tx.meta) return;
          const accountIndex = tx.transaction.message.accountKeys.findIndex(k => k.pubkey.toBase58() === solAddress);
          if (accountIndex !== -1) {
            const pre = tx.meta.preBalances[accountIndex];
            const post = tx.meta.postBalances[accountIndex];
            const diff = post - pre;
            if (Math.abs(diff) > 5000) { // Ignore tiny fee changes
              activities.push({
                id: sigs[i].signature,
                type: diff > 0 ? 'receive' : 'send',
                amount: (Math.abs(diff) / LAMPORTS_PER_SOL).toFixed(4),
                currency: 'SOL',
                timestamp: (tx.blockTime || (Date.now()/1000)) * 1000,
                status: tx.meta.err ? 'Failed' : 'Completed'
              });
            }
          }
        });
      }
    }
  } catch(e) { console.error("Sol activity error", e); }

  // BTC Activity
  try {
    if (btcAddress && BTC_RPC) {
      const response = await fetch(`${BTC_RPC}/api/v2/address/${btcAddress}?details=txs`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.txs) {
          data.txs.slice(0, 10).forEach((tx: any) => {
            let isSender = false;
            let value = 0;
            
            tx.vin?.forEach((vin: any) => {
               if (vin.addresses && vin.addresses.includes(btcAddress)) isSender = true;
            });
            
            if (isSender) {
              tx.vout?.forEach((vout: any) => {
                 if (vout.addresses && !vout.addresses.includes(btcAddress)) value += Number(vout.value || 0);
              });
            } else {
              tx.vout?.forEach((vout: any) => {
                 if (vout.addresses && vout.addresses.includes(btcAddress)) value += Number(vout.value || 0);
              });
            }
            
            if (value > 0) {
              activities.push({
                id: tx.txid,
                type: isSender ? 'send' : 'receive',
                amount: (value / 100000000).toFixed(6),
                currency: 'BTC',
                timestamp: tx.blockTime * 1000,
                status: 'Completed'
              });
            }
          });
        }
      }
    }
  } catch(e) { console.error("BTC activity error", e); }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}
