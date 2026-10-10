# NOVA Wallet Architecture

## Overview
NOVA is a production-grade, self-custodial browser extension wallet supporting multiple blockchains (Solana, EVM). The architecture is divided into three primary tiers:
1. **Frontend Extension**: The client-facing popup, onboarding views, and content scripts.
2. **Web3 Adapters**: Chain-specific SDK integrations.
3. **Backend Service**: An optional centralized API for indexing, fiat rails, and non-sensitive metadata.

## 1. Browser Extension Architecture (Manifest V3)
- **Popup/UI**: Built with React, TypeScript, Vite, and Tailwind CSS. Acts as the presentation layer. It communicates with the Background Service Worker via message passing.
- **Background Service Worker**: The core coordinator. It maintains the encrypted vault in memory (when unlocked), handles network requests to RPCs, interacts with the backend, and listens to dApp connection requests.
- **Content Scripts**: Injected into web pages to expose `window.nova` and `window.ethereum` or `window.solana`. Acts as a secure bridge, intercepting dApp calls and forwarding them to the Background Service Worker.
- **In-Page Provider**: A tiny script injected by the content script into the DOM to provide the EIP-1193 and Solana Wallet Standard compatible API to dApps.

## 2. Key Management & Vault
- **Storage**: The recovery phrase and private keys are encrypted locally using AES-GCM-256. The encryption key is derived from the user's password using PBKDF2 or Argon2.
- **State**: The encrypted vault is stored in `chrome.storage.local`. The decrypted keys only live in memory within the Background Service Worker and are never serialized or sent to the UI.
- **Inactivity Lock**: The wallet locks automatically after a configurable period of inactivity, purging keys from memory.

## 3. Blockchain Adapters
- **Solana**: Uses `@solana/web3.js` for transaction construction, signing, and RPC communication.
- **EVM**: Uses `viem` for interactions with Ethereum, Polygon, Base, etc.
- **Abstraction Layer**: A common `NetworkProvider` interface standardizes methods for fetching balances, getting token metadata, and submitting transactions.

## 4. Backend Service (Node.js)
The backend does *not* touch private keys. Its responsibilities include:
- **Fiat Integrations**: Secure webhooks for Onmeta, Transak, etc.
- **Transaction Indexing**: Caching transaction histories from indexing services (e.g., Alchemy, Helius) to improve performance.
- **Token Metadata**: A curated and validated list of tokens and their icons to prevent spoofing.
- **Security**: Rate limiting, API authentication, and payload validation.

## 5. Security & Verification
- **Don't Trust, Verify**: All RPC responses and backend payloads are validated against expected schemas (e.g., using Zod).
- **Transaction Simulation**: Before signing, transactions are simulated (where supported) to show accurate state changes and fee estimates to the user.
- **Strict Messaging**: All messages between content scripts, the UI, and the background worker are strictly typed and validated to prevent injection attacks.
