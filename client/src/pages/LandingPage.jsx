import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import AboutSection from '../components/landing/AboutSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import ContactSection from '../components/landing/ContactSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Floating Pill Dark-Glass Navbar (Elevon Build style) */}
      <Navbar />

      {/* Main Hero Section (Buildora style) */}
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <ContactSection />
      </main>
    </div>
  )
}
