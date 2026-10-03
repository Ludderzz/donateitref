import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { CheckGroup, Field, Input, Section, Select, Textarea, YesNo } from '../components/ui'
import { ACCESSORIES, AGE_RANGES, DEVICES, DEVICE_TYPES, ETHNICITIES, GENDERS, INTENDED_USE, ORG_TYPES, REASONS, VULNERABILITY } from '../lib/options'
import { buildPayload, isHighRisk, isMultiple, newDevice, validate } from '../lib/referral'
import type { DeviceRequest, DeviceType, ReferralInput, ReferrerUsage, Settings } from '../types'

const empty: ReferralInput = {
  organisation_name: '', organisation_type: '', referrer_name: '', referrer_phone: '',
  delivery_preference: '', delivery_address: '', delivery_postcode: '', person_in_charge: '',
  number_of_clients: 1, age_range: '', gender: '', nationality: '', ethnicity: '',
  client_postcode: '', local_authority: '', referral_reason: '', intended_use: '', priority: 'standard',
  vulnerability_indicators: [], is_high_risk: false, safe_storage: null, safe_charging: null,
  contact_restrictions: '', risk_notes: '', devices: [], accessories: [], distribution_plan: '',
  bulk_stock: false, storage_capacity: '', distribution_timeline: '',
  additional_context: '', digital_skills_support: false, preferred_brands: '',
}

export default function Referral() {
  const { session } = useSession()
  const email = session?.user.email?.toLowerCase() ?? ''

  const [settings, setSettings] = useState<Settings | null>(null)
  const [usage, setUsage] = useState<ReferrerUsage | null>(null)
  const [ready, setReady] = useState(false)
  const [f, setF] = useState<ReferralInput>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const load = useCallback(async () => {
    if (!email) return
    const [s, u] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('referrer_usage').select('*').eq('email', email).maybeSingle(),
    ])
    setSettings(s.data as Settings | null)
    setUsage(u.data as ReferrerUsage | null)
    setReady(true)
  }, [email])

  useEffect(() => { void load() }, [load])

  const set = <K extends keyof ReferralInput>(k: K, v: ReferralInput[K]) => setF((p) => ({ ...p, [k]: v }))

  const toggleDevice = (t: DeviceType) =>
    setF((p) => ({
      ...p,
      devices: p.devices.some((d) => d.type === t)
        ? p.devices.filter((d) => d.type !== t)
        : [...p.devices, newDevice(t)].sort((a, b) => DEVICE_TYPES.indexOf(a.type) - DEVICE_TYPES.indexOf(b.type)),
    }))

  const patchDevice = (t: DeviceType, patch: Partial<DeviceRequest>) =>
    setF((p) => ({ ...p, devices: p.devices.map((d) => (d.type === t ? { ...d, ...patch } : d)) }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const errs = validate(f)
    setErrors(errs)
    if (Object.keys(errs).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setBusy(true)
    const { error } = await supabase.from('referrals').insert(buildPayload(f, email))
    setBusy(false)
    if (error) {
      setSubmitError(error.code === '42501'
        ? 'This referral was not accepted. Forms may be closed or your limit has been reached.'
        : error.message)
      return
    }
    setF(empty)
    setDone(true)
    await load()
  }

  const remaining = usage?.remaining ?? 0
  let blocked = ''
  if (settings?.forms_closed) blocked = settings.closed_message
  else if (!usage || !usage.active) blocked = `${email} has not been approved to send referrals. Please contact us to be added.`
  else if (remaining <= 0) blocked = 'You have used all of your available referrals. Please contact us if you need more.'

  const high = isHighRisk(f)
  const errorCount = Object.keys(errors).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Device referral</h1>
          <p className="text-sm text-slate-500">
            {email}{usage && ` · ${remaining} referral${remaining === 1 ? '' : 's'} remaining`}
          </p>
        </div>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>

      {!ready ? (
        <p className="text-slate-500">Loading…</p>
      ) : done ? (
        <div className="card text-center">
          <h2 className="mb-2 text-lg font-semibold">Referral submitted, thank you</h2>
          <p className="mb-4 text-sm text-slate-600">We'll be in touch if we need anything further.</p>
          {!blocked && <button className="btn" onClick={() => setDone(false)}>Submit another</button>}
        </div>
      ) : blocked ? (
        <div className="card text-slate-700">{blocked}</div>
      ) : (
        <form onSubmit={submit} className="space-y-6" noValidate>
          {errorCount > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Please fix the {errorCount} highlighted field{errorCount === 1 ? '' : 's'} below.
            </div>
          )}

          <Section title="1. Your organisation">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation name" error={errors.organisation_name}>
                <Input value={f.organisation_name} onValue={(v) => set('organisation_name', v)} />
              </Field>
              <Field label="Organisation type" error={errors.organisation_type}>
                <Select value={f.organisation_type} onChange={(v) => set('organisation_type', v)} options={ORG_TYPES} />
              </Field>
              <Field label="Your name" error={errors.referrer_name}>
                <Input value={f.referrer_name} onValue={(v) => set('referrer_name', v)} />
              </Field>
              <Field label="Your phone" error={errors.referrer_phone}>
                <Input type="tel" value={f.referrer_phone} onValue={(v) => set('referrer_phone', v)} />
              </Field>
              <Field label="Delivery or collection?" error={errors.delivery_preference}>
                <select className="input" value={f.delivery_preference} onChange={(e) => set('delivery_preference', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="delivery">Delivery</option>
                  <option value="collection">Collection</option>
                </select>
              </Field>
              <Field label="Named person in charge" error={errors.person_in_charge} hint="Who will receive the devices?">
                <Input value={f.person_in_charge} onValue={(v) => set('person_in_charge', v)} />
              </Field>
              {f.delivery_preference === 'delivery' && (
                <>
                  <Field label="Full delivery address" error={errors.delivery_address}>
                    <Textarea value={f.delivery_address} onValue={(v) => set('delivery_address', v)} />
                  </Field>
                  <Field label="Delivery postcode" error={errors.delivery_postcode}>
                    <Input value={f.delivery_postcode} onValue={(v) => set('delivery_postcode', v)} />
                  </Field>
                </>
              )}
            </div>
          </Section>

          <Section title="2. Client details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Number of clients" error={errors.number_of_clients}>
                <Input type="number" min={1} value={f.number_of_clients} onValue={(v) => set('number_of_clients', Number(v))} />
              </Field>
              <Field label="Age range" error={errors.age_range}>
                <Select value={f.age_range} onChange={(v) => set('age_range', v)} options={AGE_RANGES} />
              </Field>
              <Field label="Gender" error={errors.gender}>
                <Select value={f.gender} onChange={(v) => set('gender', v)} options={GENDERS} />
              </Field>
              <Field label="Nationality" error={errors.nationality}>
                <Input value={f.nationality} onValue={(v) => set('nationality', v)} />
              </Field>
              <Field label="Ethnicity" error={errors.ethnicity}>
                <Select value={f.ethnicity} onChange={(v) => set('ethnicity', v)} options={ETHNICITIES} />
              </Field>
              <Field label="Client postcode" error={errors.client_postcode}>
                <Input value={f.client_postcode} onValue={(v) => set('client_postcode', v)} />
              </Field>
              <Field label="Local authority" error={errors.local_authority}>
                <Input value={f.local_authority} onValue={(v) => set('local_authority', v)} />
              </Field>
              <Field label="Reason for referral" error={errors.referral_reason}>
                <Select value={f.referral_reason} onChange={(v) => set('referral_reason', v)} options={REASONS} />
              </Field>
              <Field label="Intended use" error={errors.intended_use}>
                <Select value={f.intended_use} onChange={(v) => set('intended_use', v)} options={INTENDED_USE} />
              </Field>
              <Field label="Urgency">
                <select className="input" value={f.priority} onChange={(e) => set('priority', e.target.value as ReferralInput['priority'])}>
                  <option value="standard">Standard</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </Field>
            </div>

            <Field
              label={high ? 'Vulnerability indicators (required for crisis referrals)' : 'Vulnerability indicators'}
              error={errors.vulnerability_indicators}
            >
              <CheckGroup options={VULNERABILITY} value={f.vulnerability_indicators} onChange={(v) => set('vulnerability_indicators', v)} />
            </Field>

            {high && (
              <div className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <h3 className="font-medium text-amber-900">High-risk client: extra safety questions</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Is safe storage available?" error={errors.safe_storage}>
                    <YesNo value={f.safe_storage} onChange={(v) => set('safe_storage', v)} />
                  </Field>
                  <Field label="Is there a safe charging location?" error={errors.safe_charging}>
                    <YesNo value={f.safe_charging} onChange={(v) => set('safe_charging', v)} />
                  </Field>
                </div>
                <Field label="Any restrictions on contact?">
                  <Textarea value={f.contact_restrictions} onValue={(v) => set('contact_restrictions', v)} />
                </Field>
                <Field label="Risk notes">
                  <Textarea value={f.risk_notes} onValue={(v) => set('risk_notes', v)} />
                </Field>
              </div>
            )}
          </Section>

          <Section title="3. Devices">
            <Field label="What do they need? (tick all that apply)" error={errors.devices}>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEVICE_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300"
                      checked={f.devices.some((d) => d.type === t)}
                      onChange={() => toggleDevice(t)}
                    />
                    {DEVICES[t].label}
                  </label>
                ))}
              </div>
            </Field>

            {f.devices.map((d) => (
              <DeviceCard key={d.type} d={d} errors={errors} onChange={(p) => patchDevice(d.type, p)} />
            ))}

            {isMultiple(f) && (
              <Field label="Distribution plan" error={errors.distribution_plan} hint="How will multiple devices be shared out, and how many clients per device type?">
                <Textarea value={f.distribution_plan} onValue={(v) => set('distribution_plan', v)} />
              </Field>
            )}

            <Field label="Accessories needed">
              <CheckGroup options={ACCESSORIES} value={f.accessories} onChange={(v) => set('accessories', v)} />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300"
                checked={f.bulk_stock}
                onChange={(e) => set('bulk_stock', e.target.checked)}
              />
              Our organisation would like to hold bulk stock
            </label>
            {f.bulk_stock && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Storage capacity" error={errors.storage_capacity}>
                  <Input value={f.storage_capacity} onValue={(v) => set('storage_capacity', v)} />
                </Field>
                <Field label="Expected distribution timeline" error={errors.distribution_timeline}>
                  <Input value={f.distribution_timeline} onValue={(v) => set('distribution_timeline', v)} />
                </Field>
              </div>
            )}
          </Section>

          <Section title="4. Anything else (optional)">
            <Field label="Additional context">
              <Textarea value={f.additional_context} onValue={(v) => set('additional_context', v)} />
            </Field>
            <Field label="Preferred brands">
              <Input value={f.preferred_brands} onValue={(v) => set('preferred_brands', v)} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300"
                checked={f.digital_skills_support}
                onChange={(e) => set('digital_skills_support', e.target.checked)}
              />
              Client would benefit from digital skills support
            </label>
          </Section>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <button className="btn w-full py-3" disabled={busy}>{busy ? 'Submitting…' : 'Submit referral'}</button>
        </form>
      )}
    </div>
  )
}

function DeviceCard({ d, errors, onChange }: { d: DeviceRequest; errors: Record<string, string>; onChange: (p: Partial<DeviceRequest>) => void }) {
  const meta = DEVICES[d.type]
  const k = `device_${d.type}`
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <h3 className="mb-3 font-medium">{meta.label}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantity" error={errors[`${k}_quantity`]}>
          <Input type="number" min={1} value={d.quantity} onValue={(v) => onChange({ quantity: Number(v) })} />
        </Field>
        <Field label={meta.osLabel} error={errors[`${k}_os`]}>
          <Select value={d.os} onChange={(v) => onChange({ os: v })} options={meta.os} />
        </Field>

        {d.type === 'phone' && (
          <>
            <Field label="SIM required?" error={errors[`${k}_sim`]}>
              <YesNo value={d.sim_required} onChange={(v) => onChange({ sim_required: v })} />
            </Field>
            <Field label="Data required?" error={errors[`${k}_data`]}>
              <YesNo value={d.data_required} onChange={(v) => onChange({ data_required: v })} />
            </Field>
            <Field label="Does the client need WhatsApp?">
              <YesNo value={d.whatsapp} onChange={(v) => onChange({ whatsapp: v })} />
            </Field>
            <Field label="Does the client need secure communication?">
              <YesNo value={d.secure_comms} onChange={(v) => onChange({ secure_comms: v })} />
            </Field>
          </>
        )}

        <Field label="Can the client charge it safely?" error={errors[`${k}_charging`]}>
          <YesNo value={d.charging_access} onChange={(v) => onChange({ charging_access: v })} />
        </Field>
        <Field label="Is a refurbished device acceptable?" error={errors[`${k}_refurb`]}>
          <YesNo value={d.refurbished_ok} onChange={(v) => onChange({ refurbished_ok: v })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Accessibility needs">
            <Textarea rows={2} value={d.accessibility_needs} onValue={(v) => onChange({ accessibility_needs: v })} />
          </Field>
        </div>
      </div>
    </div>
  )
}
