"use client";
import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerEvent } from "../actions/actions";
import { LinkIcon, Loader2 } from "lucide-react";

export default function RegisterEventForm() {
  const [eventLink, setEventLink] = useState("");
  const [state, formAction] = useActionState(registerEvent, null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (eventLink) {
      setIsSubmitting(true); // Start the submission process
      try {
        await formAction(new FormData(e.currentTarget)); // Perform the form action
      } catch (error) {
        console.error("Error during form submission:", error);
      } finally {
        setIsSubmitting(false); // Ensure the loader stops even if there's an error
      }
    }
  };

  return (
    <>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 relative">
        {/* Event Link Input */}
        <div className="space-y-2">
          <Label htmlFor="eventLink" className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Event Link
          </Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-100" />
            <Input
              type="url"
              id="eventLink"
              name="eventLink"
              value={eventLink}
              onChange={(e) => setEventLink(e.target.value)}
              placeholder="https://www.eventbrite.com/e/your-event"
              required
              className="pl-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!eventLink || isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-400 dark:to-pink-600 dark:hover:from-indigo-300 dark:hover:via-purple-500 dark:hover:to-pink-700 transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Event"
          )}
        </Button>

        {/* Feedback Alert */}
        {state && (
          <Alert variant={state.success ? "default" : "destructive"}>
            <AlertDescription className="text-sm">{state.message}</AlertDescription>
          </Alert>
        )}
      </form>

      {/* Loader Overlay */}
      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ pointerEvents: "auto" }} // Ensure the overlay captures pointer events
        >
          <div className="flex items-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="text-white text-lg">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}