"use server"

import { z } from "zod"

const eventSchema = z.object({
  eventLink: z
    .string()
    .url()
    .refine((url) => url.includes("eventbrite.com") || url.includes("lu.ma"), {
      message: "Only Eventbrite and Lu.ma links are allowed",
    }),
})

export async function registerEvent(prevState, formData) {
  const eventLink = formData.get("eventLink")

  try {
    const validatedData = eventSchema.parse({ eventLink })

    // Here you would typically save the event link to your database
    // For this example, we'll just simulate a successful registration
    console.log("Event registered:", validatedData.eventLink)

    return {
      success: true,
      message: "Event registered successfully!",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      }
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

