import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import FormTab from './FormTab'
import Responses from './Responses'
import Referrers from './Referrers'
import SettingsTab from './SettingsTab'

const TABS = ['Form', 'Responses', 'Referral emails', 'Settings'] as const
type Tab = (typeof TABS)[number]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('Responses')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold">Referral admin</h1>
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm ${tab === t ? 'border-indigo-600 font-medium text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'Form' && <FormTab />}
        {tab === 'Responses' && <Responses />}
        {tab === 'Referral emails' && <Referrers />}
        {tab === 'Settings' && <SettingsTab />}
      </main>
    </div>
  )
}
