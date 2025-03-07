"use client"

import * as React from "react"
import { MapPin, Search, Calendar, Sun, Moon, Github, Plus } from 'lucide-react'
import Map, { Marker } from "react-map-gl/mapbox";
import { Popup, FlyToInterpolator } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css"
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { supabase } from "@/lib/supabase/supabaseClient";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getAllEvents, getSubredditEvents, trackEventClick, getAllEventClickCounts } from "@/actions/actions"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import EventDialog from "@/components/EventDialog";

export default function Dashboard() {
  // Add URL parameter check and set default zoom value
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : "");
  const defaultZoom = urlParams.get('subreddit') ? 9.8 : 11.5;
  const hideGithubLogin = urlParams.get('subreddit') !== null; // new constant

  const [searchTerm, setSearchTerm] = React.useState("")
  const [priceFilter, setPriceFilter] = React.useState("")
  const [dateRange, setDateRange] = React.useState([{
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    key: 'selection'
  }])
  const [showCalendar, setShowCalendar] = React.useState(false)
  const mapRef = React.useRef(null);
  const [viewState, setViewState] = React.useState({
    longitude: 103.8198,
    latitude: 1.3521,
    zoom: defaultZoom, // updated zoom value
  })
  const [events, setEvents] = React.useState([])
  const [selectedEvent, setSelectedEvent] = React.useState(null)
  const [selectedDetail, setSelectedDetail] = React.useState(null)
  const [session, setSession] = React.useState(null);
  const [darkMode, setDarkMode] = React.useState(false)
  // New state for click counts mapping: { event_url: [username, ...] }
  const [eventClicks, setEventClicks] = React.useState({});
  // New state for user's network (friends objects with login and avatar_url)
  const [userNetwork, setUserNetwork] = React.useState([]);

  const mapStyle = darkMode
    ? "mapbox://styles/kyouran/cm76pavwu00kq01qv61yu5iid"
    : "mapbox://styles/kyouran/cm763uly101st01r5ae8r2yun"

  // Function to handle hover on event card
  const handleEventHover = (event) => {
    if (!mapRef.current) return;

    mapRef.current.getMap().flyTo({
      center: event.coordinates,
      zoom: 13,
      duration: 800,
      essential: true
    });

    setSelectedEvent(event);
  };

  // Function to handle mouse leave
  const handleEventLeave = () => {
    if (!mapRef.current) return;

    mapRef.current.getMap().flyTo({
      center: [103.8198, 1.3521],
      zoom: defaultZoom,
      duration: 800,
      essential: true
    });

    setSelectedEvent(null);
  };

  const loginWithGitHub = () => {
    if (!session) {
      supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/api/auth/callback`,
        },
      });
    }
  };

  React.useEffect(() => {
    async function fetchSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }
    fetchSession();
    async function fetchEvents() {
      const result = await getAllEvents()
      console.log("getAllEvents result:", result)
      if (result.success && result.events) {
        const transformed = result.events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.short_description,
          location: event.address,
          price: parseFloat(event.price),
          coordinates: [event.lon, event.lat],
          image_url: event.image_url,
          url: event.url,
          date: event.datetime
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
        setEvents(transformed)
      }
    }
    async function fetchSubredditEvents(subreddit) {
      const result = await getSubredditEvents(subreddit)
      console.log("getSubredditEvents result:", result)
      if (result.success && result.events) {
        const transformed = result.events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.short_description,
          location: event.address,
          price: parseFloat(event.price),
          coordinates: [event.lon, event.lat],
          image_url: event.image_url,
          url: event.url,
          date: event.datetime
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
        setEvents(transformed)
      }
    }
    // check for subreddit query param
    const urlParams = new URLSearchParams(window.location.search)
    const subreddit = urlParams.get('subreddit')
    if (subreddit) {
      fetchSubredditEvents(subreddit)
    } else {
      fetchEvents()
    }
    // Fetch all event click counts
    async function fetchClickCounts() {
      const clicks = await getAllEventClickCounts();
      setEventClicks(clicks);
    }
    fetchClickCounts()
  }, [])

  // New: Fetch user's GitHub network if logged in with GitHub
  React.useEffect(() => {
    async function fetchUserNetwork() {
      if (session && session.user?.app_metadata?.provider === 'github') {
        const username = session.user.user_metadata.user_name || session.user.user_metadata.login;
        const [followersRes, followingRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}/followers`).then(res => res.json()),
          fetch(`https://api.github.com/users/${username}/following`).then(res => res.json())
        ]);
        // Merge followers and following, deduplicating based on login
        const combined = [...followersRes, ...followingRes];
        const uniqueFriends = combined.reduce((acc, friend) => {
          if (!acc.find(f => f.login === friend.login)) {
            acc.push({ login: friend.login, avatar_url: friend.avatar_url });
          }
          return acc;
        }, []);
        setUserNetwork(uniqueFriends);
      }
    }
    fetchUserNetwork();
  }, [session]);

  const filteredEvents = events.filter((event) => {
    if (!event) return false;
    const matchesSearch = (event.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice =
      priceFilter === "" ||
      priceFilter === "all" ||
      (priceFilter === "free" && event.price == 0) ||
      (priceFilter === "under100" && event.price < 100) ||
      (priceFilter === "over100" && event.price >= 100)
    const eventDate = event.date ? new Date(event.date) : null
    const start = dateRange[0].startDate;
    const end = dateRange[0].endDate;
    const matchesDate =
      (!start || (eventDate && eventDate >= start)) &&
      (!end || (eventDate && eventDate <= end))
    return matchesSearch && matchesPrice && matchesDate
  })

  // Helper to compute network click count
  const computeNetworkClicks = (eventUrl) => {
    if (!userNetwork.length || !eventClicks[eventUrl]) return 0;
    return eventClicks[eventUrl].filter(username =>
      userNetwork.some(friend => friend.login === username)
    ).length;
  };

  const handleEventClick = async (eventUrl) => {
    if (session?.user?.user_metadata?.user_name) {
      await trackEventClick(eventUrl, session.user.user_metadata.user_name);
    } else {
      await trackEventClick(eventUrl, null);
    }
    window.open(eventUrl, '_blank');
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen flex-col relative bg-white dark:bg-gray-900 text-black dark:text-white">
        <div className="absolute top-0 right-0 m-4 z-20 flex items-center space-x-2">
          {/* Conditionally render GitHub login */}
          {!hideGithubLogin && (
            session ? (
              <Button variant="outline" disabled>Logged in</Button>
            ) : (
              <Button onClick={loginWithGitHub} variant="outline">
                Sign up with <Github className="w-4 h-4 inline-block" />
              </Button>
            )
          )}
          <Button variant="outline" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-1 relative">
          <div className="w-1/2 max-w-[500px] h-screen overflow-y-scroll border-l custom-scrollbar">
            <h2 className="text-xl font-bold p-4">Events</h2>
            {filteredEvents.map((event, index) => (
              <div
                key={`event-list-${event.id}-${index}`}
                className="cursor-pointer rounded border-b py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={() => setSelectedDetail(event)}
                onMouseEnter={() => handleEventHover(event)}
                onMouseLeave={handleEventLeave}
              >
                <div className="flex flex-row items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <p className="text-sm">
                      <MapPin className="mr-1 inline-block h-4 w-4" />
                      {event.location}
                    </p>
                    {/* New: display click counts */}
                    <div className="text-xs text-gray-500">
                      Clicks: {eventClicks[event.url] ? eventClicks[event.url].length : 0}{" "}
                      {session && <span> | Network clicks: {computeNetworkClicks(event.url)}</span>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 float-start text-bottom">{new Date(event.date).toDateString()}</p>
                      <p className="text-xs font-bold float-end">{event.price === 0 ? "Free" : `$${event.price}`}</p>
                    </div>
                  </div>
                  <img
                    src={event.image_url}
                    width={150}
                    height={80}
                    alt="Picture of the author"
                    className="rounded"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 relative">
            <div className="p-4 absolute top-0 left-0 w-full z-10 flex flex-row gap-2">
              {/* <Input
                type="search"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px] text-xl"
              /> */}
              <div className="flex items-center space-x-2">
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All prices</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="under100">Under $100</SelectItem>
                    <SelectItem value="over100">$100 and above</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <a href={`/register-event`}>
                <Button><Plus className="w-4 h-4 mr-1" /> event</Button>
              </a>
            </div>
            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle={mapStyle}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            >
              {filteredEvents.map((event, index) => (
                <Marker
                  key={`marker-${event.id}-${index}`}
                  longitude={event.coordinates[0]}
                  latitude={event.coordinates[1]}
                  anchor="bottom"
                >
                  <img
                    src={event.image_url}
                    alt={event.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      border: "2px solid black",
                      transform: selectedEvent?.id === event.id ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.3s ease-in-out"
                    }}
                    onClick={() => setSelectedEvent(event)}
                  />
                </Marker>
              ))}
              {selectedEvent && (
                <Popup
                  longitude={selectedEvent.coordinates[0]}
                  latitude={selectedEvent.coordinates[1]}
                  closeOnClick={false}
                  onClose={() => setSelectedEvent(null)}
                  anchor="top"
                >
                  <div style={{ maxWidth: "200px" }}>
                    <h3 className="text-md" style={{ color: 'black' }}>{selectedEvent.name}</h3>
                  </div>
                </Popup>
              )}
            </Map>
            <div style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              zIndex: 10
            }}>
              <Button onClick={() => setShowCalendar(prev => !prev)} variant="outline">
                <Calendar className="w-5 h-5" />
              </Button>
            </div>
            {showCalendar && (
              <div style={{
                position: "absolute",
                bottom: "70px",
                right: "20px",
                background: "white",
                padding: "10px",
                borderRadius: "5px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 10
              }}>
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                />
                <div className="mt-2 flex justify-end">
                  <Button onClick={() => setShowCalendar(false)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <EventDialog
          event={selectedDetail}
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onEventClick={handleEventClick}
          session={session}
          githubFriends={userNetwork}
          eventClicks={eventClicks}
        />
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #e5e7eb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #888;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #2d2d2d;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #444;
        }
      `}</style>
    </div>
  )
}