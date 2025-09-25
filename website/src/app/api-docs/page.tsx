'use client';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎭 Artful Archives API</h1>
          <p className="text-purple-200 text-lg">Welcome to our digital museum&apos;s API documentation</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <h2 className="text-xl font-semibold">API Documentation</h2>
            <p className="text-purple-100 text-sm mt-1">Interactive API explorer</p>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📋 API Resources</h3>
              <p className="text-gray-600 mb-3">
                Explore our comprehensive API for content management and audio generation:
              </p>
              <ul className="list-disc list-inside mt-3 text-gray-600 space-y-1">
                <li>Download the OpenAPI specification: <a href="/openapi.yaml" className="text-purple-600 hover:underline">openapi.yaml</a></li>
                <li>Import it into your favorite API client (Postman, Insomnia, etc.)</li>
                <li>Explore our endpoints for blog posts, audio generation, and media management</li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Blog Posts API</h4>
                <p className="text-blue-600 text-sm">Create, read, update, and delete blog posts with multilingual support</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">🎵 Audio Generation</h4>
                <p className="text-green-600 text-sm">Generate multilingual audio narrations for your content</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">🖼️ Media Assets</h4>
                <p className="text-orange-600 text-sm">Manage images, audio files, and other media resources</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">🤖 AI Analysis</h4>
                <p className="text-purple-600 text-sm">Analyze artwork and generate content using AI</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">🚀 Getting Started</h4>
              <p className="text-yellow-700 text-sm mb-2">
                To use our API, you&apos;ll need an API key. Contact our team for access.
              </p>
              <div className="bg-yellow-100 rounded p-3 mt-3">
                <code className="text-sm text-yellow-800">
                  curl -H &quot;Authorization: Bearer YOUR_API_KEY&quot; https://api.artfularchives.studio/posts
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
