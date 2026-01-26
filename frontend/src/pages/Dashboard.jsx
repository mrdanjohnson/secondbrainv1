import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../services/api'
import CalendarView from '../components/CalendarView'
import DueDateWidget from '../components/DueDateWidget'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { BarChart3, Database, Calendar, X, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const { data: summaryData } = useQuery({
    queryKey: ['summary'],
    queryFn: () => analyticsApi.getSummaryStats().then(res => res.data.data)
  })

  const stats = [
    {
      icon: Database,
      label: 'Total Memories',
      value: summaryData?.totalMemories || 0,
      color: 'bg-blue-100 text-blue-600',
      clickable: true,
      onClick: () => setShowCategoryModal(true)
    },
    {
      icon: BarChart3,
      label: 'Avg per Day',
      value: summaryData?.avgPerDay?.toFixed(1) || 0,
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Calendar,
      label: 'Last 30 Days',
      value: summaryData?.thisMonth || 0,
      color: 'bg-orange-100 text-orange-600'
    }
  ]

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your memories and activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className={`bg-white rounded-lg shadow p-6 ${
              stat.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {stat.value}
                </p>
                {stat.clickable && (
                  <p className="text-xs text-slate-400 mt-1">Click for breakdown</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Category Breakdown</h3>
                <p className="text-sm text-slate-600">Total: {summaryData?.totalMemories || 0} memories</p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {summaryData?.byCategory && summaryData.byCategory.length > 0 ? (
                <div className="space-y-3">
                  {summaryData.byCategory
                    .sort((a, b) => b.count - a.count)
                    .map((cat) => {
                      const percentage = ((cat.count / summaryData.totalMemories) * 100).toFixed(1)
                      return (
                        <div key={cat.category} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${categoryColors[cat.category] || 'bg-slate-500'}`} />
                                <span className="font-medium text-slate-700">{cat.category}</span>
                              </div>
                              <div className="text-sm text-slate-600">
                                <span className="font-semibold">{cat.count}</span>
                                <span className="text-slate-400 ml-1">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${categoryColors[cat.category] || 'bg-slate-500'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No memories yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar (spans 2 columns) */}
        <div className="lg:col-span-2">
          <CalendarView />
        </div>

        {/* Due Date Widget */}
        <div>
          <DueDateWidget />
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts />
    </div>
  )
}
