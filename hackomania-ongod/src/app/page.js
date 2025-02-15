"use client"

import * as React from "react"
import { MapPin, Search, Calendar } from 'lucide-react' // Added Calendar icon
import Map, { Marker } from "react-map-gl/mapbox";
import { Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css"
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { getAllEvents } from "@/actions/actions"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [priceFilter, setPriceFilter] = React.useState("")
  const [dateRange, setDateRange] = React.useState([{
      startDate: new Date(), 
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      key: 'selection'
  }])
  const [showCalendar, setShowCalendar] = React.useState(false) // New state for toggling calendar
  const [viewState, setViewState] = React.useState({
    longitude: 103.8198,
    latitude: 1.3521,
    zoom: 11.5,
  })
  const [events, setEvents] = React.useState([])
  const [selectedEvent, setSelectedEvent] = React.useState(null)
  const [selectedDetail, setSelectedDetail] = React.useState(null)

  React.useEffect(() => {
    async function fetchEvents() {
      const result = await getAllEvents()
      console.log("getAllEvents result:", result)
      if(result.success && result.events) {
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
        }))
        setEvents(transformed)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    if (!event) return false; // Skip null events
    const matchesSearch = (event.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice =
      priceFilter === "" ||
      priceFilter === "all" || // Added "all" condition
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

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All prices</SelectItem>
              <SelectItem value="under100">Under $100</SelectItem>
              <SelectItem value="over100">$100 and above</SelectItem>
            </SelectContent>
          </Select>
          {/* Removed date input fields */}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Add Existing Event</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Existing Event</SheetTitle>
              <SheetDescription>
                This action adds an existing event to the dashboard.
              </SheetDescription>
            </SheetHeader>
            {/* Add form fields here for adding an existing event */}
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex flex-1 relative">
        <div className="w-1/3 overflow-y-auto border-l p-4">
          <h2 className="mb-4 text-xl font-bold">Events</h2>
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="mb-4 cursor-pointer rounded border p-4 shadow hover:bg-gray-100"
              onClick={() => setSelectedDetail(event)}
            >
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <p className="text-sm">
                <MapPin className="mr-1 inline-block h-4 w-4" />
                {event.location}
              </p>
              {/* Added date display for each event */}
              <p className="text-xs text-gray-500">Date: {event.date}</p>
              <p className="font-bold">${event.price}</p>
            </div>
          ))}
        </div>
        <div className="flex-1">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/kyouran/cm763uly101st01r5ae8r2yun"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          >
            {filteredEvents.map((event) => (
              <Marker
                key={event.id}
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
                    border: "2px solid black" // Added border
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
                  <h3 className="text-md">{selectedEvent.name}</h3>
                </div>
              </Popup>
            )}
          </Map>
          {/* Calendar Button Overlay */}
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
          {/* Conditionally render DateRange overlay */}
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
      <Dialog open={!!selectedDetail} onOpenChange={(open) => { if(!open) setSelectedDetail(null) }}>
        <DialogContent className="overflow-y-auto  max-h-[calc(100vh-200px)]">
          <DialogHeader>
            <div className="flex items-center w-full">
              <img
                src={selectedDetail?.image_url}
                alt={selectedDetail?.name}
                className="mr-2 w-8 h-8 rounded-full"
              />
              <DialogTitle className="whitespace-normal break-words">
                {selectedDetail?.name}
              </DialogTitle>
            </div>
            <DialogDescription className="whitespace-normal break-words">
              {selectedDetail?.description}
            </DialogDescription>
            {/* Added datetime display */}
            <p className="text-xs text-gray-500">
              {selectedDetail?.date && `Date: ${selectedDetail.date}`}
            </p>
          </DialogHeader>
          {/* Removed large event image */}
          <p className="mb-2 text-sm flex items-center">
            <MapPin className="mr-1 inline-block h-4 w-4" />
            {selectedDetail?.location}
          </p>
          <p className="font-bold">${selectedDetail?.price}</p>
          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button asChild variant="outline">
                <a href={selectedDetail?.url} target="_blank" rel="noopener noreferrer">Sign up here</a>
              </Button>
              <Button onClick={() => setSelectedDetail(null)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}