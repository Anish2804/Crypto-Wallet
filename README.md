# NOVA Wallet 🌌

**NOVA** is a blazing-fast, beautiful, and secure self-custodial multi-chain cryptocurrency wallet designed as a browser extension. It takes inspiration from industry-leading wallets like Phantom but elevates the aesthetic with modern glassmorphism, dynamic animations, and extreme user-friendliness.

![NOVA Wallet Banner](https://via.placeholder.com/1200x600/0f172a/ffffff?text=NOVA+Wallet)

## ✨ Features

- **Multi-Chain Support**: Manage Ethereum (EVM), Solana, and Bitcoin all in one unified interface.
- **Multi-Wallet Architecture**: Create distinct wallets (each with its own 12-word recovery phrase) and switch between them instantly.
- **HD Derivation**: Infinite accounts derived from a single wallet seed (`m/44'/60'/0'/0/i`, `m/44'/501'/i'/0'`, `m/84'/0'/0'/0/i`).
- **Phantom-style UI/UX**: Slide-up drawer for managing and switching between accounts seamlessly. Bottom navigation for immediate access to Swap, Activity, and Tokens.
- **Top-Tier Security**: Mnemonics are encrypted with Web Crypto API (`AES-GCM`) before ever hitting `chrome.storage.local`. Decrypted keys live strictly in `session` storage and memory, ensuring they're wiped on browser lock.
- **Beautiful Aesthetic**: Fluid animations, rich dark-mode colors, gradients, and custom scrollbars to WOW your users.
- **dApp Connection**: Seamlessly connects to web3 websites with a built-in transaction approval pop-up.

## 🚀 Quick Start (For Interviewers & Testers)

Since this is an unpacked extension, you can install and test it in 10 seconds:

1. **Clone this repository** (or download the ZIP and extract it).
2. Open your terminal and run the following commands to install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Open Google Chrome (or Brave/Edge) and navigate to `chrome://extensions`.
4. Enable **Developer Mode** using the toggle in the top right corner.
5. Click **"Load unpacked"** and select the `dist` folder located inside the `extension` directory.
6. **Done!** Pin NOVA to your extension bar and click it to get started.

## 🛠 Tech Stack

- **React 18**: Component-based UI architecture.
- **Vite**: Next-generation frontend tooling for ultra-fast builds.
- **Tailwind CSS**: Utility-first CSS for the stunning UI, custom gradients, and glassmorphism.
- **TypeScript**: End-to-end type safety.
- **ethers.js / viem**: For EVM interactions and mnemonic generation.
- **@solana/web3.js**: For native Solana blockchain support.
- **@scure/btc-signer / bip32**: For Bitcoin SegWit interactions.
- **Chrome Extension API (Manifest V3)**: The backbone of the background service worker, storage, and message passing.

## 📸 Screenshots

| Dashboard | Drawer (Multi-Wallet) |
| :---: | :---: |
| ![Dashboard](https://via.placeholder.com/300x500/0f172a/ffffff?text=Dashboard) | ![Drawer](https://via.placeholder.com/300x500/0f172a/ffffff?text=Wallet+Switching) |

## 🏗 Architecture

NOVA operates completely locally. Your private keys never leave your device.
- `background.ts`: The central nervous system. Manages state, listens to dApp requests, handles auto-locking, and executes transactions.
- `vault.ts`: Handles secure encryption/decryption, wallet addition, removal, and Hierarchical Deterministic (HD) derivations.
- `crypto.ts`: Wraps `window.crypto.subtle` for fast, native AES-GCM encryption.

## 📜 License

MIT License. Do whatever you want with it! 🚀
