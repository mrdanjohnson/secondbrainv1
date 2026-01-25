import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cleanupApi, categoriesApi } from '../services/api'
import {
  Trash2, Plus, Play, Eye, Edit2, X, Clock, Calendar,
  Tag, FolderOpen, AlertTriangle, CheckCircle, Loader2,
  ChevronDown, ChevronRight, History
} from 'lucide-react'

export default function CleanupManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [showLogsModal, setShowLogsModal] = useState(null)
  const [expandedJobs, setExpandedJobs] = useState({})
  const queryClient = useQueryClient()

  // Load cleanup jobs
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['cleanupJobs'],
    queryFn: () => cleanupApi.getAllJobs().then(res => res.data.data)
  })

  const jobs = jobsData || []

  // Load categories for filter options
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(res => res.data.data)
  })

  const categories = categoriesData || []

  // Run job manually
  const runJobMutation = useMutation({
    mutationFn: (jobId) => cleanupApi.runJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cleanupJobs'])
      alert('Cleanup job executed successfully')
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to run cleanup job')
    }
  })

  // Delete job
  const deleteJobMutation = useMutation({
    mutationFn: (jobId) => cleanupApi.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cleanupJobs'])
    }
  })

  const toggleExpanded = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const scheduleLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    manual: 'Manual Only'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Automated Cleanup Jobs</h3>
          <p className="text-sm text-slate-500">
            Schedule automatic deletion of memories based on date, category, or tags
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Automated Memory Deletion</p>
            <p className="text-sm text-amber-700 mt-1">
              Cleanup jobs permanently delete memories. Use the preview feature before enabling jobs.
              Deleted memories cannot be recovered.
            </p>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-2">No cleanup jobs configured</p>
          <p className="text-sm text-slate-400 mb-4">
            Create your first job to automate memory cleanup
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Cleanup Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
            >
              {/* Job Header */}
              <div className="p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggleExpanded(job.id)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {expandedJobs[job.id] ? (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <h4 className="font-semibold text-slate-800">{job.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        job.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {scheduleLabels[job.schedule]}
                      </span>
                    </div>
                    {job.description && (
                      <p className="text-sm text-slate-600 ml-9">{job.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingJob(job)
                        setShowCreateModal(true)
                      }}
                      className="p-2 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setShowLogsModal(job.id)}
                      className="p-2 hover:bg-slate-100 rounded"
                      title="View Logs"
                    >
                      <History className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Run cleanup job "${job.name}" now?`)) {
                          runJobMutation.mutate(job.id)
                        }
                      }}
                      disabled={runJobMutation.isPending}
                      className="p-2 hover:bg-emerald-100 rounded text-emerald-600"
                      title="Run Now"
                    >
                      {runJobMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete cleanup job "${job.name}"?`)) {
                          deleteJobMutation.mutate(job.id)
                        }
                      }}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Job Stats */}
                <div className="flex items-center gap-6 mt-3 ml-9 text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Last run: {formatDate(job.lastRun)}</span>
                  </div>
                  {job.lastDeletedCount !== null && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Trash2 className="w-4 h-4" />
                      <span>Last deleted: {job.lastDeletedCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-slate-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Total deleted: {job.totalDeletedCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedJobs[job.id] && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-slate-700 mb-2">Filter Configuration</h5>
                      <div className="space-y-2">
                        {job.filterType && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500">Type:</span>
                            <span className="text-slate-700 font-medium capitalize">{job.filterType}</span>
                          </div>
                        )}
                        {job.dateField && (
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div>
                              <span className="text-slate-700">
                                {job.dateField.replace(/_formatted$/, '').replace(/_/g, ' ')}
                              </span>
                              <span className="text-slate-500 mx-2">{job.dateOperator}</span>
                              <span className="text-slate-700 font-medium">{job.dateValue}</span>
                            </div>
                          </div>
                        )}
                        {job.tags && job.tags.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Tag className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {job.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {job.categories && job.categories.length > 0 && (
                          <div className="flex items-start gap-2">
                            <FolderOpen className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {job.categories.map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-700 mb-2">Schedule</h5>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500">Frequency:</span>
                          <span className="text-slate-700 font-medium">{scheduleLabels[job.schedule]}</span>
                        </div>
                        {job.scheduleTime && job.schedule !== 'manual' && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500">Time:</span>
                            <span className="text-slate-700 font-medium">{job.scheduleTime}</span>
                          </div>
                        )}
                        {job.nextRun && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500">Next run:</span>
                            <span className="text-slate-700 font-medium">{formatDate(job.nextRun)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateEditJobModal
          job={editingJob}
          categories={categories}
          onClose={() => {
            setShowCreateModal(false)
            setEditingJob(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingJob(null)
            queryClient.invalidateQueries(['cleanupJobs'])
          }}
        />
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <JobLogsModal
          jobId={showLogsModal}
          onClose={() => setShowLogsModal(null)}
        />
      )}
    </div>
  )
}

// Create/Edit Job Modal Component
function CreateEditJobModal({ job, categories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: job?.name || '',
    description: job?.description || '',
    filterType: job?.filterType || 'date',
    dateField: job?.dateField || 'memory_date_formatted',
    dateOperator: job?.dateOperator || 'before',
    dateValue: job?.dateValue || '30 days',
    tags: job?.tags || [],
    categories: job?.categories || [],
    schedule: job?.schedule || 'manual',
    scheduleTime: job?.scheduleTime || '02:00:00',
    scheduleDayOfWeek: job?.scheduleDayOfWeek || 0,
    scheduleDayOfMonth: job?.scheduleDayOfMonth || 1,
    isActive: job?.isActive !== undefined ? job.isActive : true
  })

  const [tagInput, setTagInput] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Clear preview data when modal opens or job changes
  useEffect(() => {
    setPreviewData(null)
  }, [job?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setPreviewData(null)
    }
  }, [])

  const createMutation = useMutation({
    mutationFn: (data) => job
      ? cleanupApi.updateJob(job.id, data)
      : cleanupApi.createJob(data),
    onSuccess: () => {
      onSuccess()
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to save cleanup job')
    }
  })

  const handlePreview = async () => {
    setIsPreviewing(true)
    try {
      // Build payload with snake_case keys for backend
      const payload = {
        filter_type: formData.filterType
      }

      // Add date fields if filter type includes date
      if (formData.filterType === 'date' || formData.filterType === 'combined') {
        payload.date_field = formData.dateField
        payload.date_operator = formData.dateOperator
        payload.date_value = formData.dateValue
      }

      // Add tags if filter type includes tags
      if (formData.filterType === 'tag' || formData.filterType === 'combined') {
        payload.tags = formData.tags
      }

      // Add categories if filter type includes categories
      if (formData.filterType === 'category' || formData.filterType === 'combined') {
        payload.categories = formData.categories
      }

      const response = await cleanupApi.previewJob(payload)
      setPreviewData(response.data.data)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to preview')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Clear preview data before submitting
    setPreviewData(null)

    // Build payload with snake_case keys for backend
    const payload = {
      name: formData.name,
      description: formData.description,
      filter_type: formData.filterType,
      schedule: formData.schedule,
      is_active: formData.isActive
    }

    // Add date fields if filter type includes date
    if (formData.filterType === 'date' || formData.filterType === 'combined') {
      payload.date_field = formData.dateField
      payload.date_operator = formData.dateOperator
      payload.date_value = formData.dateValue
    }

    // Add tags if filter type includes tags
    if (formData.filterType === 'tag' || formData.filterType === 'combined') {
      payload.tags = formData.tags
    }

    // Add categories if filter type includes categories
    if (formData.filterType === 'category' || formData.filterType === 'combined') {
      payload.categories = formData.categories
    }

    // Add schedule-specific fields
    if (formData.schedule !== 'manual') {
      payload.schedule_time = formData.scheduleTime

      if (formData.schedule === 'weekly') {
        payload.schedule_day_of_week = formData.scheduleDayOfWeek
      }

      if (formData.schedule === 'monthly') {
        payload.schedule_day_of_month = formData.scheduleDayOfMonth
      }
    }

    createMutation.mutate(payload)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const toggleCategory = (catName) => {
    setFormData({
      ...formData,
      categories: formData.categories.includes(catName)
        ? formData.categories.filter(c => c !== catName)
        : [...formData.categories, catName]
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col relative">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-slate-800 text-lg">
            {job ? 'Edit Cleanup Job' : 'Create Cleanup Job'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="cleanup-job-form" onSubmit={handleSubmit}>
            <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium text-slate-800 mb-3">Basic Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Delete old tasks"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="2"
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </div>

            {/* Filter Configuration */}
            <div>
              <h4 className="font-medium text-slate-800 mb-3">Filter Configuration</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Filter Type
                  </label>
                  <select
                    value={formData.filterType}
                    onChange={(e) => setFormData({ ...formData, filterType: e.target.value })}
                    className="input-field"
                  >
                    <option value="date">Date Only</option>
                    <option value="tag">Tags Only</option>
                    <option value="category">Category Only</option>
                    <option value="combined">Combined (Date + Tags + Category)</option>
                  </select>
                </div>

                {/* Date Filter */}
                {(formData.filterType === 'date' || formData.filterType === 'combined') && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <h5 className="font-medium text-slate-700 text-sm">Date Filter</h5>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Date Field
                        </label>
                        <select
                          value={formData.dateField}
                          onChange={(e) => setFormData({ ...formData, dateField: e.target.value })}
                          className="input-field text-sm"
                        >
                          <option value="memory_date_formatted">Memory Date</option>
                          <option value="due_date_formatted">Due Date</option>
                          <option value="received_date_formatted">Received Date</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Operator
                        </label>
                        <select
                          value={formData.dateOperator}
                          onChange={(e) => setFormData({ ...formData, dateOperator: e.target.value })}
                          className="input-field text-sm"
                        >
                          <option value="before">Before</option>
                          <option value="after">After</option>
                          <option value="equals">Equals</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={formData.dateValue}
                          onChange={(e) => setFormData({ ...formData, dateValue: e.target.value })}
                          className="input-field text-sm"
                          placeholder="30 days, 1 week"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Examples: "30 days", "1 week", "01/01/26"
                    </p>
                  </div>
                )}

                {/* Tags Filter */}
                {(formData.filterType === 'tag' || formData.filterType === 'combined') && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h5 className="font-medium text-slate-700 text-sm mb-3">Tags Filter</h5>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="input-field text-sm"
                        placeholder="Add tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="btn-secondary text-sm"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-primary-200 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Categories Filter */}
                {(formData.filterType === 'category' || formData.filterType === 'combined') && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h5 className="font-medium text-slate-700 text-sm mb-3">Categories Filter</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(cat.name)}
                            onChange={() => toggleCategory(cat.name)}
                            className="rounded border-slate-300"
                          />
                          <span className="text-sm text-slate-700">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h4 className="font-medium text-slate-800 mb-3">Schedule</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="input-field"
                  >
                    <option value="manual">Manual Only</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {formData.schedule !== 'manual' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Time of Day
                    </label>
                    <input
                      type="time"
                      value={formData.scheduleTime ? formData.scheduleTime.substring(0, 5) : '02:00'}
                      onChange={(e) => {
                        const timeValue = e.target.value
                        setFormData({ ...formData, scheduleTime: timeValue + ':00' })
                      }}
                      className="input-field"
                    />
                  </div>
                )}

                {formData.schedule === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={formData.scheduleDayOfWeek}
                      onChange={(e) => setFormData({ ...formData, scheduleDayOfWeek: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                )}

                {formData.schedule === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Day of Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.scheduleDayOfMonth}
                      onChange={(e) => setFormData({ ...formData, scheduleDayOfMonth: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Enable this cleanup job</span>
                </label>
              </div>
            </div>

            {/* Preview Section */}
            {previewData && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Eye className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-800">Preview Results</h5>
                    <p className="text-sm text-amber-700 mt-1">
                      This job would delete <strong>{previewData.count}</strong> memories
                    </p>
                  </div>
                </div>
                {previewData.count > 0 && previewData.memories.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                    {previewData.memories.slice(0, 5).map((mem, i) => (
                      <div key={i} className="text-xs p-2 bg-white rounded border border-amber-200">
                        <p className="text-slate-700 line-clamp-2">{mem.raw_content}</p>
                        <p className="text-slate-500 mt-1">{mem.category} • {mem.memory_date_formatted || mem.due_date_formatted || mem.received_date_formatted}</p>
                      </div>
                    ))}
                    {previewData.count > 5 && (
                      <p className="text-xs text-amber-700 italic">
                        ... and {previewData.count - 5} more memories
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing}
            className="btn-secondary flex items-center gap-2"
          >
            {isPreviewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Preview
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="cleanup-job-form"
              disabled={createMutation.isPending || !formData.name}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Job Logs Modal Component
function JobLogsModal({ jobId, onClose }) {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['cleanupLogs', jobId],
    queryFn: () => cleanupApi.getJobLogs(jobId).then(res => res.data.data)
  })

  const logs = logsData || []

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col relative">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-slate-800 text-lg">Execution Logs</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>No execution logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        log.status === 'success' ? 'text-emerald-800' : 'text-red-800'
                      }`}>
                        {log.status === 'success' ? 'Success' : 'Error'}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(log.executedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Type:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        log.executionType === 'manual'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {log.executionType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Deleted:</span>
                      <span className="font-medium text-slate-800">{log.deletedCount} memories</span>
                    </div>
                    {log.errorMessage && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                        {log.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
