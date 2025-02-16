import { useEffect, useState } from 'react';
import supabase from './config/supabase';
import { MapPin, Calendar, Sun, Moon } from 'lucide-react';
import './App.css';

function App() {
  const [subreddit, setSubreddit] = useState('');
  const [events, setEvents] = useState([]);
  const [tabId, setTabId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.url) {
        const url = tabs[0].url;
        const match = url.match(/reddit\.com\/r\/([^/]+)/);
        if (match && match[1]) {
          const subredditName = match[1];
          setSubreddit(subredditName);
          await fetchEventsForSubreddit(subredditName);
          recordRequest(subredditName);
        }
        setTabId(tabs[0].id);
      }
    });
  }, []);

  async function fetchEventsForSubreddit(subredditName) {
    const { data: subredditData, error: subredditError } = await supabase
      .from('subreddits')
      .select('id')
      .eq('name', subredditName)
      .single();

    if (subredditError || !subredditData) {
      console.error('Error fetching subreddit id:', subredditError);
      return;
    }
    const subredditId = subredditData.id;
    console.log('subredditId' + subredditId);

    const { data: categoryData, error: categoryError } = await supabase
      .from('subreddit_categories')
      .select('category_id')
      .eq('subreddit_id', subredditId)
      .single();

    if (categoryError || !categoryData) {
      console.error('Error fetching category id:', categoryError);
      return;
    }
    const categoryId = categoryData.category_id;
    console.log('meowmeow' + categoryId);

    const { data: categoryEventsData, error: categoryEventsError } = await supabase
      .from('category_events')
      .select('event_url')
      .eq('category_id', categoryId);

    if (categoryEventsError || !categoryEventsData || categoryEventsData.length === 0) {
      console.error('Error fetching event URLs:', categoryEventsError);
      return;
    }

    const eventUrls = categoryEventsData.map(item => item.event_url);
    console.log('eventUrls', eventUrls);

    const { data: eventDetailsData, error: eventDetailsError } = await supabase
      .from('events')
      .select('datetime, address, name, url')
      .in('url', eventUrls);

    if (eventDetailsError || !eventDetailsData || eventDetailsData.length === 0) {
      console.error('Error fetching event details:', eventDetailsError);
      return;
    }

    console.log('event details:', eventDetailsData);
    setEvents(eventDetailsData);
  }


  async function recordRequest(subredditName) {
    const { data: subredditData, error: subredditError } = await supabase
      .from('subreddits')
      .select('id')
      .eq('name', subredditName)
      .single();

    if (subredditError || !subredditData) {
      console.error('Error fetching subreddit id:', subredditError);
      return;
    }

    const subredditId = subredditData.id;

    try {
      const res = await fetch('https://ipapi.co/json/');
      const ipInfo = await res.json();
      const ipAddress = ipInfo.ip;
      const userLocation = ipInfo.city;

      const sgTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
      );

      const { data: insertData, error: insertError } = await supabase
        .from('requests')
        .insert([
          {
            ip_address: ipAddress,
            subreddit_id: subredditId,
            user_location: userLocation,
            created_at: sgTime.toISOString(),
          },
        ]);

      if (insertError) {
        console.error('Error inserting request:', insertError);
      } else {
        console.log('Request recorded:', insertData);
      }
    } catch (err) {
      console.error('Error fetching IP information:', err);
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark');
  };

  async function handleEventClick(event) {
    if (!event.url) {
      console.error('No event_url found for this event');
      return;
    }
    chrome.tabs.create({ url: event.url }, () =>
      console.log('Opened event in new tab:', event.url)
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
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
                  <p>
                    <strong>Date:</strong> {ev.datetime}
                  </p>
                  <p>
                    <strong>Location:</strong> {ev.address}
                  </p>
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
