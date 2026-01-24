import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memoriesApi, categoriesApi } from '../services/api'
import MemoryCard from '../components/MemoryCard'
import CreateMemoryModal from '../components/CreateMemoryModal'
import { Plus, Filter, Search, Grid, List, SortAsc, SortDesc } from 'lucide-react'

export default function Memories() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  })
  const [viewMode, setViewMode] = useState('grid')

  const { data: memories, isLoading, refetch } = useQuery({
    queryKey: ['memories', filters],
    queryFn: () => memoriesApi.getAll({
      category: filters.category || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    }).then(res => res.data.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(res => res.data.data)
  })

  const filteredMemories = memories?.filter(m => {
    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase()
    return (
      m.rawContent.toLowerCase().includes(searchLower) ||
      m.category.toLowerCase().includes(searchLower) ||
      m.tags?.some(t => t.toLowerCase().includes(searchLower))
    )
  }) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Memories</h1>
          <p className="text-slate-500">
            {filteredMemories.length} memories found
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </button>
      </div>

      {/* Filters */}
      <div className="memory-card">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search memories..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">All categories</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters({
                ...filters,
                sortOrder: filters.sortOrder === 'ASC' ? 'DESC' : 'ASC'
              })}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              {filters.sortOrder === 'ASC' 
                ? <SortAsc className="w-4 h-4 text-slate-600" />
                : <SortDesc className="w-4 h-4 text-slate-600" />
              }
            </button>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="created_at">Date</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* View mode */}
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="memory-card text-center py-12">
          <p className="text-slate-500 mb-4">No memories found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Add your first memory
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onUpdate={refetch}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onUpdate={refetch}
              compact
            />
          ))}
        </div>
      )}

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
