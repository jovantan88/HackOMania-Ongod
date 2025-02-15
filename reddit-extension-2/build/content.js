// Store the events data
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
    // Remove any existing injected event
    const existing = document.getElementById('reddit-event');
    if (existing) {
      existing.remove();
    }
  
    // Create the container
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
          src="https://hack-o-mania-ongod.vercel.app/"
          style="border: none; width: 100%; height: 100%;"
        ></iframe>
      </div>
    `;
  
    // Add CSS
    if (!document.getElementById('reddit-event-styles')) {
      const style = document.createElement('style');
      style.id = 'reddit-event-styles';
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
  
    // Insert the container
    const loader = document.querySelector('shreddit-async-loader[bundlename="navigation_links"]');
    if (loader) {
      loader.insertAdjacentElement('afterend', container);
    }
  }
  
  // Auto-inject on page load
  const subredditMatch = window.location.href.match(/reddit\.com\/r\/([^/]+)/);
  if (subredditMatch) {
    const subreddit = subredditMatch[1](https://medium.com/@5tigerjelly/creating-a-chrome-extension-with-react-and-vite-boilerplate-provided-db3d14473bf6).toLowerCase();
    if (eventsBySubreddit[subreddit]) {
      injectEventContent();
    }
  }
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INJECT_EVENT') {
      injectEventContent();
      sendResponse({ success: true });
    }
  });