export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'headphones'
export type Status = 'submitted' | 'validated' | 'approved' | 'dispatched' | 'completed' | 'rejected'
export type Priority = 'standard' | 'urgent' | 'emergency'

export interface DeviceRequest {
  type: DeviceType
  quantity: number
  os: string
  sim_required: boolean | null
  data_required: boolean | null
  whatsapp: boolean | null
  secure_comms: boolean | null
  charging_access: boolean | null
  refurbished_ok: boolean | null
  accessibility_needs: string
}

export interface ReferralInput {
  organisation_name: string
  organisation_type: string
  referrer_name: string
  referrer_phone: string
  delivery_preference: string
  delivery_address: string
  delivery_postcode: string
  person_in_charge: string
  number_of_clients: number
  age_range: string
  gender: string
  nationality: string
  ethnicity: string
  client_postcode: string
  local_authority: string
  referral_reason: string
  intended_use: string
  priority: Priority
  vulnerability_indicators: string[]
  is_high_risk: boolean
  safe_storage: boolean | null
  safe_charging: boolean | null
  contact_restrictions: string
  risk_notes: string
  devices: DeviceRequest[]
  accessories: string[]
  distribution_plan: string
  bulk_stock: boolean
  storage_capacity: string
  distribution_timeline: string
  additional_context: string
  digital_skills_support: boolean
  preferred_brands: string
}

export interface Referral extends ReferralInput {
  id: string
  ref_no: number
  created_at: string
  referrer_email: string
  status: Status
  possible_duplicate: boolean
  admin_notes: string | null
  received_date: string | null
  impact_notes: string | null
  followup_notes: string | null
}

export interface Settings {
  id: 1
  forms_closed: boolean
  closed_message: string
  default_max_submissions: number
}

export interface ReferrerUsage {
  id: string
  email: string
  organisation_name: string | null
  max_submissions: number
  active: boolean
  used: number
  remaining: number
}
