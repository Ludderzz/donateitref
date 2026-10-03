import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isEmail } from '../../lib/referral'
import type { ReferrerUsage, Settings } from '../../types'

export default function Referrers() {
  const [rows, setRows] = useState<ReferrerUsage[]>([])
  const [emails, setEmails] = useState('')
  const [max, setMax] = useState(5)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('referrer_usage').select('*').order('email')
    setRows((data ?? []) as ReferrerUsage[])
  }, [])

  useEffect(() => {
    void load()
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setMax((data as Settings).default_max_submissions)
    })
  }, [load])

  async function add() {
    const list = [...new Set(emails.split(/[\s,;]+/).map((e) => e.toLowerCase()).filter(isEmail))]
    if (!list.length) { setMsg('No valid emails found.'); return }
    const { error } = await supabase
      .from('referrers')
      .upsert(list.map((email) => ({ email, max_submissions: max })), { onConflict: 'email', ignoreDuplicates: true })
    if (error) { setMsg(error.message); return }
    setMsg(`Processed ${list.length} email${list.length === 1 ? '' : 's'} (existing ones left unchanged).`)
    setEmails('')
    await load()
  }

  async function update(id: string, p: Partial<Pick<ReferrerUsage, 'max_submissions' | 'active' | 'organisation_name'>>) {
    const { error } = await supabase.from('referrers').update(p).eq('id', id)
    if (error) setMsg(error.message)
    await load()
  }

  async function remove(r: ReferrerUsage) {
    if (!confirm(`Remove ${r.email}? Their past referrals are kept.`)) return
    await supabase.from('referrers').delete().eq('id', r.id)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h2 className="font-semibold">Add referral emails</h2>
        <textarea
          className="input" rows={3}
          placeholder="One email per line (or separated by commas)"
          value={emails} onChange={(e) => setEmails(e.target.value)}
        />
        <div className="flex items-end gap-3">
          <label className="block">
            <span className="label">Referrals each</span>
            <input type="number" min={0} className="input w-28" value={max} onChange={(e) => setMax(Number(e.target.value))} />
          </label>
          <button className="btn" onClick={add}>Add</button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Email', 'Organisation', 'Allowed', 'Remaining', 'Active', ''].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">
                  <input className="input py-1" defaultValue={r.organisation_name ?? ''}
                    onBlur={(e) => { if (e.target.value !== (r.organisation_name ?? '')) void update(r.id, { organisation_name: e.target.value || null }) }} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} className="input w-20 py-1" defaultValue={r.max_submissions}
                    onBlur={(e) => { if (Number(e.target.value) !== r.max_submissions) void update(r.id, { max_submissions: Number(e.target.value) }) }} />
                </td>
                <td className="px-3 py-2">
                  <span className={r.remaining === 0 ? 'font-medium text-red-600' : 'font-medium'}>{r.remaining} left</span>
                  <span className="ml-1 text-slate-500">({r.used}/{r.max_submissions} used)</span>
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" className="size-4" checked={r.active} onChange={(e) => update(r.id, { active: e.target.checked })} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button className="text-red-600 hover:underline" onClick={() => remove(r)}>Remove</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No referral emails yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
