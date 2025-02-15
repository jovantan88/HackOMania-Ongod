import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegisterEventForm from "@/components/register-event-form"

export default function RegisterEventPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-100 via-purple-50 to-white">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-700 to-purple-800 text-white py-24">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Add an event
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 mx-auto">
              Share a <a href="https://eventbrite.sg" className="underline">eventbrite</a> or <a href="https://lu.ma" className="underline">lu.ma</a> event on our platform
            </p>
          </div>
        </section>

        {/* Form Section */}
        <section className="container mx-auto px-4 -mt-12 relative z-10 mb-16">
          <Card className="max-w-3xl mx-auto shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-purple-700">
                Submit your event
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RegisterEventForm />
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-300 rounded-full opacity-20 blur-3xl" />
      </div>
    </div>
  )
}