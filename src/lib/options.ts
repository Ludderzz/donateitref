import type { DeviceType } from '../types'

export const ORG_TYPES: string[] = ['School', 'Council', 'Charity', 'NHS / health service', 'Social prescriber', 'Homeless service', 'Refugee support organisation', 'College / university', 'Other']
export const AGE_RANGES: string[] = ['Under 11', '11–15', '16–17', '18–24', '25–34', '35–44', '45–54', '55–64', '65+', 'Mixed (multiple clients)']
export const GENDERS: string[] = ['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Mixed (multiple clients)']
export const ETHNICITIES: string[] = ['Asian or Asian British', 'Black, African, Caribbean or Black British', 'Mixed or multiple ethnic groups', 'White', 'Other ethnic group', 'Prefer not to say', 'Mixed (multiple clients)']

export const REASONS: string[] = ['Domestic abuse', 'Exploitation / modern slavery', 'Homelessness', 'Crisis support', 'Education – school pupil', 'Education – college / university', 'Community learning', 'Employment / job seeking', 'Health – remote appointments', 'Health – mental health support', 'Ability-related need', 'Other']
export const EMERGENCY_REASONS: readonly string[] = ['Domestic abuse', 'Exploitation / modern slavery', 'Homelessness', 'Crisis support']

export const INTENDED_USE: string[] = ['Education', 'Employment', 'Medical', 'Essential access']
export const VULNERABILITY: string[] = ['Domestic abuse survivor', 'At risk of exploitation', 'Homeless or at risk of homelessness', 'Refugee / asylum seeker', 'Living in poverty', 'Disability or long-term condition', 'Care leaver', 'Social isolation', 'Mental health need']
export const ACCESSORIES: string[] = ['Charger / cable', 'Protective case', 'Screen protector', 'Earphones', 'Laptop bag', 'Mouse']

export const DEVICES: Record<DeviceType, { label: string; osLabel: string; os: string[] }> = {
  phone: { label: 'Mobile phone', osLabel: 'Which kind of phone?', os: ['Apple (iPhone)', 'Android', 'No preference'] },
  laptop: { label: 'Laptop', osLabel: 'Which kind of laptop?', os: ['Windows', 'Apple (MacBook)', 'Chromebook', 'No preference'] },
  tablet: { label: 'Tablet', osLabel: 'Which kind of tablet?', os: ['Apple (iPad)', 'Android', 'Windows', 'No preference'] },
  headphones: { label: 'Headphones / accessories', osLabel: 'Which kind?', os: ['Wired', 'Wireless / Bluetooth', 'No preference'] },
}
export const DEVICE_TYPES = Object.keys(DEVICES) as DeviceType[]
