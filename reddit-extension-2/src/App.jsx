import { useEffect, useState } from 'react';
import "./App.css"

// Predefined fake events dictionary keyed by subreddit name.
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

function App() {
  const [subreddit, setSubreddit] = useState('');
  const [events, setEvents] = useState([]);
  const [tabId, setTabId] = useState()

  // Get the active tab URL and extract the subreddit (if present)
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = tabs[0].url;
        const match = url.match(/reddit\.com\/r\/([^/]+)/);
        if (match && match[1]) {
          setSubreddit(match[1]);
          setEvents(eventsBySubreddit[match[1].toLowerCase()] || []);
        }
        setTabId(tabs[0].id);
      }
    });
  }, []);

  // Function to inject "Hello World" banner into the active tab
  const handleEventClick = (event) => {
    if (tabId === null) {
      console.warn('Tab ID not available');
      return;
    }

    // This function is injected into the page.
    function injectEventContent(eventDetails) {
      // Remove any existing injected event (if any)
      const existing = document.getElementById('reddit-event');
      if (existing) {
        existing.remove();
      }

      // Create the container for our injected Reddit-like post
      const container = document.createElement('div');
      container.id = 'reddit-event';
      container.style.border = "1px solid #ccc";
      container.style.borderRadius = "8px";
      container.style.padding = "12px";
      container.style.margin = "10px 0";
      container.style.backgroundColor = "#fff";
      container.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

      // Create the HTML content for the Reddit post appearance
      container.innerHTML = `
        <div class="iframe-container">
          <iframe 
            src="https://hack-o-mania-ongod.vercel.app/" 
            style="border: none; width: 100%; height: 100%;"
          ></iframe>
        </div>
        `;

      // Add this CSS to your stylesheet
      const style = document.createElement('style');
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

      // Look for the target element; here we're following the original pattern.
      const loader = document.querySelector('shreddit-async-loader[bundlename="navigation_links"]');
      if (loader) {
        loader.insertAdjacentElement('afterend', container);
      } else {
        console.warn('shreddit-async-loader element not found');
      }
    }

    // Execute the script using chrome.scripting.executeScript and pass event details as an argument.
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: injectEventContent,
      args: [event]
    })
      .then(() => console.log('Event content injection successful'))
      .catch((err) => console.error('Failed to inject event content:', err));
  };

  return (
    <div className="app-container">
      <a
        href="https://hack-o-mania-ongod.vercel.app/register-event"
        target="_blank"
        rel="noopener noreferrer"
      >
        <button
          className="mb-3 relative px-6 py-3 bg-blue-200 text-white font-bold text-xl rounded-xl hover:bg-blue-700 transition duration-300 shadow-lg before:absolute before:inset-0 before:bg-gray-800 before:rounded-xl before:z-0"
        >
          <span className="relative z-10">Add Event</span>
        </button>
      </a>
      <h1 className="title">Subreddit Events</h1>
      {subreddit ? (
        <>
          <p className="subreddit-info">
            Current subreddit: <span className="subreddit-name">{subreddit}</span>
          </p>
          {events.length > 0 ? (
            <div className="events-list">
              {events.map((ev, index) => (
                <div
                  key={index}
                  onClick={() => handleEventClick(ev)}
                  className="event-card"
                >
                  <h2 className="event-title">{ev.name}</h2>
                  <p><strong>Date:</strong> {ev.date}</p>
                  <p><strong>Location:</strong> {ev.location}</p>
                  <p><strong>Attendees:</strong> {ev.attendees}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-events">No events for this subreddit.</p>
          )}
        </>
      ) : (
        <p className="not-on-subreddit">Not on a subreddit page</p>
      )}
    </div>
  );
}

export default App;
