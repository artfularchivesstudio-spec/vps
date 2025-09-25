'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button';

export default function DevAnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/ai/analyze-image', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Analyze failed')
      setResult(data)
    } catch (e: any) {
      setError(e?.message || 'Analyze failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dev Analyze</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing…' : 'Analyze'}
      </Button>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {isAnalyzing && <div className="text-sm text-gray-600">Please wait, analyzing image…</div>}
      {result && (
        <div className="border rounded p-3 text-sm">
          <div className="font-medium">Result</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


