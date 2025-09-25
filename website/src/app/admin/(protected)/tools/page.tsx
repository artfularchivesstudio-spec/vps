'use client'

import { BlogPost } from '@/types/blog';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PlayCircle, Save, Globe, Search, Star, BookOpen, Code, BarChart3, Play, RotateCcw } from 'lucide-react';

// This is the main page for the admin tools section.
// It allows for bulk operations on posts, such as generating audio,
// translating content, and clearing Redis cache.

export default function AdminToolsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  // Fetch posts on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/admin/posts');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, []);

  const handleCheckboxChange = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🛠️ Admin Tools</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>
            Select posts and perform bulk operations like audio generation, translation, or cache clearing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={post.id}
                  checked={selectedPosts.includes(post.id)}
                  onChange={() => handleCheckboxChange(post.id)}
                  className="rounded"
                />
                <label htmlFor={post.id} className="text-sm font-medium">
                  {post.title}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex space-x-2">
            <Button 
               onClick={() => alert("Feature coming soon! Bulk operations will be available soon.")}
               disabled={selectedPosts.length === 0}
             >
              Generate Audio
            </Button>
            <Button 
              variant="outline"
              onClick={() => alert("Feature coming soon! Translation features will be available soon.")}
              disabled={selectedPosts.length === 0}
            >
              Translate
            </Button>
          </div>
        </CardFooter>
      </Card>
     </div>
  );
}
