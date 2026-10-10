# NOVA Wallet 🌌

**NOVA Wallet** is a premium, self-custodial browser extension wallet built for the Solana and Ethereum (EVM) ecosystems. Designed with a focus on high-end UI/UX, uncompromising security, and real-time blockchain analytics.

## ✨ Features

- **True Self-Custody**: Your keys, your crypto. Mnemonic phrases are securely encrypted locally using AES-GCM and never touch a centralized server.
- **Multi-Chain Support**: Seamlessly manage assets across both Solana (Mainnet) and Ethereum (EVM) networks from a single interface.
- **Premium UI/UX**: A dark-mode, Phantom-inspired design with floating island cards, smooth CSS animations, bespoke scrollbars, and tactile feedback.
- **Live Market Data**: Real-time pricing and 24h portfolio performance metrics powered by the CoinGecko API.
- **Integrated Fiat On-Ramp**: Purchase Solana instantly with fiat (INR/UPI) directly inside the wallet via the Onramp.money integration.
- **Session Security**: In-memory state management ensuring your wallet locks securely when the session ends.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS (v4)
- **Blockchain**: `@solana/web3.js`, `ethers.js`
- **Cryptography**: Standard Web Crypto API (`AES-GCM`, `PBKDF2`) for vault encryption.
- **Build Tool**: Vite, producing a highly optimized Manifest V3 Chrome Extension.

## 🚀 How to Install & Test (Developer Mode)

Since this extension is actively in development and not yet published to the Chrome Web Store, you can install it directly from the source code in seconds:

1. **Download the Release**: Download the `nova-wallet.zip` from the [Releases](#) section of this repository and extract it to a folder. *(Alternatively, clone this repo, run `npm install`, and `npm run build` in the `extension` folder to generate the `dist` folder)*.
2. **Open Extensions**: Open Google Chrome and navigate to `chrome://extensions/` in your URL bar.
3. **Enable Developer Mode**: Toggle the **Developer mode** switch in the top right corner.
4. **Load Unpacked**: Click the **Load unpacked** button in the top left and select the `dist` folder you just extracted or built.
5. **Pin & Launch**: Pin the NOVA Wallet to your toolbar and click to open!

## 📸 Screenshots

*(Add screenshots of your Dashboard, Onboarding, and Swap screens here)*

---
*Built as a showcase of modern web3 extension architecture and premium frontend design.*
