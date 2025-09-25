'use client';

import { useState, useEffect } from 'react';
import { healthCheck, getBlogPosts, getFeaturedPosts, getBlogCategories } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface HealthCheckResult {
  strapi: 'healthy' | 'unhealthy' | 'unknown';
  wordpress: 'healthy' | 'unhealthy' | 'unknown';
  primarySource: string;
  stats?: any;
}

export default function StrapiTestPage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setLoading(true);
    setTesting(true);

    try {
      // Test health check
      console.log('Testing health check...');
      const healthResult = await healthCheck();
      setHealth(healthResult);

      // Test blog posts
      console.log('Testing blog posts...');
      const postsResult = await getBlogPosts(1, 5);
      setPosts(postsResult.posts || []);

      // Test featured posts
      console.log('Testing featured posts...');
      const featuredResult = await getFeaturedPosts();
      setFeaturedPosts(featuredResult || []);

      // Test categories
      console.log('Testing categories...');
      const categoriesResult = await getBlogCategories();
      setCategories(categoriesResult || []);

    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Strapi CMS Integration Test</h1>
          <p className="text-gray-600 mb-6">
            Test the Strapi CMS integration and fallback to WordPress API.
          </p>
          
          <Button
            onClick={runTests}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Run Tests Again'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Health Check */}
            <Card>
              <CardHeader>
                <CardTitle>Health Check</CardTitle>
              </CardHeader>
              <CardContent>
              {health && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Strapi CMS</CardTitle>
                        <Badge variant={health.strapi === 'healthy' ? 'default' : 'destructive'}>
                          {health.strapi}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-600">Self-hosted CMS</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">WordPress</CardTitle>
                        <Badge variant={health.wordpress === 'healthy' ? 'default' : 'destructive'}>
                          {health.wordpress}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-600">Fallback API</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Primary Source</CardTitle>
                        <Badge variant="secondary">
                          {health.primarySource}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-600">Active data source</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {health.stats && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2">Strapi Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Articles:</span>
                          <span className="ml-2 font-medium">{health.stats.articles}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Categories:</span>
                          <span className="ml-2 font-medium">{health.stats.categories}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tags:</span>
                          <span className="ml-2 font-medium">{health.stats.tags}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Authors:</span>
                          <span className="ml-2 font-medium">{health.stats.authors}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </CardContent>
            </Card>

            {/* Blog Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Blog Posts ({posts.length})</CardTitle>
              </CardHeader>
              <CardContent>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <div key={post.id || index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium text-lg">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mt-1">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>ID: {post.id}</span>
                        <span>Slug: {post.slug}</span>
                        {post.author && <span>Author: {post.author.name}</span>}
                        {post.metaData && <span>Source: {post.metaData.source}</span>}
                      </div>
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {post.categories.map((cat: any, i: number) => (
                            <Badge key={i} variant="secondary">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No posts found.</p>
              )}
              </CardContent>
            </Card>

            {/* Featured Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Posts ({featuredPosts.length})</CardTitle>
              </CardHeader>
              <CardContent>
              {featuredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredPosts.map((post, index) => (
                    <Card key={post.id || index}>
                      <CardHeader>
                        <CardTitle className="text-base">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                      {post.featuredImage && (
                        <div className="mt-2 text-sm text-green-600">✓ Has featured image</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {post.metaData && <span>Source: {post.metaData.source}</span>}
                      </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No featured posts found.</p>
              )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories ({categories.length})</CardTitle>
              </CardHeader>
              <CardContent>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, index) => (
                    <Badge key={cat.id || index} variant="outline">{cat.name}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No categories found.</p>
              )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}