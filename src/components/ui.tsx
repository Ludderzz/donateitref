import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onValue: (v: string) => void }
export function Input({ onValue, ...rest }: InputProps) {
  return <input className="input" {...rest} onChange={(e) => onValue(e.target.value)} />
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & { onValue: (v: string) => void }
export function Textarea({ onValue, ...rest }: TextareaProps) {
  return <textarea className="input" rows={3} {...rest} onChange={(e) => onValue(e.target.value)} />
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg border px-4 py-1.5 text-sm ${value === v ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

export function CheckGroup({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300"
            checked={value.includes(o)}
            onChange={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])}
          />
          {o}
        </label>
      ))}
    </div>
  )
}
