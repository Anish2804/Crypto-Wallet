import { useState, useEffect } from 'react';

export interface WalletState {
  isLocked: boolean;
  hasVault: boolean;
  wallets: { id: string, name: string, evmAddress?: string }[];
  activeWalletId: string | null;
  accounts: {
    solana: string[];
    evm: string[];
    btc: string[];
  };
}

export function useWalletState() {
  const [state, setState] = useState<WalletState>({
    isLocked: true,
    hasVault: false,
    wallets: [],
    activeWalletId: null,
    accounts: { solana: [], evm: [], btc: [] }
  });

  const fetchState = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
        if (response) setState(response);
      });
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  return { state, fetchState };
}

export function generateMnemonic(): Promise<string[]> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GENERATE_MNEMONIC" }, (response) => {
        resolve(response);
      });
    } else {
      resolve("test abandon ability able about above absent absorb abstract absurd abuse access accident".split(" "));
    }
  });
}

export function createVault(mnemonic: string[], password: string): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "CREATE_VAULT", payload: { mnemonic, password } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: true });
    }
  });
}

export function unlockVault(password: string): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "UNLOCK_VAULT", payload: { password } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: true });
    }
  });
}

export function getBalances(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_BALANCES" }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: true, balances: { eth: "0", polygon: "0", base: "0", solana: "0", btc: "0" } });
    }
  });
}

export function fetchActivity(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_ACTIVITY" }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: true, activity: [] });
    }
  });
}

export function sendTransaction(chain: string, to: string, amount: string): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "SEND_TRANSACTION", payload: { chain, to, amount } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: true, hash: "0xMockHash..." });
    }
  });
}

export function getSwapQuote(sellToken: string, buyToken: string, amount: string): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_SWAP_QUOTE", payload: { sellToken, buyToken, amount } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ quote: "0.00" });
    }
  });
}

export function addAccount(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "ADD_ACCOUNT" }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: false });
    }
  });
}

export function addWallet(mnemonic: string[]): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "ADD_WALLET", payload: { mnemonic } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: false });
    }
  });
}

export function switchWallet(id: string): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "SWITCH_WALLET", payload: { id } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: false });
    }
  });
}

export function deleteWallet(id: string): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "DELETE_WALLET", payload: { id } }, (response) => {
        resolve(response);
      });
    } else {
      resolve({ success: false });
    }
  });
}
