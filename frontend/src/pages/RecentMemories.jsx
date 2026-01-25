import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memoriesApi, categoriesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MemoryCard from '../components/MemoryCard'
import CreateMemoryModal from '../components/CreateMemoryModal'
import { Brain, TrendingUp, Clock, Tag, Plus, RefreshCw } from 'lucide-react'

export default function RecentMemories() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => memoriesApi.getStats().then(res => res.data.data)
  })

  const { data: recentMemories, isLoading: memoriesLoading, refetch } = useQuery({
    queryKey: ['recentMemories'],
    queryFn: () => memoriesApi.getRecent(10).then(res => res.data.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(res => res.data.data)
  })

  const categoryColors = {
    'Idea': 'bg-amber-500',
    'Task': 'bg-red-500',
    'Project': 'bg-purple-500',
    'Reference': 'bg-emerald-500',
    'Journal': 'bg-blue-500',
    'Meeting': 'bg-pink-500',
    'Learning': 'bg-cyan-500',
    'Unsorted': 'bg-slate-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recent Memories</h1>
          <p className="text-slate-500">Welcome back, {user?.name || 'User'}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="memory-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Brain className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Memories</p>
              <p className="text-2xl font-bold text-slate-800">
                {statsLoading ? '...' : stats?.totalMemories || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="memory-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="text-2xl font-bold text-slate-800">
                {statsLoading ? '...' : stats?.categories?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="memory-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Recent (7 days)</p>
              <p className="text-2xl font-bold text-slate-800">
                {memoriesLoading ? '...' : recentMemories?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="memory-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Most Active</p>
              <p className="text-lg font-bold text-slate-800 truncate">
                {statsLoading ? '...' : stats?.categories?.[0]?.category || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="memory-card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Category Breakdown</h2>
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats?.categories?.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`
                  p-3 rounded-lg text-left transition-all
                  ${selectedCategory === cat.category
                    ? 'ring-2 ring-primary-500'
                    : 'hover:bg-slate-50'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[cat.category] || 'bg-slate-500'}`} />
                  <span className="text-sm font-medium text-slate-700">{cat.category}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{cat.count}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent memories */}
      <div className="memory-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Memories</h2>
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${memoriesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {memoriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : recentMemories?.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No memories yet</p>
            <p className="text-sm text-slate-400">Start adding your first thought!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMemories?.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} onUpdate={refetch} />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateMemoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
