import { DEVICES, EMERGENCY_REASONS } from './options'
import type { DeviceRequest, DeviceType, ReferralInput } from '../types'

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
export const isPostcode = (s: string) => UK_POSTCODE.test(s.trim())
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
export const refCode = (n: number) => `REF-${String(n).padStart(5, '0')}`

export const isHighRisk = (f: ReferralInput) => EMERGENCY_REASONS.includes(f.referral_reason)
export const totalDevices = (f: ReferralInput) => f.devices.reduce((n, d) => n + (Number(d.quantity) || 0), 0)
export const isMultiple = (f: ReferralInput) => totalDevices(f) > 1 || f.number_of_clients > 1

export function newDevice(type: DeviceType): DeviceRequest {
  return {
    type, quantity: 1, os: '',
    sim_required: null, data_required: null, whatsapp: null, secure_comms: null,
    charging_access: null, refurbished_ok: null, accessibility_needs: '',
  }
}

export function devicesSummary(devices: DeviceRequest[]) {
  return devices.map((d) => `${d.quantity}× ${DEVICES[d.type].label} (${d.os})`).join('; ')
}

export function validate(f: ReferralInput): Record<string, string> {
  const e: Record<string, string> = {}
  const required: (keyof ReferralInput)[] = [
    'organisation_name', 'organisation_type', 'referrer_name', 'person_in_charge', 'delivery_preference',
    'age_range', 'gender', 'nationality', 'ethnicity', 'local_authority', 'referral_reason', 'intended_use',
  ]
  for (const k of required) if (!String(f[k]).trim()) e[k] = 'Required'

  if (f.referrer_phone.replace(/\D/g, '').length < 10) e.referrer_phone = 'Enter a valid phone number'
  if (!isPostcode(f.client_postcode)) e.client_postcode = 'Enter a valid UK postcode'
  if (!Number.isInteger(f.number_of_clients) || f.number_of_clients < 1) e.number_of_clients = 'Enter 1 or more'

  if (f.delivery_preference === 'delivery') {
    if (f.delivery_address.trim().length < 10) e.delivery_address = 'Enter the full delivery address'
    if (!isPostcode(f.delivery_postcode)) e.delivery_postcode = 'Enter a valid UK postcode'
  }

  if (f.devices.length === 0) e.devices = 'Select at least one device'
  for (const d of f.devices) {
    const k = `device_${d.type}`
    if (!Number.isInteger(d.quantity) || d.quantity < 1) e[`${k}_quantity`] = 'Enter 1 or more'
    if (!d.os) e[`${k}_os`] = 'Select one'
    if (d.charging_access === null) e[`${k}_charging`] = 'Please answer'
    if (d.refurbished_ok === null) e[`${k}_refurb`] = 'Please answer'
    if (d.type === 'phone') {
      if (d.sim_required === null) e[`${k}_sim`] = 'Please answer'
      if (d.data_required === null) e[`${k}_data`] = 'Please answer'
    }
  }

  if (isHighRisk(f)) {
    if (f.vulnerability_indicators.length === 0) e.vulnerability_indicators = 'Select at least one for a crisis referral'
    if (f.safe_storage === null) e.safe_storage = 'Please answer'
    if (f.safe_charging === null) e.safe_charging = 'Please answer'
  }
  if (isMultiple(f) && !f.distribution_plan.trim()) e.distribution_plan = 'Tell us how devices will be distributed'
  if (f.bulk_stock) {
    if (!f.storage_capacity.trim()) e.storage_capacity = 'Required'
    if (!f.distribution_timeline.trim()) e.distribution_timeline = 'Required'
  }
  return e
}

const nn = (s: string) => s.trim() || null

export function buildPayload(f: ReferralInput, email: string) {
  const high = isHighRisk(f)
  const delivery = f.delivery_preference === 'delivery'
  return {
    ...f,
    referrer_email: email,
    delivery_address: delivery ? nn(f.delivery_address) : null,
    delivery_postcode: delivery ? (nn(f.delivery_postcode)?.toUpperCase() ?? null) : null,
    client_postcode: f.client_postcode.trim().toUpperCase(),
    is_high_risk: high,
    safe_storage: high ? f.safe_storage : null,
    safe_charging: high ? f.safe_charging : null,
    contact_restrictions: high ? nn(f.contact_restrictions) : null,
    risk_notes: high ? nn(f.risk_notes) : null,
    distribution_plan: isMultiple(f) ? nn(f.distribution_plan) : null,
    storage_capacity: f.bulk_stock ? nn(f.storage_capacity) : null,
    distribution_timeline: f.bulk_stock ? nn(f.distribution_timeline) : null,
    additional_context: nn(f.additional_context),
    preferred_brands: nn(f.preferred_brands),
  }
}
