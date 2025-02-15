"use client"

import * as React from "react"
import { MapPin, Search } from 'lucide-react'
import Map, { Marker } from "react-map-gl/mapbox";
import { Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css"

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
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [viewState, setViewState] = React.useState({
    longitude: 103.8198,
    latitude: 1.3521,
    zoom: 11.5,
  })
  const [events, setEvents] = React.useState([])
  const [selectedEvent, setSelectedEvent] = React.useState(null) // New state for popup
  const [selectedDetail, setSelectedDetail] = React.useState(null) // New state for modal

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
          date: event.date  // new field for event date (expects YYYY-MM-DD)
        }))
        setEvents(transformed)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPrice =
      priceFilter === "" || (priceFilter === "under100" && event.price < 100) || (priceFilter === "over100" && event.price >= 100)
    const eventDate = event.date ? new Date(event.date) : null
    const matchesDate =
      (!startDate || (eventDate && eventDate >= new Date(startDate))) &&
      (!endDate || (eventDate && eventDate <= new Date(endDate)))
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
          {/* New date inputs */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            className="w-[150px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
            className="w-[150px]"
          />
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
      <div className="flex flex-1">
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