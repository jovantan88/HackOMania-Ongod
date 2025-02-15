import { useEffect, useState } from 'react';
import { supabase } from './config/supabase'
import { MapPin, Calendar, Sun, Moon } from 'lucide-react';
import './App.css';

const eventsBySubreddit = {
  reactjs: [
    { name: 'React Meetup', date: '2025-11-01', location: 'New York', attendees: 120 },
    { name: 'Hooks Workshop', date: '2025-12-05', location: 'San Francisco', attendees: 80 }
  ],
  warthunder: [
    { name: 'JS Conference', date: '2025-10-20', location: 'Los Angeles', attendees: 200 },
    { name: 'ECMAScript Meetup', date: '2025-11-15', location: 'Chicago', attendees: 50 }
  ],
  gaming: [
    { name: 'Gaming Expo', date: '2025-12-10', location: 'Las Vegas', attendees: 300 }
  ]
};

function App() {
  const [subreddit, setSubreddit] = useState('');
  const [events, setEvents] = useState([]);
  const [tabId, setTabId] = useState();
  const [darkMode, setDarkMode] = useState(false);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark');
  };

  const handleEventClick = (event) => {
    if (tabId === null) {
      console.warn('Tab ID not available');
      return;
    }

    function injectEventContent(eventDetails) {
      const existing = document.getElementById('reddit-event');
      if (existing) {
        existing.remove();
      }

      const container = document.createElement('div');
      container.id = 'reddit-event';
      container.style.border = '1px solid #ccc';
      container.style.borderRadius = '12px';
      container.style.padding = '16px';
      container.style.margin = '10px 0';
      container.style.backgroundColor = '#fff';
      container.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';

      container.innerHTML = `
        <div class="iframe-container">
          <iframe 
            src="https://hack-o-mania-ongod.vercel.app/" 
            style="border: none; width: 100%; height: 100%;"
          ></iframe>
        </div>
      `;

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

      const loader = document.querySelector('shreddit-async-loader[bundlename="navigation_links"]');
      if (loader) {
        loader.insertAdjacentElement('afterend', container);
      } else {
        console.warn('shreddit-async-loader element not found');
      }
    }

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
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <a
          href="https://hack-o-mania-ongod.vercel.app/register-event"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="add-event-btn">Add Event</button>
        </a>
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

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