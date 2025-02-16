function injectEventContent(bbg) {
    const existing = document.getElementById('reddit-event');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'reddit-event';
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.padding = "12px";
    container.style.margin = "10px 0";
    container.style.backgroundColor = "#fff";
    container.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

    container.innerHTML = `
      <div class="iframe-container">
        <iframe
          src="https://hack-o-mania-ongod.vercel.app/?subreddit=${bbg}"
          style="border: none; width: 100%; height: 100%;"
        ></iframe>
        </a>
      </div>
    `;

    if (!document.getElementById('reddit-event-style')) {
        const style = document.createElement('style');
        style.id = 'reddit-event-style';
        style.textContent = `
        .iframe-container {
          position: relative;
          width: 100%;
          height: min(400px, 90vh);
          overflow: hidden;
        }
        .iframe-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `;
        document.head.appendChild(style);
    }

    const loader = document.querySelector('shreddit-async-loader[bundlename="navigation_links"]');
    if (loader) {
        loader.insertAdjacentElement('afterend', container);
    } else {
        document.body.prepend(container);
    }
}

function checkAndInject() {
    const url = window.location.href;
    const match = url.match(/reddit\.com\/r\/([^/]+)/);
    if (match && match[1]) {
        const bbg = match[1];
        const subredditKey = bbg.toLowerCase();

        if (bbg) {
            injectEventContent(bbg);
        } else {
            const existing = document.getElementById('reddit-event');
            if (existing) existing.remove();
        }
    }
}

checkAndInject();

let lastUrl = location.href;
const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(checkAndInject, 1000);
    }
});
observer.observe(document.body, { subtree: true, childList: true });

const originalPushState = history.pushState;
history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(checkAndInject, 1000);
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkAndInject, 1000);
};

window.addEventListener('popstate', () => {
    setTimeout(checkAndInject, 1000);
});
