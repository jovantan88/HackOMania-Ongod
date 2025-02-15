import RegisterEventForm from "../../components/register-event-form"
// import FeatureHighlights from "./feature-highlights"
// import Footer from "./footer"

export default function RegisterEventPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-100 to-white">
      <main className="flex-grow">
        <section className="bg-purple-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Register Your Event</h1>
            <p className="text-xl mb-8">Showcase your Eventbrite or Lu.ma events on our platform</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center text-purple-700">Submit Your Event</h2>
              <RegisterEventForm />
            </div>
          </div>
        </section>

        {/* <FeatureHighlights /> */}
      </main>
      {/* <Footer /> */}
    </div>
  )
}

