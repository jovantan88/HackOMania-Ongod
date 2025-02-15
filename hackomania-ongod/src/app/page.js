"use client"

import * as React from "react"
import { MapPin, Search } from 'lucide-react'
import Map, { Marker } from "react-map-gl"
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

// Mock events data
const events = [
  {
    id: 1,
    name: "Summer Music Festival",
    description: "A weekend of live music and fun",
    location: "Central Park, New York",
    price: 50,
    coordinates: [-73.968285, 40.785091],
  },
  {
    id: 2,
    name: "Tech Conference 2023",
    description: "The latest in technology and innovation",
    location: "Moscone Center, San Francisco",
    price: 299,
    coordinates: [-122.401417, 37.784172],
  },
  {
    id: 3,
    name: "Food & Wine Expo",
    description: "Taste cuisines from around the world",
    location: "Navy Pier, Chicago",
    price: 75,
    coordinates: [-87.601909, 41.891682],
  },
]

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [priceFilter, setPriceFilter] = React.useState("")
  const [viewState, setViewState] = React.useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
  })

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPrice =
      priceFilter === "" || (priceFilter === "under100" && event.price < 100) || (priceFilter === "over100" && event.price >= 100)
    return matchesSearch && matchesPrice
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
        <div className="flex-1">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          >
            {filteredEvents.map((event) => (
              <Marker
                key={event.id}
                longitude={event.coordinates[0]}
                latitude={event.coordinates[1]}
                anchor="bottom"
              >
                <MapPin className="h-6 w-6 text-red-500" />
              </Marker>
            ))}
          </Map>
        </div>
        <div className="w-80 overflow-y-auto border-l p-4">
          <h2 className="mb-4 text-xl font-bold">Events</h2>
          {filteredEvents.map((event) => (
            <div key={event.id} className="mb-4 rounded border p-4 shadow">
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <p className="text-sm text-gray-600">{event.description}</p>
              <p className="text-sm">
                <MapPin className="mr-1 inline-block h-4 w-4" />
                {event.location}
              </p>
              <p className="font-bold">${event.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}