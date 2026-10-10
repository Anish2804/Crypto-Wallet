# NOVA Threat Model

## Assets in Scope
1. **User's Private Keys and Mnemonic Phrase**: The most critical asset. Compromise means loss of all funds.
2. **User's Passwords**: Used to derive the encryption key.
3. **Transaction Authorization**: The ability to sign and broadcast transactions.
4. **User Privacy**: Public addresses, balances, and transaction history.
5. **DApp Permissions**: Which sites are allowed to interact with the wallet.

## Threat Actors
1. **Malicious DApps**: Websites attempting to steal funds by tricking the user into signing malicious payloads or transactions.
2. **Malware/Keyloggers**: Local software attempting to extract the encrypted vault, keylog passwords, or modify memory.
3. **Phishing**: Fake websites or emails designed to trick the user into revealing their recovery phrase.
4. **Supply Chain Attackers**: Malicious code introduced via compromised npm dependencies.
5. **Network Attackers**: Attackers intercepting or modifying RPC traffic (Man-in-the-Middle).

## Specific Threats & Mitigations

### 1. Key Extraction from Disk
**Threat**: Attacker gains read access to the local filesystem (e.g., via malware or physical access).
**Mitigation**: The vault is stored encrypted with AES-GCM-256 in `chrome.storage.local`. The encryption key is derived using a strong KDF (Argon2id or PBKDF2 with high iterations). The password is never stored.

### 2. Key Extraction from Memory
**Threat**: Attacker dumps memory of the browser process to find plaintext keys.
**Mitigation**: Plaintext keys only exist in the Background Service Worker's memory while the wallet is unlocked. They are zeroed out or garbage collected when the wallet is locked. An automatic inactivity timer locks the vault.

### 3. XSS in Extension UI
**Threat**: Malicious input in token names, NFT metadata, or transaction history executes arbitrary JavaScript in the popup.
**Mitigation**: Strict Content Security Policy (CSP). Use React's built-in escaping. Sanitize all untrusted metadata. The UI does *not* have access to private keys anyway.

### 4. Malicious DApp Transaction Requests
**Threat**: A DApp requests a transaction that drains the user's wallet.
**Mitigation**: 
- Require explicit user consent for *every* transaction and signature.
- Implement robust Transaction Simulation (showing balance changes).
- Maintain a blocklist of known malicious contracts/domains.
- Display human-readable parsed transaction details rather than opaque hex.

### 5. Extension API Abuse (Content Script Hijacking)
**Threat**: A malicious website interacts with the injected content script to bypass authorization or send forged messages to the background worker.
**Mitigation**: 
- Validate all `window.postMessage` origins.
- The background worker treats all messages from content scripts as untrusted.
- The background worker requires cryptographic proof or user interaction via the popup UI for any state-changing operations.

### 6. Supply Chain Attacks
**Threat**: A compromised dependency includes code to steal keys during the build process or at runtime.
**Mitigation**: 
- Use strict dependency pinning.
- Regularly audit dependencies (e.g., `npm audit`, `Socket.dev`).
- Do not blindly update dependencies.
- Minimize dependencies in the background worker where keys reside.

### 7. Phishing / Fake Wallets
**Threat**: User is tricked into entering their recovery phrase into a website that looks like NOVA.
**Mitigation**: 
- NOVA will never ask for the recovery phrase in a web page (only inside the extension popup/fullscreen view).
- Warn users aggressively before revealing the recovery phrase.
- Implement anti-phishing images/patterns during onboarding.
