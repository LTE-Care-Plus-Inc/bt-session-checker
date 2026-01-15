'use client'

import { useState } from 'react'
import { User, Mail, Phone, Send, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function VerifyForm() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, text: '' }) // New state for UI alerts
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Clear any old status messages when starting a new search
    setStatus({ type: null, text: '' });

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Verification failed';

        // 1. Update the inline alert
        setStatus({ type: 'error', text: errorMsg });

        // 2. Show the toast
        toast.error(errorMsg);
        return;
      }

      const successMsg = 'Report Generated! Check your email.';

      // 1. Update the inline alert
      setStatus({ type: 'success', text: successMsg });

      // 2. Show the toast
      toast.success('Success!', { description: successMsg });

      // OPTIONAL: Clear the form on success
      // setFormData({ firstName: '', lastName: '', email: '', phone: '' });

    } catch (err) {
      const connectionError = "Could not reach the server. Please check your internet.";
      setStatus({ type: 'error', text: connectionError });
      toast.error('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070D] px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-220px] right-[-120px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[160px]" />

      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-8 shadow-[0_0_80px_-20px_rgba(59,130,246,0.35)] backdrop-blur-xl">

          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/40 shadow-inner">
                <Sparkles className="h-5 w-5 text-cyan-300/80" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">LTE Care Plus</div>
                <div className="text-xs text-white/50">Secure Report Portal</div>
              </div>
            </div>
            <div className="hidden sm:block rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] tracking-wide text-white/50">
              Payroll Verification
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">Session Report Lookup</h1>
            <p className="text-sm text-white/60">Enter your details to generate your session report.</p>
          </div>

          {/* --- UI ALERT SECTION --- */}
          {status.type && (
            <div className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
              }`}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {status.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name" icon={<User className="h-4 w-4" />}>
                <Input
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Field>
              <Field label="Last Name">
                <Input
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Work Email" icon={<Mail className="h-4 w-4" />}>
              <Input
                type="email"
                placeholder="john.doe@company.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Field>

            <Field label="Phone Number" icon={<Phone className="h-4 w-4" />} prefix="+1">
              <Input
                type="tel"
                placeholder="1234567890"
                maxLength={10}
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              />
            </Field>

            <Button type="submit" size="xl" disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning Records…</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Generate Report</>
              )}
            </Button>

            <div className="space-y-2 text-center">
              <p className="text-xs text-white/40">Reports are emailed securely after verification.</p>
              <p className="text-[11px] text-white/30">© {new Date().getFullYear()} LTE Care Plus, Inc.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon, prefix, children }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>}
        {prefix && <span className="absolute left-11 top-1/2 -translate-y-1/2 border-r border-white/10 pr-3 text-sm text-white/40">{prefix}</span>}
        <div className={`${icon ? 'pl-11' : ''} ${prefix ? 'pl-[4.5rem]' : ''}`}>{children}</div>
      </div>
    </div>
  )
}