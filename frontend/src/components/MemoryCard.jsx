import { useState } from 'react'
import { format } from 'date-fns'
import { memoriesApi } from '../services/api'
import {
  Tag,
  Calendar,
  Clock,
  Inbox,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  X
} from 'lucide-react'

const categoryColors = {
  'Idea': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  'Task': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  'Project': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  'Reference': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Journal': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  'Meeting': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  'Learning': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  'Unsorted': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' }
}

export default function MemoryCard({ memory, onUpdate, compact = false }) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(memory.rawContent)
  const [saving, setSaving] = useState(false)

  const colors = categoryColors[memory.category] || categoryColors['Unsorted']

  // Check if due date is overdue
  const isOverdue = memory.dueDate && new Date(memory.dueDate) < new Date()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this memory?')) return
    
    try {
      await memoriesApi.delete(memory.id)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await memoriesApi.update(memory.id, { content: editContent })
      setEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update memory:', error)
    } finally {
      setSaving(false)
    }
  }

  if (compact) {
    return (
      <div className="memory-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`tag ${colors.bg} ${colors.text}`}>
                {memory.category}
              </span>
              <span className="text-xs text-slate-400">
                {format(new Date(memory.createdAt), 'MMM d')}
              </span>
            </div>
            <p className="text-slate-700 line-clamp-2 text-sm">
              {memory.rawContent}
            </p>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        {/* Date fields */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
          {memory.memoryDateFormatted && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{memory.memoryDateFormatted}</span>
            </div>
          )}
          {memory.dueDateFormatted && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              <span>Due: {memory.dueDateFormatted}</span>
            </div>
          )}
          {memory.receivedDateFormatted && (
            <div className="flex items-center gap-1">
              <Inbox className="w-3 h-3" />
              <span>{memory.receivedDateFormatted}</span>
            </div>
          )}
        </div>
        
        {memory.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {memory.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                #{tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-xs text-slate-400">+{memory.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="memory-card group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`tag ${colors.bg} ${colors.text}`}>
              {memory.category}
            </span>
          </div>
          
          {/* Date fields */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {memory.memoryDateFormatted && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{memory.memoryDateFormatted}</span>
              </div>
            )}
            {memory.dueDateFormatted && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>Due: {memory.dueDateFormatted}</span>
              </div>
            )}
            {memory.receivedDateFormatted && (
              <div className="flex items-center gap-1">
                <Inbox className="w-3 h-3" />
                <span>Received: {memory.receivedDateFormatted}</span>
              </div>
            )}
            {!memory.memoryDateFormatted && !memory.dueDateFormatted && !memory.receivedDateFormatted && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(memory.createdAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    setEditing(true)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={4}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setEditContent(memory.rawContent)
              }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-slate-700 whitespace-pre-wrap">
          {memory.rawContent}
        </p>
      )}

      {/* Tags */}
      {memory.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Structured content preview */}
      {memory.structuredContent?.summary && !editing && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 italic">
            "{memory.structuredContent.summary}"
          </p>
        </div>
      )}
    </div>
  )
}
