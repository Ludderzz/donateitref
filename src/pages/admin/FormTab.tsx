import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Settings } from '../../types'

export default function FormTab() {
  const [s, setS] = useState<Settings | null>(null)
  const link = window.location.origin + '/'

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => setS(data as Settings | null))
  }, [])

  return (
    <div className="card max-w-xl space-y-3">
      <h2 className="text-lg font-semibold">Referral form</h2>
      <p className="text-sm">
        Status:{' '}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s?.forms_closed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {s ? (s.forms_closed ? 'Closed' : 'Open') : '…'}
        </span>
      </p>
      <div>
        <span className="label">Link to share with referrers</span>
        <div className="flex gap-2">
          <input className="input" readOnly value={link} />
          <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(link)}>Copy</button>
        </div>
      </div>
      <p className="text-xs text-slate-500">Only emails added under "Referral emails" can submit. Open/close the form in Settings.</p>
    </div>
  )
}
