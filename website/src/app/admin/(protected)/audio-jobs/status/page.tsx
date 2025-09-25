'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'

type JobStatus = 'pending' | 'processing' | 'complete' | 'failed'

interface AudioJobStatus {
  id?: string
  status: JobStatus
  audio_url?: string | null
  error_message?: string | null
  progress?: number | null
  updated_at?: string | null
  language_statuses?: Record<string, { status: JobStatus; draft?: boolean }>
}

export default function AudioJobStatusPage() {
  const params = useSearchParams()
  const initialJobId = params?.get('jobId') || (typeof window !== 'undefined' ? localStorage.getItem('lastAudioJobId') : '') || ''
  const [jobId, setJobId] = useState(initialJobId)
  const [status, setStatus] = useState<AudioJobStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const stopAtRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { push } = useToast()

  const pct = useMemo(() => {
    if (typeof status?.progress === 'number') return Math.max(0, Math.min(100, status.progress))
    // derive from language_statuses
    const langs = status?.language_statuses ? Object.values(status.language_statuses) : []
    if (langs.length === 0) return null
    const done = langs.filter(l => l.status === 'complete').length
    return Math.round((done / langs.length) * 100)
  }, [status])

  const fetchStatusOnce = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/audio-job-status/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setStatus(data)
      if (data.status === 'complete') {
        push({ emoji: '✅', title: 'Audio complete', description: 'Your audio is ready', type: 'success' })
      } else if (data.status === 'failed') {
        push({ emoji: '❌', title: 'Audio failed', description: data.error_message || 'Unknown error', type: 'error' })
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch job status')
      push({ emoji: '❌', title: 'Status check failed', description: String(e?.message || e), type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [push])

  const startPolling = useCallback((id: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPolling(true)
    stopAtRef.current = Date.now() + 30 * 60 * 1000 // 30 min
    intervalRef.current = setInterval(async () => {
      if (stopAtRef.current && Date.now() > stopAtRef.current) {
        setPolling(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
        push({ emoji: '⏱️', title: 'Polling timed out', description: 'Try again later', type: 'warning' })
        return
      }
      await fetchStatusOnce(id)
    }, 45000)
  }, [fetchStatusOnce, push])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Audio Job Status</h1>
          <p className="text-sm text-gray-600 mt-1">Paste a Job ID (or the full status URL) to check progress. I’ll remember the last one you checked.</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/40 p-5 mb-6">
          <label className="block text-sm font-medium text-gray-800 mb-2">Job ID or URL</label>
          <div className="flex gap-2">
            <input
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="e.g. 9f1b... or https://.../api/audio-job-status/9f1b..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={async () => {
                let id = jobId.trim()
                if (!id) return
                // If a full URL was pasted, extract trailing ID
                try {
                  if (id.startsWith('http')) {
                    const u = new URL(id)
                    id = u.pathname.split('/').pop() || id
                  }
                } catch {}
                localStorage.setItem('lastAudioJobId', id)
                push({ emoji: '🔎', title: 'Checking status', description: id, type: 'info', durationMs: 1500 })
                await fetchStatusOnce(id)
              }}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow"
            >
              Check
            </button>
            <button
              onClick={() => {
                let id = jobId.trim()
                if (!id) return
                try {
                  if (id.startsWith('http')) {
                    const u = new URL(id)
                    id = u.pathname.split('/').pop() || id
                  }
                } catch {}
                setJobId(id)
                startPolling(id)
                push({ emoji: '🔄', title: 'Polling started', description: 'Every 45 seconds', type: 'info', durationMs: 2000 })
              }}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Poll
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">Tip: You can copy the Job ID from the wizard finalize step or the admin posts table.</div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-800">{error}</div>
        )}

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/40 p-5">
          {isLoading && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></span>
              Fetching status…
            </div>
          )}
          {!status ? (
            <div className="text-sm text-gray-500">No job loaded yet.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <span className="mr-2">Status:</span>
                  <span className="font-medium">
                    {status.status === 'pending' && '⏳ Pending'}
                    {status.status === 'processing' && '🔄 Processing'}
                    {status.status === 'complete' && '✅ Complete'}
                    {status.status === 'failed' && '❌ Failed'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{status.updated_at ? new Date(status.updated_at).toLocaleString() : ''}</div>
              </div>

              {(pct !== null && pct !== undefined) && (
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden" aria-label="progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bg-indigo-600 h-2 transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}

              {status.language_statuses && (
                <div className="text-xs text-gray-700">
                  <div className="font-medium mb-1">Languages</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(status.language_statuses).map(([lang, info]) => (
                      <span key={lang} className="px-2 py-1 rounded-full bg-gray-100">
                        {lang}:{' '}
                        {info.status === 'pending' && '⏳'}
                        {info.status === 'processing' && '🔄'}
                        {info.status === 'complete' && '✅'}
                        {info.status === 'failed' && '❌'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {status.audio_url && (
                <div className="flex items-center gap-2">
                  <a href={status.audio_url} target="_blank" className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">Open Audio</a>
                  <button
                    onClick={() => navigator.clipboard.writeText(status.audio_url || '')}
                    className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200"
                  >
                    Copy URL
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


