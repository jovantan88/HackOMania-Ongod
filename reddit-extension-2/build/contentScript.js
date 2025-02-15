const eventsBySubreddit = {
    reactjs: [
        { name: "React Meetup", date: "2025-11-01", location: "New York", attendees: 120 },
        { name: "Hooks Workshop", date: "2025-12-05", location: "San Francisco", attendees: 80 }
    ],
    warthunder: [
        { name: "JS Conference", date: "2025-10-20", location: "Los Angeles", attendees: 200 },
        { name: "ECMAScript Meetup", date: "2025-11-15", location: "Chicago", attendees: 50 }
    ],
    gaming: [
        { name: "Gaming Expo", date: "2025-12-10", location: "Las Vegas", attendees: 300 }
    ]
};

function injectEventContent() {
    // Remove existing container if present
    const existing = document.getElementById('reddit-event');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'reddit-event';
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.padding = "12px";
    container.style.margin = "10px 0";
    container.style.backgroundColor = "#fff";
    container.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

    // Insert iframe
    container.innerHTML = `
      <div class="iframe-container">
        <iframe
          src="https://hack-o-mania-ongod.vercel.app/"
          style="border: none; width: 100%; height: 100%;"
        ></iframe>
      </div>
    `;

    // Add styles only once
    if (!document.getElementById('reddit-event-style')) {
        const style = document.createElement('style');
        style.id = 'reddit-event-style';
        style.textContent = `
          .iframe-container {
            position: relative;
            width: 100%;
            height: min(800px, 90vh);
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

    // Try inserting after navigation loader
    const loader = document.querySelector('shreddit-async-loader[bundlename="navigation_links"]');
    if (loader) {
        loader.insertAdjacentElement('afterend', container);
    } else {
        // Fallback to inserting at the top of the body
        document.body.prepend(container);
    }
}

function checkAndInject() {
    const url = window.location.href;
    const match = url.match(/reddit\.com\/r\/([^/]+)/);
    if (match && match[1]) {
        const subreddit = match[1].toLowerCase();
        const events = eventsBySubreddit[subreddit];
        if (events && events.length > 0) {
            injectEventContent();
        } else if (subreddit) {
            injectEventContent();
        } else {
            const existing = document.getElementById('reddit-event');
            if (existing) existing.remove();
        }
    }
}

// Initial call
checkAndInject();

// Improved URL change detection using both MutationObserver and pushState overrides
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(checkAndInject, 1000); // Delay to allow Reddit's dynamic content to load
    }
});
observer.observe(document.body, { subtree: true, childList: true });

// Override history methods to catch URL changes from navigation
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

// Listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
    setTimeout(checkAndInject, 1000);
});
