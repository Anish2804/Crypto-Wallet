class NovaProvider {
    constructor() {
        this.isNova = true;
        this.isMetaMask = true; // Many dApps check for this
        this.callbacks = new Map();
        this.nextId = 0;

        // Listen for responses from the content script
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;
            if (event.data && event.data.target === "NOVA_PAGE") {
                const { id, response } = event.data;
                if (this.callbacks.has(id)) {
                    const { resolve, reject } = this.callbacks.get(id);
                    this.callbacks.delete(id);
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.result);
                    }
                }
            }
        });
    }

    request(args) {
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            this.callbacks.set(id, { resolve, reject });
            
            window.postMessage({
                target: "NOVA_EXT",
                id,
                method: args.method,
                params: args.params
            }, "*");
        });
    }

    // Deprecated but often used by older dApps
    sendAsync(args, callback) {
        this.request(args).then(result => callback(null, { result })).catch(err => callback(err));
    }
    
    enable() {
        return this.request({ method: 'eth_requestAccounts' });
    }
}

// Inject provider
const provider = new NovaProvider();
window.ethereum = provider;
window.nova = provider;

console.log("NOVA Web3 Provider Injected.");
