'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RecoverPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('fallen tree')
  const [recoveryForm, setRecoveryForm] = useState({
    title: 'The Fallen Tree Bridge',
    content: '',
    slug: 'the-fallen-tree-bridge',
    imageUrl: '',
    audioUrl: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/debug/check-missing-posts?search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      setDebugData(data)
      
      if (!data.success) {
        setMessage({ type: 'error', text: 'Failed to run diagnostics' })
      }
    } catch (error) {
      console.error('Diagnostic error:', error)
      setMessage({ type: 'error', text: 'Failed to run diagnostics' })
    } finally {
      setLoading(false)
    }
  }

  const recoverPost = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/debug/check-missing-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recoveryForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Post recovered successfully! Redirecting...' })
        setTimeout(() => {
          router.push(`/admin/posts/${data.post.id}`)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to recover post' })
      }
    } catch (error) {
      console.error('Recovery error:', error)
      setMessage({ type: 'error', text: 'Failed to recover post' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/posts" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Back to Posts
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Recover Missing Posts</h1>
          <p className="mt-2 text-gray-600">
            Diagnose and recover posts created through ChatGPT that aren&apos;t showing in the admin dashboard
          </p>
        </div>

        {/* Diagnostic Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Run Diagnostics</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search term (e.g., 'fallen tree')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Database'}
            </button>
          </div>

          {debugData && (
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>Total posts found: {debugData.summary?.totalPostsFound || 0}</p>
                <p>Orphaned audio files: {debugData.summary?.orphanedAudioCount || 0}</p>
                <p>Active API keys: {debugData.summary?.activeApiKeysCount || 0}</p>
              </div>

              {debugData.results?.byTitle?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Posts Found by Title</h3>
                  {debugData.results.byTitle.map((post: any) => (
                    <div key={post.id} className="mb-2 p-2 bg-white rounded">
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-gray-600">
                        Status: {post.status} | Created: {new Date(post.created_at).toLocaleString()}
                      </p>
                      <Link 
                        href={`/admin/posts/${post.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        View in Admin →
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {debugData.results?.orphanedAudio?.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Orphaned Audio Files</h3>
                  {debugData.results.orphanedAudio.map((audio: any) => (
                    <div key={audio.id} className="mb-2 p-2 bg-white rounded">
                      <p className="text-sm">{audio.title}</p>
                      <p className="text-xs text-gray-600">Created: {new Date(audio.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {debugData.results?.recentApiCalls?.length > 0 && (
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Recent API Calls</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1">Method</th>
                          <th className="text-left py-1">Path</th>
                          <th className="text-left py-1">Status</th>
                          <th className="text-left py-1">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.results.recentApiCalls.slice(0, 5).map((log: any) => (
                          <tr key={log.id} className="border-b">
                            <td className="py-1">{log.method}</td>
                            <td className="py-1">{log.path}</td>
                            <td className="py-1">{log.status_code}</td>
                            <td className="py-1">{new Date(log.created_at).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recovery Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Manually Recover Post</h2>
          <p className="text-gray-600 mb-4">
            If the post wasn&apos;t found above, you can manually recreate it from the ChatGPT conversation.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={recoveryForm.title}
                onChange={(e) => setRecoveryForm({ ...recoveryForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={recoveryForm.slug}
                onChange={(e) => setRecoveryForm({ ...recoveryForm, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (paste from ChatGPT)</label>
              <textarea
                value={recoveryForm.content}
                onChange={(e) => setRecoveryForm({ ...recoveryForm, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Paste the full story content here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL (optional)</label>
              <input
                type="url"
                value={recoveryForm.imageUrl}
                onChange={(e) => setRecoveryForm({ ...recoveryForm, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL (optional)</label>
              <input
                type="url"
                value={recoveryForm.audioUrl}
                onChange={(e) => setRecoveryForm({ ...recoveryForm, audioUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={recoverPost}
              disabled={loading || !recoveryForm.title || !recoveryForm.content}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Recovering...' : 'Recover Post'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Why Posts May Not Appear</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• <strong>API Key Issues:</strong> ChatGPT may be using an outdated or incorrect API key</li>
            <li>• <strong>Wrong Endpoint:</strong> The post might have been created via a different API endpoint</li>
            <li>• <strong>User ID Mismatch:</strong> Posts created with a different user ID may not show in your view</li>
            <li>• <strong>Database Sync:</strong> There might be a delay in database synchronization</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3">How to Fix Going Forward</h3>
          <ol className="space-y-2 text-gray-700">
            <li>1. Ensure ChatGPT is using the correct API key: <code className="bg-white px-2 py-1 rounded">chatgpt-actions-key-2025-SmL72KtB5WzgVbU</code></li>
            <li>2. Verify the endpoint is: <code className="bg-white px-2 py-1 rounded">POST /api/external/posts</code></li>
            <li>3. Check that the post status is set to &apos;published&apos; or &apos;draft&apos;</li>
            <li>4. Confirm the API response shows success and returns the post ID</li>
          </ol>
        </div>
      </div>
    </div>
  )
}