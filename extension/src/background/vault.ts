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
  accounts: {
    solana: string[];
    evm: string[];
    btc: string[];
  };
  connectedSites: string[];
}

class VaultManager {
  private mnemonic: string | null = null;
  private isLocked: boolean = true;
  private hasVault: boolean = false;
  private initPromise: Promise<void>;
  
  // Cache generated public keys
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

      const session = await chrome.storage.session.get(['mnemonic']);
      if (session.mnemonic) {
        this.mnemonic = session.mnemonic as string;
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
      const encrypted = await encryptData(mnemonic, password);
      await chrome.storage.local.set({ vault: encrypted });
      await chrome.storage.session.set({ mnemonic });
      
      this.mnemonic = mnemonic;
      this.isLocked = false;
      this.hasVault = true;
      
      this.deriveAccounts();
      return true;
    } catch (e) {
      console.error("Vault creation failed", e);
      return false;
    }
  }

  async unlock(password: string): Promise<boolean> {
    try {
      const data = await chrome.storage.local.get(['vault']);
      if (!data.vault) return false;

      const vault = data.vault as { encrypted: string, iv: string, salt: string };
      const mnemonic = await decryptData(vault.encrypted, vault.iv, vault.salt, password);
      
      await chrome.storage.session.set({ mnemonic });
      this.mnemonic = mnemonic;
      this.isLocked = false;
      
      this.deriveAccounts();
      return true;
    } catch (e) {
      console.error("Unlock failed", e);
      return false;
    }
  }

  async lock() {
    await chrome.storage.session.remove(['mnemonic']);
    this.mnemonic = null;
    this.isLocked = true;
    this.accounts = { solana: [], evm: [], btc: [] };
  }

  private deriveAccounts() {
    if (!this.mnemonic) return;

    // EVM derivation (m/44'/60'/0'/0/0)
    const evmAccount = mnemonicToAccount(this.mnemonic, { accountIndex: 0 });
    this.accounts.evm = [evmAccount.address];

    // Solana derivation (m/44'/501'/0'/0')
    const seed = mnemonicToSeedSync(this.mnemonic);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const solKeyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedSeed));
    const solAccount = Keypair.fromSecretKey(solKeyPair.secretKey);
    this.accounts.solana = [solAccount.publicKey.toBase58()];

    // BTC Native SegWit derivation (m/84'/0'/0'/0/0)
    const hdKey = HDKey.fromMasterSeed(seed);
    const btcChild = hdKey.derive("m/84'/0'/0'/0/0");
    const p2wpkh = btc.p2wpkh(btcChild.publicKey!);
    this.accounts.btc = [p2wpkh.address!];
  }

  getEvmAccount() {
    if (!this.mnemonic || this.isLocked) throw new Error("Vault is locked");
    return mnemonicToAccount(this.mnemonic, { accountIndex: 0 });
  }

  getSolanaKeypair() {
    if (!this.mnemonic || this.isLocked) throw new Error("Vault is locked");
    const seed = mnemonicToSeedSync(this.mnemonic);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const solKeyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedSeed));
    return Keypair.fromSecretKey(solKeyPair.secretKey);
  }

  getBtcKey() {
    if (!this.mnemonic || this.isLocked) throw new Error("Vault is locked");
    const seed = mnemonicToSeedSync(this.mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    return hdKey.derive("m/84'/0'/0'/0/0");
  }
}

export const vault = new VaultManager();
