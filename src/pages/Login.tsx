import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function Login({ admin = false }: { admin?: boolean }) {
  const { session, loading } = useSession()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loading && session) return <Navigate to={admin ? '/admin' : '/referral'} replace />

  async function send(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin + (admin ? '/admin' : '/referral') },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-xl font-semibold">{admin ? 'Admin sign in' : 'Referral portal'}</h1>
        <p className="mb-5 text-sm text-slate-600">
          {admin ? 'Enter your admin email.' : 'Enter the email your organisation was registered with. We will send you a sign-in link.'}
        </p>
        {sent ? (
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Check your inbox for a sign-in link sent to <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <input
              className="input"
              type="email"
              required
              placeholder="you@organisation.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn w-full" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
