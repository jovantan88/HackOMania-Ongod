"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerEvent } from "../actions/actions"
import { LinkIcon } from "lucide-react"

export default function RegisterEventForm() {
  const [eventLink, setEventLink] = useState("")
  const [state, formAction] = useActionState(registerEvent, null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (eventLink) {
      formAction(new FormData(e.currentTarget))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="eventLink" className="text-lg">
          Event link
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="url"
            id="eventLink"
            name="eventLink"
            value={eventLink}
            onChange={(e) => setEventLink(e.target.value)}
            placeholder="https://www.eventbrite.com/e/your-event"
            required
            className="pl-10"
          />
        </div>
      </div>
      <Button type="submit" disabled={!eventLink} className="w-full bg-purple-600 hover:bg-purple-700">
        Submit event
      </Button>
      {state && (
        <Alert variant={state.success ? "default" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}

