import { mnemonicToSeedSync } from 'bip39';
import { encryptData, decryptData } from './crypto';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import { english, generateMnemonic as generateMnemonicViem, mnemonicToAccount } from 'viem/accounts';
import { HDKey } from '@scure/bip32';
import * as btc from '@scure/btc-signer';

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
  connectedSites: string[];
}

export interface WalletData {
  id: string;
  name: string;
  mnemonic: string;
  accountCount: number;
}

export interface VaultData {
  wallets: WalletData[];
  activeWalletId: string;
}

class VaultManager {
  private isLocked: boolean = true;
  private hasVault: boolean = false;
  private initPromise: Promise<void>;
  
  private vaultData: VaultData | null = null;
  private sessionPassword: string | null = null;
  
  private accounts = {
    solana: [] as string[],
    evm: [] as string[],
    btc: [] as string[]
  };
  public connectedSites: string[] = [];

  constructor() {
    this.initPromise = this.restoreSession();
  }

  private async restoreSession() {
    try {
      const data = await chrome.storage.local.get(['vault', 'connectedSites']);
      this.hasVault = !!data.vault;
      if (data.connectedSites) {
        this.connectedSites = data.connectedSites as string[];
      }

      const session = await chrome.storage.session.get(['vaultData', 'sessionPassword']);
      if (session.vaultData && session.sessionPassword) {
        this.vaultData = session.vaultData as VaultData;
        this.sessionPassword = session.sessionPassword as string;
        this.isLocked = false;
        this.deriveAccounts();
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    }
  }

  async getState(): Promise<WalletState> {
    await this.initPromise;
    return {
      isLocked: this.isLocked,
      hasVault: this.hasVault,
      wallets: this.vaultData?.wallets.map(w => ({ 
        id: w.id, 
        name: w.name, 
        evmAddress: mnemonicToAccount(w.mnemonic, { accountIndex: 0 }).address 
      })) || [],
      activeWalletId: this.vaultData?.activeWalletId || null,
      accounts: this.accounts,
      connectedSites: this.connectedSites
    };
  }

  async addConnectedSite(origin: string) {
    if (!this.connectedSites.includes(origin)) {
      this.connectedSites.push(origin);
      await chrome.storage.local.set({ connectedSites: this.connectedSites });
    }
  }

  generatePhrase(): string[] {
    return generateMnemonicViem(english).split(" ");
  }

  async createVault(mnemonicArray: string[], password: string): Promise<boolean> {
    const mnemonic = mnemonicArray.join(" ");
    try {
      const vaultData: VaultData = {
        wallets: [{ id: "1", name: "Wallet 1", mnemonic, accountCount: 1 }],
        activeWalletId: "1"
      };
      const encrypted = await encryptData(JSON.stringify(vaultData), password);
      
      await chrome.storage.local.set({ vault: encrypted });
      await chrome.storage.session.set({ vaultData, sessionPassword: password });
      
      this.vaultData = vaultData;
      this.sessionPassword = password;
      this.isLocked = false;
      this.hasVault = true;
      
      this.deriveAccounts();
      return true;
    } catch (e) {
      console.error("Vault creation failed", e);
      return false;
    }
  }

  private async saveVaultData() {
    if (!this.vaultData || !this.sessionPassword) return;
    const encrypted = await encryptData(JSON.stringify(this.vaultData), this.sessionPassword);
    await chrome.storage.local.set({ vault: encrypted });
    await chrome.storage.session.set({ vaultData: this.vaultData });
  }

  async unlock(password: string): Promise<boolean> {
    try {
      const data = await chrome.storage.local.get(['vault', 'accountCount']);
      if (!data.vault) return false;
      
      const vault = data.vault as { encrypted: string, iv: string, salt: string };
      const decrypted = await decryptData(vault.encrypted, vault.iv, vault.salt, password);
      
      let vaultData: VaultData;
      try {
        vaultData = JSON.parse(decrypted);
      } catch (e) {
        // Migration from old plain-string mnemonic format
        vaultData = {
          wallets: [{ id: "1", name: "Wallet 1", mnemonic: decrypted, accountCount: (data.accountCount as number) || 1 }],
          activeWalletId: "1"
        };
        // Re-encrypt in new format
        const reEncrypted = await encryptData(JSON.stringify(vaultData), password);
        await chrome.storage.local.set({ vault: reEncrypted });
      }
      
      await chrome.storage.session.set({ vaultData, sessionPassword: password });
      this.vaultData = vaultData;
      this.sessionPassword = password;
      this.isLocked = false;
      
      this.deriveAccounts();
      return true;
    } catch (e) {
      console.error("Unlock failed", e);
      return false;
    }
  }

  async lock() {
    await chrome.storage.session.remove(['vaultData', 'sessionPassword']);
    this.vaultData = null;
    this.sessionPassword = null;
    this.isLocked = true;
    this.accounts = { solana: [], evm: [], btc: [] };
  }

  async addAccount(): Promise<boolean> {
    if (this.isLocked || !this.vaultData) return false;
    const activeWallet = this.vaultData.wallets.find(w => w.id === this.vaultData!.activeWalletId);
    if (!activeWallet) return false;
    
    activeWallet.accountCount += 1;
    await this.saveVaultData();
    this.deriveAccounts();
    return true;
  }
  
  async addWallet(mnemonicArray: string[]): Promise<boolean> {
    if (this.isLocked || !this.vaultData) return false;
    const mnemonic = mnemonicArray.join(" ");
    const newId = Date.now().toString();
    const newName = `Wallet ${this.vaultData.wallets.length + 1}`;
    
    this.vaultData.wallets.push({
      id: newId,
      name: newName,
      mnemonic,
      accountCount: 1
    });
    this.vaultData.activeWalletId = newId;
    
    await this.saveVaultData();
    this.deriveAccounts();
    return true;
  }
  
  async switchWallet(id: string): Promise<boolean> {
    if (this.isLocked || !this.vaultData) return false;
    if (!this.vaultData.wallets.find(w => w.id === id)) return false;
    
    this.vaultData.activeWalletId = id;
    await this.saveVaultData();
    this.deriveAccounts();
    return true;
  }
  
  async deleteWallet(id: string): Promise<boolean> {
    if (this.isLocked || !this.vaultData) return false;
    if (this.vaultData.wallets.length <= 1) return false; // Can't delete last wallet
    
    this.vaultData.wallets = this.vaultData.wallets.filter(w => w.id !== id);
    if (this.vaultData.activeWalletId === id) {
      this.vaultData.activeWalletId = this.vaultData.wallets[0].id;
    }
    
    await this.saveVaultData();
    this.deriveAccounts();
    return true;
  }

  private deriveAccounts() {
    if (!this.vaultData) return;
    const activeWallet = this.vaultData.wallets.find(w => w.id === this.vaultData!.activeWalletId);
    if (!activeWallet) return;
    
    const seed = mnemonicToSeedSync(activeWallet.mnemonic);
    
    this.accounts.solana = [];
    this.accounts.evm = [];
    this.accounts.btc = [];
    
    for (let i = 0; i < activeWallet.accountCount; i++) {
      // EVM (m/44'/60'/0'/0/i)
      const evmAccount = mnemonicToAccount(activeWallet.mnemonic, { accountIndex: i });
      this.accounts.evm.push(evmAccount.address);

      // Solana (m/44'/501'/i'/0')
      const solanaPath = `m/44'/501'/${i}'/0'`;
      const derivedSeed = derivePath(solanaPath, seed.toString('hex')).key;
      const solKeyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedSeed));
      const solAccount = Keypair.fromSecretKey(solKeyPair.secretKey);
      this.accounts.solana.push(solAccount.publicKey.toBase58());
      
      // BTC Native Segwit (m/84'/0'/0'/0/i)
      const hdKey = HDKey.fromMasterSeed(seed);
      const child = hdKey.derive(`m/84'/0'/0'/0/${i}`);
      const pubkey = child.publicKey;
      if (pubkey) {
        const { address } = btc.p2wpkh(pubkey);
        if (address) this.accounts.btc.push(address);
      }
    }
  }

  getEvmAccount(index = 0) {
    if (!this.vaultData) throw new Error("Vault is locked");
    const activeWallet = this.vaultData.wallets.find(w => w.id === this.vaultData!.activeWalletId);
    if (!activeWallet) throw new Error("No active wallet");
    return mnemonicToAccount(activeWallet.mnemonic, { accountIndex: index });
  }

  getSolanaKeypair(index = 0): Keypair {
    if (!this.vaultData) throw new Error("Vault is locked");
    const activeWallet = this.vaultData.wallets.find(w => w.id === this.vaultData!.activeWalletId);
    if (!activeWallet) throw new Error("No active wallet");
    const seed = mnemonicToSeedSync(activeWallet.mnemonic);
    const solanaPath = `m/44'/501'/${index}'/0'`;
    const derivedSeed = derivePath(solanaPath, seed.toString('hex')).key;
    const solKeyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedSeed));
    return Keypair.fromSecretKey(solKeyPair.secretKey);
  }
}

export const vault = new VaultManager();
