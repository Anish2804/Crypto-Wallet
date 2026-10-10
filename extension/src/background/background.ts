import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;
(globalThis as any).window = globalThis;
import { vault } from './vault';
import { getEvmBalance, getSolanaBalance, getBtcBalance, getActivity, sendEvmTransaction, sendSolanaTransaction, sendRawEvmTransaction } from './networks';

console.log("NOVA Background Service Worker starting...");

chrome.runtime.onInstalled.addListener(() => {
  console.log("NOVA Wallet Extension installed");
});

// Message listener for content scripts and popup
const AUTO_LOCK_MINUTES = 15;

export function resetAutoLock() {
  chrome.alarms.create("auto-lock", { delayInMinutes: AUTO_LOCK_MINUTES });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "auto-lock") {
    await vault.lock();
  }
});

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  (async () => {
  const state = await vault.getState();
  if (!state.isLocked) {
    resetAutoLock();
  }

  console.log("Received message:", message);
  
  if (message.type === "PING") {
    sendResponse({ type: "PONG" });
  } 
  else if (message.type === "GET_STATE") {
    sendResponse(await vault.getState());
  }
  else if (message.type === "GENERATE_MNEMONIC") {
    sendResponse(vault.generatePhrase());
  }
  else if (message.type === "CREATE_VAULT") {
    const success = await vault.createVault(message.payload.mnemonic, message.payload.password);
    sendResponse({ success, state: await vault.getState() });
    return;
  }
  else if (message.type === "UNLOCK_VAULT") {
    const success = await vault.unlock(message.payload.password);
    sendResponse({ success, state: await vault.getState() });
    return;
  }
  else if (message.type === "GET_BALANCES") {
    const state = await vault.getState();
    if (state.isLocked) {
      sendResponse({ success: false, balances: null });
      return;
    }

    (async () => {
      try {
        const evmAddress = state.accounts.evm[0];
        const solAddress = state.accounts.solana[0];
        const btcAddress = state.accounts.btc?.[0];
        
        const balances = {
          eth: evmAddress ? await getEvmBalance(evmAddress, 'ethereum') : "0",
          polygon: evmAddress ? await getEvmBalance(evmAddress, 'polygon') : "0",
          base: evmAddress ? await getEvmBalance(evmAddress, 'base') : "0",
          solana: solAddress ? await getSolanaBalance(solAddress) : "0",
          btc: btcAddress ? await getBtcBalance(btcAddress) : "0"
        };
        sendResponse({ success: true, balances });
      } catch (e) {
        console.error(e);
        sendResponse({ success: false, balances: null });
      }
    })();
    return;
  }
  else if (message.type === "GET_ACTIVITY") {
    const state = await vault.getState();
    if (state.isLocked) {
      sendResponse({ success: false, activity: [] });
      return;
    }
    (async () => {
      try {
        const solAddress = state.accounts.solana[0];
        const btcAddress = state.accounts.btc?.[0];
        const activity = await getActivity(solAddress, btcAddress);
        sendResponse({ success: true, activity });
      } catch (e) {
        console.error(e);
        sendResponse({ success: false, activity: [] });
      }
    })();
    return;
  }
  else if (message.type === "SEND_TRANSACTION") {
    const state = await vault.getState();
    if (state.isLocked) {
      sendResponse({ success: false, error: "Vault is locked" });
      return;
    }
    
    (async () => {
      try {
        const { chain, to, amount } = message.payload;
        let hash = "";

        if (chain === 'solana') {
          const signer = vault.getSolanaKeypair();
          hash = await sendSolanaTransaction(signer, to, amount);
        } else if (chain === 'bitcoin') {
          throw new Error("Bitcoin transactions require UTXO tracking and are not fully implemented.");
        } else {
          const account = vault.getEvmAccount();
          hash = await sendEvmTransaction(account, to, amount, chain);
        }

        sendResponse({ success: true, hash });
      } catch (e: any) {
        console.error("Send transaction error", e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return;
  }
  else if (message.type === "GET_SWAP_QUOTE") {
    const { sellToken, buyToken, amount } = message.payload;
    // Mock math: 1 ETH = 2800 USDC
    let quote = "0";
    if (sellToken === 'ETH' && buyToken === 'USDC') {
      quote = (Number(amount) * 2800).toFixed(2);
    } else if (sellToken === 'USDC' && buyToken === 'ETH') {
      quote = (Number(amount) / 2800).toFixed(5);
    } else {
      quote = (Number(amount)).toFixed(2); // 1:1 fallback
    }

    // Simulate network delay
    setTimeout(() => {
      sendResponse({ quote });
    }, 800);

    return; // keep channel open
  }
  else if (message.type === "LOCK_VAULT") {
    await vault.lock();
    sendResponse({ success: true, state: await vault.getState() });
    return;
  }
  else if (message.type === "PROVIDER_REQUEST") {
    const state = await vault.getState();
    const payload = message.payload;
    const method = payload.method;
    
    // Auto-reject if locked
    if (state.isLocked || !state.hasVault) {
      sendResponse({ error: "Wallet is locked" });
      return;
    }

    const evmAddress = state.accounts.evm[0];

    if (method === 'eth_requestAccounts') {
      const origin = _sender.tab?.url ? new URL(_sender.tab.url).origin : "Unknown App";
      
      if (state.connectedSites?.includes(origin)) {
        sendResponse({ result: [evmAddress] });
        return;
      }

      // Store the callback
      const reqId = Date.now().toString();
      (globalThis as any).pendingApprovals = (globalThis as any).pendingApprovals || new Map();
      (globalThis as any).pendingApprovals.set(reqId, {
        sendResponse,
        origin,
        address: evmAddress
      });

      // Open popup
      chrome.windows.create({
        url: `index.html#/approve?id=${reqId}`,
        type: 'popup',
        width: 360,
        height: 600,
        focused: true
      });
      return; // Keep message channel open
    } 
    else if (method === 'eth_sendTransaction') {
      const txParams = payload.params[0];
      const origin = _sender.tab?.url ? new URL(_sender.tab.url).origin : "Unknown App";
      const reqId = Date.now().toString();
      (globalThis as any).pendingApprovals = (globalThis as any).pendingApprovals || new Map();
      (globalThis as any).pendingApprovals.set(reqId, {
        type: 'tx',
        sendResponse,
        origin,
        txParams
      });

      chrome.windows.create({
        url: `index.html#/signtx?id=${reqId}`,
        type: 'popup',
        width: 360,
        height: 600,
        focused: true
      });
      return;
    } 
    else if (method === 'eth_accounts') {
      sendResponse({ result: [evmAddress] });
      return;
    }
    else if (method === 'eth_chainId') {
      // 1 = Mainnet
      sendResponse({ result: "0x1" });
      return;
    }
    else {
      sendResponse({ error: "Method not supported in this demo" });
      return;
    }
  }
  else if (message.type === "GET_APPROVAL_DATA") {
    const approvals = (globalThis as any).pendingApprovals;
    if (approvals && approvals.has(message.id)) {
      sendResponse({ success: true, data: approvals.get(message.id) });
    } else {
      sendResponse({ success: false, error: "Not found" });
    }
    return;
  }
  else if (message.type === "RESOLVE_APPROVAL") {
    const approvals = (globalThis as any).pendingApprovals;
    if (approvals && approvals.has(message.id)) {
      const { sendResponse: storedSendResponse, address, origin } = approvals.get(message.id);
      
      if (message.approved) {
        if (origin && origin !== "Unknown App") {
          await vault.addConnectedSite(origin);
        }
        storedSendResponse({ result: [address] });
      } else {
        storedSendResponse({ error: "User rejected the request" });
      }
      
      approvals.delete(message.id);
      sendResponse({ success: true });
    }
    return;
  }
  else if (message.type === "RESOLVE_TX") {
    const approvals = (globalThis as any).pendingApprovals;
    if (approvals && approvals.has(message.id)) {
      const data = approvals.get(message.id);
      const { sendResponse: storedSendResponse, txParams } = data;
      
      if (message.approved) {
        (async () => {
          try {
            const account = vault.getEvmAccount();
            // In a real wallet, you'd determine chain from the provider's current chain state.
            // For MVP, we assume Ethereum mainnet.
            const hash = await sendRawEvmTransaction(account, txParams, 'ethereum');
            storedSendResponse({ result: hash });
            sendResponse({ success: true, hash });
          } catch (e: any) {
            console.error("Tx error", e);
            storedSendResponse({ error: e.message });
            sendResponse({ success: false, error: e.message });
          }
        })();
        approvals.delete(message.id);
        return; // async resolution
      } else {
        storedSendResponse({ error: "User rejected the transaction" });
        sendResponse({ success: true });
        approvals.delete(message.id);
      }
    } else {
      sendResponse({ success: false, error: "Not found" });
    }
    return;
  }
  
  })();
  return true;
});
