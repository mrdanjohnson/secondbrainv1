import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { searchApi } from '../services/api'
import MemoryCard from '../components/MemoryCard'
import { Search, Sparkles, Loader2, Zap, Filter, Calendar, X } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [dateField, setDateField] = useState('memory_date')
  const [showDateFilters, setShowDateFilters] = useState(false)

  const searchMutation = useMutation({
    mutationFn: ({ searchQuery, dateQuery, field }) => searchApi.semantic({
      query: searchQuery,
      limit: 20,
      dateQuery: dateQuery || undefined,
      dateField: field || 'memory_date'
    }),
    onSuccess: (response) => {
      setResults(response.data.data.results)
      setHasSearched(true)
    }
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      searchMutation.mutate({
        searchQuery: query.trim(),
        dateQuery: dateFilter,
        field: dateField
      })
    }
  }

  const exampleQueries = [
    'What are my project ideas?',
    'Find tasks related to work',
    'What did I learn about AI?',
    'Meeting notes from last week',
    'Ideas from yesterday',
    'Tasks due this week'
  ]

  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last Week', value: 'last week' },
    { label: 'Last Month', value: 'last month' },
    { label: 'Last 3 Days', value: 'last 3 days' },
    { label: 'This Week', value: 'this week' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Semantic Search</h1>
        <p className="text-slate-500">
          Search your Second Brain using natural language
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="memory-card">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your memories..."
              className="w-full pl-10 pr-4 py-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || searchMutation.isPending}
            className="btn-primary px-6 flex items-center gap-2"
          >
            {searchMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-4">
          <p className="text-sm text-slate-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => {
                  setQuery(eq)
                  searchMutation.mutate({
                    searchQuery: eq,
                    dateQuery: dateFilter,
                    field: dateField
                  })
                }}
                className="text-sm px-3 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filters */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowDateFilters(!showDateFilters)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Date Filters
              {dateFilter && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                  Active
                </span>
              )}
            </button>
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {showDateFilters && (
            <div className="space-y-3">
              {/* Date Field Selector */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Filter by date field:
                </label>
                <select
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="memory_date">Memory Date (when it occurred)</option>
                  <option value="due_date">Due Date (when it's due)</option>
                  <option value="received_date">Received Date (when captured)</option>
                </select>
              </div>

              {/* Quick Date Presets */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Quick presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setDateFilter(preset.value)}
                      className={`text-sm px-3 py-1 rounded-full transition-colors ${
                        dateFilter === preset.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Natural Language Input */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Or type a custom date query:
                </label>
                <input
                  type="text"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  placeholder='e.g., "last 5 days", "yesterday", "next week"'
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Supports: today, yesterday, tomorrow, last/next X days, last/this week, last/this month, overdue
                </p>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {searchMutation.isPending ? 'Searching...' : `Found ${results.length} results`}
            </h2>
            {results.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="w-4 h-4" />
                <span>Results ranked by relevance</span>
              </div>
            )}
          </div>

          {searchMutation.isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="spinner mx-auto mb-3"></div>
                <p className="text-slate-500">Searching your memories...</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="memory-card text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">No results found</p>
              <p className="text-sm text-slate-400">
                Try different keywords or add more memories first
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="relative">
                  <MemoryCard memory={result} onUpdate={() => {}} />
                  {result.similarity !== undefined && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                        {Math.round(result.similarity * 100)}% match
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && !searchMutation.isPending && (
        <div className="memory-card text-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Search with Intelligence
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Our semantic search understands the meaning behind your queries, 
            not just keywords. Find relevant memories even when you don&apos;t 
            remember exact wording.
          </p>
        </div>
      )}
    </div>
  )
}
