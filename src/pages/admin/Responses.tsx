import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { devicesSummary, refCode } from '../../lib/referral'
import type { DeviceRequest, Priority, Referral, Status } from '../../types'

const STATUSES: Status[] = ['submitted', 'validated', 'approved', 'dispatched', 'completed', 'rejected']
const PRIORITIES: Priority[] = ['standard', 'urgent', 'emergency']

function fmt(k: string, v: unknown): string {
  if (k === 'devices') return devicesSummary(v as DeviceRequest[])
  if (v === null || v === '' || v === undefined) return '—'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function downloadCsv(rows: Referral[]) {
  const cols: (keyof Referral)[] = [
    'ref_no', 'created_at', 'status', 'priority', 'organisation_name', 'organisation_type', 'referrer_name', 'referrer_email',
    'referral_reason', 'intended_use', 'number_of_clients', 'age_range', 'gender', 'ethnicity', 'nationality',
    'client_postcode', 'local_authority', 'vulnerability_indicators', 'devices', 'accessories', 'received_date', 'impact_notes',
  ]
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
  const lines = [
    cols.join(','),
    ...rows.map((r) => cols.map((c) => esc(c === 'ref_no' ? refCode(r.ref_no) : fmt(c, r[c]))).join(',')),
  ]
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `referrals-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Responses() {
  const [rows, setRows] = useState<Referral[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('referrals').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError(error.message)
      else setRows((data ?? []) as Referral[])
    })
  }, [])

  async function patch(id: string, p: Partial<Referral>) {
    const { error } = await supabase.from('referrals').update(p).eq('id', id)
    if (error) setError(error.message)
    else setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)))
  }

  const shown = useMemo(
    () => rows.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))),
    [rows, q, statusFilter],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[11rem]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-500">{shown.length} response{shown.length === 1 ? '' : 's'}</span>
        <button className="btn-ghost ml-auto" onClick={() => downloadCsv(shown)}>Export CSV</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Ref', 'Date', 'Organisation', 'Reason', 'Devices', 'Priority', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <Fragment key={r.id}>
                <tr className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <td className="px-3 py-2 font-mono">
                    {refCode(r.ref_no)}
                    {r.possible_duplicate && <span className="ml-1 rounded bg-amber-100 px-1 text-xs text-amber-800">dup?</span>}
                  </td>
                  <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-3 py-2">{r.organisation_name}</td>
                  <td className="px-3 py-2">{r.referral_reason}</td>
                  <td className="px-3 py-2">{devicesSummary(r.devices)}</td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <select className="input py-1" value={r.priority} onChange={(e) => patch(r.id, { priority: e.target.value as Priority })}>
                      {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <select className="input py-1" value={r.status} onChange={(e) => patch(r.id, { status: e.target.value as Status })}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
                {open === r.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="space-y-4 px-4 py-4">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(r)
                          .filter(([k]) => !['id', 'admin_notes', 'received_date', 'impact_notes', 'followup_notes'].includes(k))
                          .map(([k, v]) => (
                            <div key={k}>
                              <dt className="text-xs uppercase text-slate-500">{k.replace(/_/g, ' ')}</dt>
                              <dd className="break-words text-sm">{fmt(k, v)}</dd>
                            </div>
                          ))}
                      </dl>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="label">Device received (date)</span>
                          <input type="date" className="input" defaultValue={r.received_date ?? ''}
                            onBlur={(e) => patch(r.id, { received_date: e.target.value || null })} />
                        </label>
                        <label className="block">
                          <span className="label">Impact statement</span>
                          <textarea className="input" rows={2} defaultValue={r.impact_notes ?? ''}
                            onBlur={(e) => patch(r.id, { impact_notes: e.target.value || null })} />
                        </label>
                        <label className="block">
                          <span className="label">Follow-up notes</span>
                          <textarea className="input" rows={2} defaultValue={r.followup_notes ?? ''}
                            onBlur={(e) => patch(r.id, { followup_notes: e.target.value || null })} />
                        </label>
                        <label className="block">
                          <span className="label">Admin notes (internal)</span>
                          <textarea className="input" rows={2} defaultValue={r.admin_notes ?? ''}
                            onBlur={(e) => patch(r.id, { admin_notes: e.target.value || null })} />
                        </label>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No responses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
