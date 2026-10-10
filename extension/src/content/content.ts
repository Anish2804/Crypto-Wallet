console.log("NOVA Content Script injected.");

// Inject the provider script into the webpage DOM
const injectScript = () => {
  try {
    const container = document.head || document.documentElement;
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/content/inpage.js");
    container.insertBefore(script, container.children[0]);
    script.onload = function() {
      script.remove();
    };
  } catch (error) {
    console.error('NOVA Provider injection failed', error);
  }
};

injectScript();

// Relay messages between window and background worker
window.addEventListener("message", (event: MessageEvent) => {
    // We only accept messages from ourselves
    if (event.source !== window) return;

    if (event.data && event.data.target === "NOVA_EXT") {
        // console.log("Content script received request:", event.data);
        chrome.runtime.sendMessage({ type: "PROVIDER_REQUEST", payload: event.data }, (response: any) => {
            window.postMessage({ target: "NOVA_PAGE", id: event.data.id, response }, "*");
        });
    }
}, false);
