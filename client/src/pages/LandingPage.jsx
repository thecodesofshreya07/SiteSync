import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import AboutSection from '../components/landing/AboutSection'
import ContactSection from '../components/landing/ContactSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#f4f9f6] font-public selection:bg-[#146b3a] selection:text-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        <HeroSection />
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  )
}
