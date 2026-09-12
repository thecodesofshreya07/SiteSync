import { useState } from 'react'
import { Mail, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [projectSize, setProjectSize] = useState('1-3 Sites')
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contact" className="py-20 sm:py-28 bg-gradient-to-b from-[#f4f9f6] via-[#ecf6f1]/60 to-[#e6f2eb]/70 text-slate-900 relative overflow-hidden">
      {/* Ambient soft green aura for a seamless fluid transition */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column Info */}
          <div className="lg:col-span-6 space-y-5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-public tracking-tight leading-tight">
              Ready to Upgrade Your Site Operations?
            </h2>
            <p className="text-sm sm:text-base text-slate-700 font-medium font-ibm leading-relaxed">
              Connect with our construction solutions engineers to setup live multi-site telemetry, configure Brevo alert relays, or migrate your project inventory data.
            </p>

            <div className="space-y-3.5 pt-2 text-xs sm:text-sm font-ibm text-slate-800">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Direct Inquiries</p>
                  <p className="font-bold text-slate-900">devsupport007@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#146b3a] flex items-center justify-center border border-emerald-200 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Engineering HQ</p>
                  <p className="font-bold text-slate-900">Bandra East, Mumbai, Maharashtra 400051</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Data Security</p>
                  <p className="font-bold text-slate-900">PostgreSQL Multi-Tenant Isolation & Role Scoping</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Form - Compact breadth */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-lg space-y-5">
              {submitted ? (
                <div className="py-10 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 size={26} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-public">Inquiry Dispatched Successfully!</h3>
                  <p className="text-xs text-slate-700 font-medium max-w-sm mx-auto font-ibm">
                    Our technical deployment team will reach out to <strong>{email}</strong> within 24 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-ibm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 font-public">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 font-public">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 font-public">
                      Number of Construction Sites
                    </label>
                    <select
                      value={projectSize}
                      onChange={(e) => setProjectSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none cursor-pointer transition-all"
                    >
                      <option value="1-3 Sites">1 – 3 Active Sites (Standard Package)</option>
                      <option value="4-10 Sites">4 – 10 Active Sites (Mid-Tier Enterprise)</option>
                      <option value="10+ Sites">10+ Sites (Full Enterprise Portfolio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 font-public">
                      Project Notes / Specific Operational Needs
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center rounded-full bg-[#146b3a] hover:bg-[#188045] py-3 text-xs sm:text-sm font-bold text-white transition-all font-public cursor-pointer shadow-md shadow-[#146b3a]/20 active:scale-95"
                  >
                    <span>Submit Deployment Request</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Footer Credits */}
        <div className="mt-16 pt-8 border-t border-slate-300/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 font-semibold font-ibm gap-4">
          <p>© {new Date().getFullYear()} SiteSync. Precision Built Multi-Site Construction Intelligence.</p>
          <div className="flex items-center gap-6">
            <a href="#home" className="hover:text-[#146b3a] transition-colors">Home</a>
            <a href="#about" className="hover:text-[#146b3a] transition-colors">About</a>
            <a href="#contact" className="hover:text-[#146b3a] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </section>
  )
}
