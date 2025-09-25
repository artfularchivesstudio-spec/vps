'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { BlogPost } from "@/types/blog";
import { Badge } from '@/components/ui/Badge';
import { Progress } from "@/components/ui/Progress";

type WorkflowStage = 'draft' | 'in-review' | 'translation' | 'audio' | 'published'

interface PostWorkflow {
  current_stage: WorkflowStage
  stages: Record<WorkflowStage, {
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    quality_score?: number
    notes?: string
  }>
}

interface PublishingPipelineProps {
  className?: string
}

const DUMMY_POSTS: (BlogPost & { workflow: PostWorkflow })[] = [
  {
    id: "1",
    title: "The Alchemist of Colors",
    status: "draft",
    content: "The old man mixed powders with silent grace...",
    excerpt: "A story of art and magic.",
    slug: "the-alchemist-of-colors",
    author_id: 1,
    created_at: "2023-10-27T10:00:00Z",
    updated_at: "2023-10-27T10:00:00Z",
    published_at: null,
    featured_image_url: "/placeholder-1.jpg",
    template_type: "standard",
    reading_time: 3,
    revision_number: 1,
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      meta_description: "A story of art and magic.",
      og_title: "The Alchemist of Colors",
      og_description: "A story of art and magic.",
      twitter_title: "The Alchemist of Colors",
      twitter_description: "A story of art and magic."
    },
    workflow: {
      current_stage: "draft",
      stages: {
        draft: { status: "completed" },
        "in-review": { status: "pending" },
        translation: { status: "pending" },
        audio: { status: "pending" },
        published: { status: "pending" },
      },
    },
  },
  {
    id: "2",
    title: "Symphony in Blue and Gold",
    status: "draft",
    content: "The canvas was a storm of emotion...",
    excerpt: "A critique of a modern masterpiece.",
    slug: "symphony-in-blue-and-gold",
    author_id: 2,
    created_at: "2023-10-26T15:30:00Z",
    updated_at: "2023-10-26T15:30:00Z",
    published_at: null,
    featured_image_url: "/placeholder-2.jpg",
    template_type: "standard",
    reading_time: 5,
    revision_number: 1,
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      meta_description: "A critique of a modern masterpiece.",
      og_title: "Symphony in Blue and Gold",
      og_description: "A critique of a modern masterpiece.",
      twitter_title: "Symphony in Blue and Gold",
      twitter_description: "A critique of a modern masterpiece."
    },
    workflow: {
      current_stage: "in-review",
      stages: {
        draft: { status: "completed" },
        "in-review": { status: "in_progress" },
        translation: { status: "pending" },
        audio: { status: "pending" },
        published: { status: "pending" },
      },
    }
  },
  {
    id: "3",
    title: "Echoes of the Future",
    status: "draft",
    content: "The sculpture defied gravity, speaking of tomorrow.",
    excerpt: "A look into avant-garde installations.",
    slug: "echoes-of-the-future",
    author_id: 1,
    created_at: "2023-10-25T11:00:00Z",
    updated_at: "2023-10-25T11:00:00Z",
    published_at: "2023-10-25T12:00:00Z",
    featured_image_url: "/placeholder-3.jpg",
    template_type: "standard",
    reading_time: 4,
    revision_number: 1,
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      meta_description: "A look into avant-garde installations.",
      og_title: "Echoes of the Future",
      og_description: "A look into avant-garde installations.",
      twitter_title: "Echoes of the Future",
      twitter_description: "A look into avant-garde installations."
    },
    workflow: {
      current_stage: "translation",
      stages: {
        draft: { status: "completed" },
        "in-review": { status: "completed" },
        translation: { status: "in_progress" },
        audio: { status: "pending" },
        published: { status: "pending" },
      },
    }
  },
  {
    id: "4",
    title: "The Weaver's Tale",
    status: "published",
    content: "Threads of destiny were woven into the tapestry.",
    excerpt: "The narrative power of textile art.",
    slug: "the-weavers-tale",
    author_id: 3,
    created_at: "2023-10-24T18:00:00Z",
    updated_at: "2023-10-24T18:00:00Z",
    published_at: "2023-10-24T19:00:00Z",
    featured_image_url: "/placeholder-4.jpg",
    template_type: "standard",
    reading_time: 6,
    revision_number: 1,
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      meta_description: "The narrative power of textile art.",
      og_title: "The Weaver's Tale",
      og_description: "The narrative power of textile art.",
      twitter_title: "The Weaver's Tale",
      twitter_description: "The narrative power of textile art."
    },
    workflow: {
      current_stage: "audio",
      stages: {
        draft: { status: "completed" },
        "in-review": { status: "completed" },
        translation: { status: "completed" },
        audio: { status: "in_progress" },
        published: { status: "pending" },
      },
    }
  },
  {
    id: "5",
    title: "Chronicles of a Digital Brush",
    status: "published",
    content: "Pixels danced to a silent rhythm, creating worlds.",
    excerpt: "Exploring the rise of digital art.",
    slug: "chronicles-of-a-digital-brush",
    author_id: 2,
    created_at: "2023-10-23T09:00:00Z",
    updated_at: "2023-10-23T09:00:00Z",
    published_at: "2023-10-23T09:30:00Z",
    featured_image_url: "/placeholder-5.jpg",
    template_type: "standard",
    reading_time: 7,
    revision_number: 1,
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      meta_description: "Exploring the rise of digital art.",
      og_title: "Chronicles of a Digital Brush",
      og_description: "Exploring the rise of digital art.",
      twitter_title: "Chronicles of a Digital Brush",
      twitter_description: "Exploring the rise of digital art."
    },
    workflow: {
      current_stage: "published",
      stages: {
        draft: { status: "completed" },
        "in-review": { status: "completed" },
        translation: { status: "completed" },
        audio: { status: "completed" },
        published: { status: "completed" },
      },
    }
  },
]

const WORKFLOW_STEPS: { stage: WorkflowStage; name: string }[] = [
  { stage: 'draft', name: 'Drafting' },
  { stage: 'in-review', name: 'Review' },
  { stage: 'translation', name: 'Translation' },
  { stage: 'audio', name: 'Audio Generation' },
  { stage: 'published', name: 'Published' },
]

export default function PublishingPipeline({ className }: PublishingPipelineProps) {
  const [posts, setPosts] = useState<(BlogPost & { workflow: PostWorkflow })[]>(DUMMY_POSTS)
  const [selectedPostId, setSelectedPostId] = useState<string | number | null>(null)
  
  const getStageProgress = (stage: WorkflowStage, workflow?: PostWorkflow) => {
    if (!workflow) return 0;
    const stageData = workflow.stages[stage];
    if (stageData?.status === 'completed') return 100;
    if (stageData?.status === 'in_progress') return 50;
    return 0;
  }

  const getStageStatus = (stage: WorkflowStage, workflow?: PostWorkflow) => {
    if (!workflow) return 'pending';
    return workflow.stages[stage]?.status || 'pending';
  }

  const updateWorkflowStage = async (postId: string, stage: WorkflowStage, updates: any) => {
    setPosts(currentPosts => {
      return currentPosts.map(p => {
        if (p.id === postId && p.workflow) {
          return {
            ...p,
            workflow: {
              ...p.workflow,
              stages: {
                ...p.workflow.stages,
                [stage]: { ...p.workflow.stages[stage], ...updates }
              }
            }
          }
        }
        return p
      })
    })
  }

  const moveToNextStage = useCallback((postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post?.workflow) return;

    const currentIndex = WORKFLOW_STEPS.findIndex(step => step.stage === post.workflow!.current_stage);
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      const nextStage = WORKFLOW_STEPS[currentIndex + 1];
      setPosts(currentPosts =>
        currentPosts.map(p =>
          p.id === postId && p.workflow
            ? { ...p, workflow: { ...p.workflow, current_stage: nextStage.stage } }
            : p
        )
      )
    }
  }, [posts])

  const pipelineStats = useMemo(() => {
    const stats = WORKFLOW_STEPS.reduce((acc, step) => {
      acc[step.stage] = { count: 0, quality: 0 };
      return acc;
    }, {} as Record<WorkflowStage, any>);

    posts.forEach(post => {
      if (post.workflow) {
        WORKFLOW_STEPS.forEach(step => {
          const status = getStageStatus(step.stage, post.workflow);
          if (status === 'completed' || status === 'in_progress') {
            stats[step.stage].count += 1;
          }
        });
      }
    });
    return stats;
  }, [posts]);

  const selectedPost = useMemo(() => {
    return posts.find(p => p.id === selectedPostId) || null
  }, [posts, selectedPostId])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Publishing Pipeline</CardTitle>
        <CardDescription>
          An overview of all content currently in the production workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-5 gap-4 text-center">
          {WORKFLOW_STEPS.map(step => (
            <div key={step.stage} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800">{step.name}</h4>
              <p className="text-2xl font-bold text-purple-600">{pipelineStats[step.stage]?.count || 0}</p>
            </div>
          ))}
        </div>

        {/* Posts Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 divide-y">
            <div className="grid grid-cols-12 p-4 font-semibold bg-gray-50">
              <div className="col-span-4">Title</div>
              <div className="col-span-6">Workflow Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {posts.filter(post => post.workflow?.current_stage !== 'published').slice(0, 10).map(post => (
                <div key={post.id} className="grid grid-cols-12 p-4 items-center">
                  <div className="col-span-4">
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-sm text-gray-500">
                      Current: {WORKFLOW_STEPS.find(s => s.stage === post.workflow?.current_stage)?.name}
                    </p>
                  </div>
                  <div className="col-span-6">
                    <div className="flex items-center space-x-2">
                      {WORKFLOW_STEPS.map((step, index) => (
                        <React.Fragment key={step.stage}>
                          <div className="flex flex-col items-center">
                            <div
                              className={classNames(
                                "w-6 h-6 rounded-full flex items-center justify-center text-white",
                                getStageStatus(step.stage, post.workflow) === 'completed' ? 'bg-green-500' :
                                getStageStatus(step.stage, post.workflow) === 'in_progress' ? 'bg-yellow-500' :
                                getStageStatus(step.stage, post.workflow) === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                              )}
                            >
                              {getStageStatus(step.stage, post.workflow) === 'completed' && '✓'}
                              {getStageStatus(step.stage, post.workflow) === 'failed' && '!'}
                            </div>
                            <p className="text-xs mt-1">{step.name}</p>
                          </div>
                          {index < WORKFLOW_STEPS.length - 1 && (
                            <div className="flex-1 h-1">
                              <div className={classNames(
                                "h-full rounded-full",
                                getStageStatus(step.stage, post.workflow) === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                              )}></div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPostId(post.id)}>
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setSelectedPostId(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <Card
                className="w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
              <CardHeader>
                <CardTitle>{selectedPost.title}</CardTitle>
                <CardDescription>
                  Detailed view of the publishing workflow for this post.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm text-gray-600">Current stage: {selectedPost.workflow?.current_stage}</p>
                  <div className="mt-4 space-y-4">
                    {WORKFLOW_STEPS.map((step) => {
                      const stageData = selectedPost.workflow?.stages[step.stage];
                      const isActive = selectedPost.workflow?.current_stage === step.stage;
                      return (
                        <div key={step.stage} className={classNames("p-4 rounded-lg", isActive ? "bg-purple-50 border border-purple-200" : "bg-gray-50")}>
                          <h4 className="font-semibold">{step.name}</h4>
                          <p>Status: {stageData?.status || 'pending'}</p>
                          {stageData?.quality_score && <p>Quality Score: {stageData.quality_score}</p>}
                          {stageData?.notes && <p className="text-sm mt-1 italic">Notes: {stageData.notes}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                  <Button variant="outline" onClick={() => setSelectedPostId(null)}>Close</Button>
                  <Button 
                    onClick={() => moveToNextStage(selectedPost.id as string)}
                    disabled={selectedPost.workflow?.current_stage === 'published'}
                  >
                    Move to Next Stage
                  </Button>
              </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
