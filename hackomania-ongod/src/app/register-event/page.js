"use client"
import * as React from "react"
import { Sun, Moon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegisterEventForm from "@/components/register-event-form"
import { Button } from "@/components/ui/button"

export default function RegisterEventPage() {
  const [darkMode, setDarkMode] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-stone-900 transition-colors duration-300">
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Moon className="w-5 h-5 text-yellow-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
          </Button>
        </div>

        {/* Hero Section */}
        <main className="flex-grow">
          <section
            className={`py-24 ${
              darkMode
                ? "bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white"
                : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
            }`}
          >
            <div className="container mx-auto px-6 text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
                Add an Event
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-stone-200 mx-auto max-w-2xl">
                Share a <a href="https://eventbrite.sg" className="underline text-white hover:text-indigo-200">Eventbrite</a> or <a href="https://lu.ma" className="underline text-white hover:text-indigo-200">Lu.ma</a> event on our platform.
              </p>
            </div>
          </section>

          {/* Form Section */}
          <section className="container mx-auto px-4 -mt-12 relative z-10 mb-16">
            <Card className="max-w-3xl mx-auto dark:bg-stone-800 dark:text-white border dark:border-stone-700">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  Submit Your Event
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RegisterEventForm loading={loading} setLoading={setLoading} />
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Background Decorations */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div
            className={`absolute -top-1/3 -right-1/3 w-[40rem] h-[40rem] opacity-30 blur-3xl rounded-full ${
              darkMode
                ? "bg-gradient-to-br from-indigo-800 to-purple-900"
                : "bg-gradient-to-br from-indigo-300 to-purple-400"
            }`}
          />
          <div
            className={`absolute -bottom-1/3 -left-1/3 w-[40rem] h-[40rem] opacity-30 blur-3xl rounded-full ${
              darkMode
                ? "bg-gradient-to-tl from-pink-800 to-indigo-900"
                : "bg-gradient-to-tl from-pink-300 to-indigo-400"
            }`}
          />
        </div>
      </div>
    </div>
  )
}