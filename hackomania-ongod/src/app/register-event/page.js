"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Moon, Sun } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegisterEventForm from "@/components/register-event-form"
import { Button } from "@/components/ui/button"

export default function RegisterEventPage() {
  const [darkMode, setDarkMode] = React.useState(false)

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="relative flex min-h-screen flex-col bg-white transition-colors duration-300 dark:bg-stone-950">
        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to map
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Moon className="h-5 w-5 text-yellow-400" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
          </Button>
        </header>

        <main className="flex-grow">
          <section className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-24 text-white dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
            <div className="container mx-auto px-6 text-center">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                Honorable mention · HackOMania 2025
              </p>
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
                Add an event
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-stone-100 md:text-xl">
                Paste a public{" "}
                <a
                  href="https://www.eventbrite.sg"
                  className="underline decoration-white/50 underline-offset-4 hover:text-white"
                >
                  Eventbrite
                </a>{" "}
                or{" "}
                <a
                  href="https://lu.ma"
                  className="underline decoration-white/50 underline-offset-4 hover:text-white"
                >
                  Luma
                </a>{" "}
                link. Gemini fills in the title, time, venue, and price.
              </p>
            </div>
          </section>

          <section className="relative z-10 container mx-auto -mt-12 mb-16 px-4">
            <Card className="mx-auto max-w-3xl border dark:border-stone-700 dark:bg-stone-900 dark:text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  Submit a public event
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RegisterEventForm />
              </CardContent>
            </Card>
          </section>
        </main>

        <footer className="pb-8 text-center text-xs text-stone-500 dark:text-stone-400">
          Built in 24 hours at HackOMania 2025 by Team Ongod
        </footer>
      </div>
    </div>
  )
}
