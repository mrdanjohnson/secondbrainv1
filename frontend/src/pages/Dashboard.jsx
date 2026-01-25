import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../services/api'
import CalendarView from '../components/CalendarView'
import DueDateWidget from '../components/DueDateWidget'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { BarChart3, Database, Tag, Calendar } from 'lucide-react'

export default function Dashboard() {
  const { data: summaryData } = useQuery({
    queryKey: ['summary'],
    queryFn: () => analyticsApi.getSummary().then(res => res.data.data)
  })

  const stats = [
    {
      icon: Database,
      label: 'Total Memories',
      value: summaryData?.totalMemories || 0,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Tag,
      label: 'Categories',
      value: summaryData?.categoriesCount || 0,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: BarChart3,
      label: 'Avg per Day',
      value: summaryData?.avgPerDay?.toFixed(1) || 0,
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Calendar,
      label: 'This Month',
      value: summaryData?.thisMonth || 0,
      color: 'bg-orange-100 text-orange-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your memories and activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

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
