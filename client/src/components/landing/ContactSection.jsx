import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2, Building, ShieldCheck } from 'lucide-react'

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
    <section id="contact" className="py-24 bg-slate-900 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Info */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-400 font-ibm">
              Enterprise Deployment
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-public tracking-tight">
              Ready to Upgrade Your Site Operations?
            </h2>
            <p className="text-sm text-slate-400 font-ibm leading-relaxed">
              Connect with our construction solutions engineers to setup live multi-site telemetry, configure Brevo alert relays, or migrate your project inventory data.
            </p>

            <div className="space-y-4 pt-4 text-xs font-ibm text-slate-300">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Direct Inquiries</p>
                  <p className="font-semibold text-white">devsupport007@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Engineering HQ</p>
                  <p className="font-semibold text-white">Bandra East, Mumbai, Maharashtra 400051</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Data Security</p>
                  <p className="font-semibold text-white">PostgreSQL Multi-Tenant Isolation & Role Scoping</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl space-y-6">
              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 size={30} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-white font-public">Inquiry Dispatched Successfully!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-ibm">
                    Our technical deployment team will reach out to <strong>{email}</strong> within 24 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-ibm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-public">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Arvind Mishra"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-public">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="arvind@infracon.com"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-public">
                      Number of Construction Sites
                    </label>
                    <select
                      value={projectSize}
                      onChange={(e) => setProjectSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3.5 text-xs text-slate-100 focus:border-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="1-3 Sites">1 – 3 Active Sites (Standard Package)</option>
                      <option value="4-10 Sites">4 – 10 Active Sites (Mid-Tier Enterprise)</option>
                      <option value="10+ Sites">10+ Sites (Full Enterprise Portfolio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-public">
                      Project Notes / Specific Operational Needs
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your current procurement challenges or ERP integration requirements..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 hover:from-teal-400 hover:to-emerald-400 active:scale-[0.99] transition-all font-public cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <Send size={15} />
                    <span>Submit Deployment Request</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
