'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

type WorkflowStage = 'draft' | 'review' | 'translation' | 'audio' | 'published'

interface WorkflowStatusManagerProps {
  post: {
    id: string
    title: string
    workflow_stage?: WorkflowStage
    status: string
  }
  onUpdate?: (postId: string, newStage: WorkflowStage) => void
  onClose?: () => void
}

const WORKFLOW_STAGES = [
  { 
    stage: 'draft' as WorkflowStage, 
    name: 'Draft', 
    icon: '📝', 
    color: 'bg-gray-500',
    description: 'Content creation and initial writing'
  },
  { 
    stage: 'review' as WorkflowStage, 
    name: 'Review', 
    icon: '👀', 
    color: 'bg-yellow-500',
    description: 'Editorial review and content approval'
  },
  { 
    stage: 'translation' as WorkflowStage, 
    name: 'Translation', 
    icon: '🌐', 
    color: 'bg-blue-500',
    description: 'Multi-language content translation'
  },
  { 
    stage: 'audio' as WorkflowStage, 
    name: 'Audio', 
    icon: '🎵', 
    color: 'bg-purple-500',
    description: 'Audio generation and subtitle creation'
  },
  { 
    stage: 'published' as WorkflowStage, 
    name: 'Published', 
    icon: '🚀', 
    color: 'bg-green-500',
    description: 'Content live and available to users'
  }
]

export default function WorkflowStatusManager({ 
  post, 
  onUpdate, 
  onClose 
}: WorkflowStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStage, setSelectedStage] = useState<WorkflowStage>(post.workflow_stage || 'draft')
  const [notes, setNotes] = useState('')
  
  const supabase = createClient()

  const updateWorkflowStage = async (newStage: WorkflowStage) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          workflow_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)

      if (error) {
        console.error('Error updating workflow stage:', error)
        return
      }

      // Update local state
      setSelectedStage(newStage)
      onUpdate?.(post.id, newStage)
      
    } catch (error) {
      console.error('Error updating workflow stage:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStageIndex = (stage: WorkflowStage) => {
    return WORKFLOW_STAGES.findIndex(s => s.stage === stage)
  }

  const canAdvanceToStage = (targetStage: WorkflowStage) => {
    const currentIndex = getStageIndex(selectedStage)
    const targetIndex = getStageIndex(targetStage)
    return targetIndex <= currentIndex + 1
  }

  const advanceToNextStage = () => {
    const currentIndex = getStageIndex(selectedStage)
    if (currentIndex < WORKFLOW_STAGES.length - 1) {
      const nextStage = WORKFLOW_STAGES[currentIndex + 1].stage
      updateWorkflowStage(nextStage)
    }
  }

  const canAdvanceToNext = () => {
    const currentIndex = getStageIndex(selectedStage)
    return currentIndex < WORKFLOW_STAGES.length - 1
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Workflow Management</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage the publishing workflow for: <span className="font-medium">{post.title}</span>
        </p>
      </div>

      {/* Current Stage Status */}
      <Alert>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">
              {WORKFLOW_STAGES.find(s => s.stage === selectedStage)?.icon}
            </span>
          </div>
          <div className="flex-1">
            <AlertTitle>
              Current Stage: {WORKFLOW_STAGES.find(s => s.stage === selectedStage)?.name}
            </AlertTitle>
            <AlertDescription>
              {WORKFLOW_STAGES.find(s => s.stage === selectedStage)?.description}
            </AlertDescription>
          </div>
          {canAdvanceToNext() && (
            <Button
              onClick={advanceToNextStage}
              disabled={isUpdating}
              size="sm"
            >
              {isUpdating ? 'Updating...' : 'Advance'}
            </Button>
          )}
        </div>
      </Alert>

      {/* Workflow Progress */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Workflow Progress</h4>
        <div className="space-y-3">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isActive = selectedStage === stage.stage
            const isPassed = getStageIndex(selectedStage) > index
            const isAccessible = canAdvanceToStage(stage.stage)

            return (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  isActive ? 'border-blue-500 bg-blue-50' : 
                  isPassed ? 'border-green-500 bg-green-50' : 
                  isAccessible ? 'border-gray-200 hover:border-gray-300' : 'border-gray-200 opacity-50'
                }`}
                onClick={() => isAccessible && !isUpdating && updateWorkflowStage(stage.stage)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      isActive ? 'bg-blue-500' : 
                      isPassed ? 'bg-green-500' : 
                      'bg-gray-400'
                    }`}>
                      <span className="text-lg">{stage.icon}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{stage.name}</h5>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPassed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ Complete
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        ⚡ Active
                      </span>
                    )}
                    {isAccessible && !isActive && !isPassed && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Workflow Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this workflow stage..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Stage {getStageIndex(selectedStage) + 1} of {WORKFLOW_STAGES.length}
        </div>
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          )}
          {canAdvanceToNext() && (
            <button
              onClick={advanceToNextStage}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : `Advance to ${WORKFLOW_STAGES[getStageIndex(selectedStage) + 1]?.name}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}