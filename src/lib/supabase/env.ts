const PLACEHOLDER_VALUES = new Set([
  'replace-with-local-anon-key',
  'your-anon-key',
  'your-service-role-key',
  'changeme',
])

function isPlaceholder(value: string | undefined) {
  if (!value) return true

  const trimmed = value.trim()
  if (!trimmed) return true

  const normalized = trimmed.toLowerCase()
  return (
    PLACEHOLDER_VALUES.has(normalized) ||
    normalized.includes('replace-with-') ||
    normalized.includes('your-') ||
    normalized.includes('example')
  )
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey || isPlaceholder(url) || isPlaceholder(anonKey)) {
    throw new Error(
      'Supabase is not configured. Run `npm run supabase:start`, then `npm run supabase:status`, and copy the API URL and ANON KEY into `.env.local` before starting the app.',
    )
  }

  return { url, anonKey }
}
