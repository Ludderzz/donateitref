import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Settings } from '../../types'

export default function SettingsTab() {
  const [s, setS] = useState<Settings | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => setS(data as Settings | null))
  }, [])

  if (!s) return <p className="text-slate-500">Loading…</p>

  async function save() {
    if (!s) return
    const { error } = await supabase.from('settings').update({
      forms_closed: s.forms_closed,
      closed_message: s.closed_message,
      default_max_submissions: s.default_max_submissions,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setMsg(error ? error.message : 'Saved')
  }

  async function applyToAll() {
    if (!s || !confirm(`Set every referral email to ${s.default_max_submissions} total referrals?`)) return
    const { error } = await supabase.from('referrers').update({ max_submissions: s.default_max_submissions }).neq('email', '')
    setMsg(error ? error.message : 'Updated all referral emails')
  }

  return (
    <div className="card max-w-xl space-y-5">
      <label className="flex items-center gap-3">
        <input type="checkbox" className="size-5" checked={s.forms_closed} onChange={(e) => setS({ ...s, forms_closed: e.target.checked })} />
        <span className="font-medium">Close all forms for now</span>
      </label>
      <label className="block">
        <span className="label">Message shown while closed</span>
        <textarea className="input" rows={2} value={s.closed_message} onChange={(e) => setS({ ...s, closed_message: e.target.value })} />
      </label>
      <label className="block">
        <span className="label">Default referrals per email</span>
        <input type="number" min={0} className="input w-32" value={s.default_max_submissions}
          onChange={(e) => setS({ ...s, default_max_submissions: Number(e.target.value) })} />
      </label>
      <div className="flex items-center gap-3">
        <button className="btn" onClick={save}>Save settings</button>
        <button className="btn-ghost" onClick={applyToAll}>Apply default to all emails</button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>
    </div>
  )
}
