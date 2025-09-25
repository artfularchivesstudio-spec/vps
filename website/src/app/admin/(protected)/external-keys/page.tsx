import { createServiceClient } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'crypto'

export const dynamic = 'force-dynamic'

type ExternalApiKey = {
  id: string
  name: string
  scopes: string[]
  rate_limit: number
  is_active: boolean
  expires_at: string | null
  last_used: string | null
  created_at: string
}

async function listKeys(): Promise<ExternalApiKey[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('external_api_keys')
    .select('id, name, scopes, rate_limit, is_active, expires_at, last_used, created_at')
    .order('created_at', { ascending: false })
  return (data || []) as ExternalApiKey[]
}

async function createKey(formData: FormData) {
  'use server'
  const name = (formData.get('name') as string) || 'chatgpt-actions'
  const scopes = (formData.getAll('scopes') as string[]).length
    ? (formData.getAll('scopes') as string[])
    : ['posts:read', 'posts:write', 'ai:analyze', 'ai:generate-audio']
  const rateLimit = Number(formData.get('rate_limit') || 100)
  const expiresDaysRaw = formData.get('expires_in_days') as string | null
  const expiresAt = expiresDaysRaw ? new Date(Date.now() + Number(expiresDaysRaw) * 86400000).toISOString() : null

  const apiKey = 'aa_' + randomBytes(24).toString('hex')
  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  const supabase = createServiceClient()
  await supabase
    .from('external_api_keys')
    .insert({ name, key_hash: keyHash, scopes, rate_limit: rateLimit, expires_at: expiresAt, is_active: true })

  return { apiKey }
}

async function toggleKey(id: string, active: boolean) {
  'use server'
  const supabase = createServiceClient()
  await supabase.from('external_api_keys').update({ is_active: active }).eq('id', id)
}

export default async function ExternalKeysPage() {
  const keys = await listKeys()
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">External API Keys</h1>

      <form action={async (formData) => {
        const { apiKey } = await createKey(formData)
        console.log('New API Key (copy now):', apiKey)
      }} className="grid gap-4 border rounded-md p-4 bg-white/50">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" className="mt-1 w-full border rounded px-2 py-1" placeholder="chatgpt-actions" />
        </div>
        <div>
          <label className="block text-sm font-medium">Scopes</label>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            {['posts:read','posts:write','ai:analyze','ai:generate-audio'].map(s => (
              <label key={s} className="inline-flex items-center gap-2">
                <input type="checkbox" name="scopes" value={s} defaultChecked />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Rate limit (req/min)</label>
            <input name="rate_limit" type="number" defaultValue={100} className="mt-1 w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Expires in (days)</label>
            <input name="expires_in_days" type="number" placeholder="e.g. 90" className="mt-1 w-full border rounded px-2 py-1" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="px-3 py-2 rounded bg-black text-white">Create Key</button>
          <span className="text-sm text-gray-600">The plain key will be printed to server logs once. Copy it immediately.</span>
        </div>
      </form>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Scopes</th>
              <th className="text-left p-2">Rate</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Expires</th>
              <th className="text-left p-2">Last Used</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-t">
                <td className="p-2">{k.name}</td>
                <td className="p-2">{k.scopes.join(', ')}</td>
                <td className="p-2">{k.rate_limit}/min</td>
                <td className="p-2">{k.is_active ? '✔︎' : '—'}</td>
                <td className="p-2">{k.expires_at ? new Date(k.expires_at).toLocaleDateString() : '—'}</td>
                <td className="p-2">{k.last_used ? new Date(k.last_used).toLocaleString() : '—'}</td>
                <td className="p-2">
                  <form action={async () => { await toggleKey(k.id, !k.is_active) }}>
                    <button className="underline text-blue-600" type="submit">
                      {k.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">Note: The plain API key is only shown once (in server logs) when created. Keep it secure.</p>
    </div>
  )
}

