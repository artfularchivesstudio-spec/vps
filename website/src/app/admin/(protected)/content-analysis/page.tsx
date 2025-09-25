'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Volume2, 
  Copy, 
  Trash2,
  RefreshCw,
  BarChart3,
  Zap,
  Eye,
  Target,
  Wand2,
  Merge
} from 'lucide-react'

interface ContentIssue {
  type: 'missing_excerpt' | 'missing_content' | 'missing_audio' | 'duplicate' | 'incomplete_content' | 'orphaned_audio' | 'missing_translations' | 'incomplete_multilingual_audio' | 'orphaned_translations'
  severity: 'high' | 'medium' | 'low'
  post_id: string
  title: string
  slug: string
  description: string
  suggested_action: string
  metadata?: any
}

interface AnalysisResult {
  total_posts: number
  issues_found: number
  issues: ContentIssue[]
  summary: {
    missing_excerpts: number
    missing_content: number
    missing_audio: number
    duplicates: number
    incomplete_content: number
    orphaned_audio: number
    missing_translations: number
    incomplete_multilingual_audio: number
    orphaned_translations: number
  }
  recommendations: string[]
}

interface CleanupResult {
  success: boolean
  actions_performed: number
  results: {
    action: string
    post_ids: string[]
    success: boolean
    message: string
    details?: any
  }[]
  errors: string[]
}

const severityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary'
} as const

const issueIcons = {
  missing_excerpt: FileText,
  missing_content: FileText,
  missing_audio: Volume2,
  duplicate: Copy,
  incomplete_content: FileText,
  orphaned_audio: Trash2,
  missing_translations: FileText,
  incomplete_multilingual_audio: Volume2,
  orphaned_translations: Trash2
}

export default function ContentAnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/supabase-functions/content-analysis', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)
      setSelectedIssues(new Set())
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [supabase.auth])

  const performCleanup = async (dryRun = false) => {
    if (selectedIssues.size === 0) {
      setError('Please select issues to fix')
      return
    }

    setIsProcessing(true)
    setError(null)
    setCleanupResult(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Group selected issues by type
      const issuesByType = new Map<string, ContentIssue[]>()
      
      if (analysisResult) {
        for (const issue of analysisResult.issues) {
          const issueKey = `${issue.type}-${issue.post_id}`
          if (selectedIssues.has(issueKey)) {
            if (!issuesByType.has(issue.type)) {
              issuesByType.set(issue.type, [])
            }
            issuesByType.get(issue.type)!.push(issue)
          }
        }
      }

      // Convert to cleanup actions
      const actions = []
      for (const [type, issues] of Array.from(issuesByType.entries())) {
        const postIds = issues.map((issue: ContentIssue) => 
          issue.type === 'orphaned_audio' ? issue.metadata?.audio_job_id : issue.post_id
        ).filter(Boolean)
        
        if (postIds.length > 0) {
          let actionType = type
          if (type === 'missing_excerpt') actionType = 'generate_excerpt'
          else if (type === 'missing_content') actionType = 'generate_content'
          else if (type === 'missing_audio') actionType = 'generate_audio'
          else if (type === 'duplicate') actionType = 'merge_duplicates'
          else if (type === 'incomplete_content') actionType = 'expand_content'
          else if (type === 'orphaned_audio') actionType = 'delete_orphaned_audio'
          else if (type === 'missing_translations') actionType = 'generate_translations'
          else if (type === 'incomplete_multilingual_audio') actionType = 'generate_multilingual_audio'
          else if (type === 'orphaned_translations') actionType = 'delete_orphaned_translations'
          
          actions.push({
            type: actionType,
            post_ids: postIds
          })
        }
      }

      const response = await fetch('/api/supabase-functions/content-cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actions,
          dry_run: dryRun
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Cleanup failed')
      }

      const result: CleanupResult = await response.json()
      setCleanupResult(result)
      
      if (!dryRun && result.success) {
        // Refresh analysis after successful cleanup
        setTimeout(() => runAnalysis(), 1000)
      }
    } catch (err) {
      console.error('Cleanup error:', err)
      setError(err instanceof Error ? err.message : 'Cleanup failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleIssueSelection = (issue: ContentIssue) => {
    const issueKey = `${issue.type}-${issue.post_id}`
    const newSelected = new Set(selectedIssues)
    
    if (newSelected.has(issueKey)) {
      newSelected.delete(issueKey)
    } else {
      newSelected.add(issueKey)
    }
    
    setSelectedIssues(newSelected)
  }

  const selectAllIssues = () => {
    if (!analysisResult) return
    
    const allIssueKeys = analysisResult.issues.map(issue => `${issue.type}-${issue.post_id}`)
    setSelectedIssues(new Set(allIssueKeys))
  }

  const clearSelection = () => {
    setSelectedIssues(new Set())
  }

  // Smart consolidation functions
  const selectDuplicates = () => {
    const duplicateIssues = analysisResult?.issues.filter(issue => issue.type === 'duplicate') || []
    const duplicateIds = new Set(duplicateIssues.map(issue => `${issue.type}-${issue.post_id}`))
    setSelectedIssues(duplicateIds)
  }

  const selectMissingContent = () => {
    const missingContentIssues = analysisResult?.issues.filter(issue => 
      ['missing_excerpt', 'missing_content', 'incomplete_content'].includes(issue.type)
    ) || []
    const missingContentIds = new Set(missingContentIssues.map(issue => `${issue.type}-${issue.post_id}`))
    setSelectedIssues(missingContentIds)
  }

  const selectMissingAudio = () => {
    const missingAudioIssues = analysisResult?.issues.filter(issue => 
      ['missing_audio', 'incomplete_multilingual_audio'].includes(issue.type)
    ) || []
    const missingAudioIds = new Set(missingAudioIssues.map(issue => `${issue.type}-${issue.post_id}`))
    setSelectedIssues(missingAudioIds)
  }

  const selectOrphanedContent = () => {
    const orphanedIssues = analysisResult?.issues.filter(issue => 
      ['orphaned_audio', 'orphaned_translations'].includes(issue.type)
    ) || []
    const orphanedIds = new Set(orphanedIssues.map(issue => `${issue.type}-${issue.post_id}`))
    setSelectedIssues(orphanedIds)
  }

  const performSmartConsolidation = async () => {
    if (!analysisResult) return
    
    setIsProcessing(true)
    try {
      // Group issues by type and create optimized cleanup actions
      const actions = []
      
      // Handle duplicates first
      const duplicates = analysisResult.issues.filter(issue => issue.type === 'duplicate')
      if (duplicates.length > 0) {
        const duplicateGroups = new Map()
        duplicates.forEach(issue => {
          const key = issue.metadata?.duplicate_of || issue.title
          if (!duplicateGroups.has(key)) {
            duplicateGroups.set(key, [])
          }
          duplicateGroups.get(key).push(issue.post_id)
        })
        
        duplicateGroups.forEach(postIds => {
          if (postIds.length > 1) {
            actions.push({
              type: 'merge_duplicates',
              post_ids: postIds
            })
          }
        })
      }
      
      // Handle missing content
      const missingExcerpts = analysisResult.issues.filter(issue => issue.type === 'missing_excerpt')
      if (missingExcerpts.length > 0) {
        actions.push({
          type: 'generate_excerpt',
          post_ids: missingExcerpts.map(issue => issue.post_id)
        })
      }
      
      // Handle missing audio
      const missingAudio = analysisResult.issues.filter(issue => issue.type === 'missing_audio')
      if (missingAudio.length > 0) {
        actions.push({
          type: 'generate_audio',
          post_ids: missingAudio.map(issue => issue.post_id)
        })
      }
      
      // Handle orphaned content
      const orphanedAudio = analysisResult.issues.filter(issue => issue.type === 'orphaned_audio')
      if (orphanedAudio.length > 0) {
        actions.push({
          type: 'delete_orphaned_audio',
          post_ids: orphanedAudio.map(issue => issue.post_id)
        })
      }
      
      const orphanedTranslations = analysisResult.issues.filter(issue => issue.type === 'orphaned_translations')
      if (orphanedTranslations.length > 0) {
        actions.push({
          type: 'delete_orphaned_translations',
          post_ids: orphanedTranslations.map(issue => issue.post_id)
        })
      }
      
      if (actions.length === 0) {
        alert('No consolidation actions needed')
        return
      }
      
      const response = await fetch('/api/supabase-functions/content-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actions })
      })
      
      if (!response.ok) {
        throw new Error('Failed to perform smart consolidation')
      }
      
      const result = await response.json()
      setCleanupResult(result)
      
      // Refresh analysis after cleanup
      await runAnalysis()
      
    } catch (error) {
      console.error('Smart consolidation failed:', error)
      alert('Smart consolidation failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const performBulkAudioGeneration = async () => {
    if (!analysisResult) return
    
    const missingAudioIssues = analysisResult.issues.filter(issue => 
      ['missing_audio', 'incomplete_multilingual_audio'].includes(issue.type)
    )
    
    if (missingAudioIssues.length === 0) {
      alert('No posts with missing audio found')
      return
    }
    
    const confirmed = confirm(`Generate audio for ${missingAudioIssues.length} posts? This may take several minutes.`)
    if (!confirmed) return
    
    setIsProcessing(true)
    try {
      const actions = []
      
      // Group by audio type
      const missingAudio = missingAudioIssues.filter(issue => issue.type === 'missing_audio')
      const incompleteMultilingual = missingAudioIssues.filter(issue => issue.type === 'incomplete_multilingual_audio')
      
      if (missingAudio.length > 0) {
        actions.push({
          type: 'generate_audio',
          post_ids: missingAudio.map(issue => issue.post_id)
        })
      }
      
      if (incompleteMultilingual.length > 0) {
        actions.push({
          type: 'generate_multilingual_audio',
          post_ids: incompleteMultilingual.map(issue => issue.post_id)
        })
      }
      
      const response = await fetch('/api/supabase-functions/content-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actions })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate bulk audio')
      }
      
      const result = await response.json()
      setCleanupResult(result)
      
      // Refresh analysis after cleanup
      await runAnalysis()
      
    } catch (error) {
      console.error('Bulk audio generation failed:', error)
      alert('Bulk audio generation failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    // Run initial analysis on page load
    runAnalysis()
  }, [runAnalysis])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Analysis & Cleanup</h1>
          <p className="text-muted-foreground mt-2">
            Analyze your blog content for issues and perform bulk cleanup operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAnalysis} 
            disabled={isAnalyzing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="space-y-6">
          {/* Content Health Overview */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Content Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(((analysisResult.total_posts - analysisResult.issues_found) / analysisResult.total_posts) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Content Health Score</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round(((analysisResult.total_posts - analysisResult.issues_found) / analysisResult.total_posts) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Completion Status */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analysisResult.total_posts - analysisResult.issues_found}/{analysisResult.total_posts}
                  </div>
                  <p className="text-sm text-muted-foreground">Complete Posts</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analysisResult.issues_found} posts need attention
                  </div>
                </div>
                
                {/* Priority Issues */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {analysisResult.issues.filter(issue => issue.severity === 'high').length}
                  </div>
                  <p className="text-sm text-muted-foreground">High Priority Issues</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analysisResult.issues.filter(issue => issue.severity === 'medium').length} medium, {analysisResult.issues.filter(issue => issue.severity === 'low').length} low
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.total_posts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{analysisResult.issues_found}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Missing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {(analysisResult.summary.missing_excerpts || 0) + (analysisResult.summary.missing_content || 0) + (analysisResult.summary.incomplete_content || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Missing Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(analysisResult.summary.missing_audio || 0) + (analysisResult.summary.incomplete_multilingual_audio || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{analysisResult.summary.duplicates}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orphaned Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {(analysisResult.summary.orphaned_audio || 0) + (analysisResult.summary.orphaned_translations || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {cleanupResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {cleanupResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Cleanup Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Actions performed: {cleanupResult.actions_performed}</p>
              {cleanupResult.errors.length > 0 && (
                <div>
                  <p className="font-medium text-red-600">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {cleanupResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-1">
                {cleanupResult.results.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>{result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">Issues ({analysisResult.issues_found})</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            {analysisResult.issues_found > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Bulk Actions</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={selectAllIssues}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSelection}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Selected: {selectedIssues.size} issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Smart Consolidation Actions */}
                    <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        Smart Consolidation
                      </h4>
                      <div className="flex flex-wrap gap-2">
                         <Button 
                           onClick={performSmartConsolidation}
                           disabled={isProcessing || !analysisResult?.issues.length}
                           variant="default"
                           size="sm"
                           className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                         >
                           <Target className="h-4 w-4 mr-2" />
                           Auto-Fix All Issues
                         </Button>
                         <Button 
                           onClick={performBulkAudioGeneration}
                           disabled={isProcessing || !analysisResult?.issues.some(issue => ['missing_audio', 'incomplete_multilingual_audio'].includes(issue.type))}
                           variant="default"
                           size="sm"
                           className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                         >
                           <Volume2 className="h-4 w-4 mr-2" />
                           Bulk Audio Generation
                         </Button>
                       </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Automatically consolidates duplicates, generates missing content, and cleans up orphaned files
                      </p>
                    </div>

                    {/* Category Selection */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3">Select by Category</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={selectDuplicates}
                          disabled={isProcessing}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicates ({analysisResult?.summary.duplicates || 0})
                        </Button>
                        <Button 
                          onClick={selectMissingContent}
                          disabled={isProcessing}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Missing Content ({(analysisResult?.summary.missing_excerpts || 0) + (analysisResult?.summary.missing_content || 0) + (analysisResult?.summary.incomplete_content || 0)})
                        </Button>
                        <Button 
                          onClick={selectMissingAudio}
                          disabled={isProcessing}
                          variant="outline"
                          size="sm"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          Missing Audio ({(analysisResult?.summary.missing_audio || 0) + (analysisResult?.summary.incomplete_multilingual_audio || 0)})
                        </Button>
                        <Button 
                          onClick={selectOrphanedContent}
                          disabled={isProcessing}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Orphaned ({(analysisResult?.summary.orphaned_audio || 0) + (analysisResult?.summary.orphaned_translations || 0)})
                        </Button>
                      </div>
                    </div>

                    {/* Manual Actions */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => performCleanup(true)}
                        disabled={isProcessing || selectedIssues.size === 0}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Changes
                      </Button>
                    <Button 
                      onClick={() => performCleanup(false)}
                      disabled={isProcessing || selectedIssues.size === 0}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Apply Fixes'}
                    </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {analysisResult.issues.map((issue, index) => {
                const IconComponent = issueIcons[issue.type]
                const issueKey = `${issue.type}-${issue.post_id}`
                const isSelected = selectedIssues.has(issueKey)
                
                return (
                  <Card key={index} className={`transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleIssueSelection(issue)}
                          className="rounded border-gray-300"
                        />
                        <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{issue.title}</h3>
                            <Badge variant={severityColors[issue.severity]}>
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline">
                              {issue.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.description}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            Suggested: {issue.suggested_action}
                          </p>
                          {issue.metadata && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer">Metadata</summary>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(issue.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Missing Excerpts</p>
                    <p className="text-2xl font-bold text-orange-600">{analysisResult.summary.missing_excerpts}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Missing Content</p>
                    <p className="text-2xl font-bold text-red-600">{analysisResult.summary.missing_content}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Missing Audio</p>
                    <p className="text-2xl font-bold text-orange-600">{analysisResult.summary.missing_audio}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Duplicates</p>
                    <p className="text-2xl font-bold text-yellow-600">{analysisResult.summary.duplicates}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Incomplete Content</p>
                    <p className="text-2xl font-bold text-yellow-600">{analysisResult.summary.incomplete_content}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Orphaned Audio</p>
                    <p className="text-2xl font-bold text-gray-600">{analysisResult.summary.orphaned_audio}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Missing Translations</p>
                    <p className="text-2xl font-bold text-orange-600">{analysisResult.summary.missing_translations}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Incomplete Multilingual Audio</p>
                    <p className="text-2xl font-bold text-pink-600">{analysisResult.summary.incomplete_multilingual_audio}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Orphaned Translations</p>
                    <p className="text-2xl font-bold text-indigo-600">{analysisResult.summary.orphaned_translations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Suggested actions to improve your content quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
