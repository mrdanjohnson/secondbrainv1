import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../services/api'
import { AlertCircle, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DueDateWidget() {
  const navigate = useNavigate()
  
  const { data, isLoading } = useQuery({
    queryKey: ['dueDateStats'],
    queryFn: () => analyticsApi.getDueDateStats().then(res => res.data.data),
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Due Dates</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  const overdueCount = data?.overdue?.count || 0
  const upcoming7Count = data?.upcoming?.next7Days?.count || 0
  const upcoming30Count = data?.upcoming?.next30Days?.count || 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Due Dates</h3>
      
      <div className="space-y-3">
        {/* Overdue */}
        <button
          onClick={() => navigate('/memories?filter=overdue')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">Overdue</p>
              <p className="text-xs text-slate-500">Past due date</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {overdueCount}
          </div>
        </button>

        {/* Due This Week */}
        <button
          onClick={() => navigate('/memories?filter=due7days')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">Next 7 Days</p>
              <p className="text-xs text-slate-500">Due soon</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {upcoming7Count}
          </div>
        </button>

        {/* Due This Month */}
        <button
          onClick={() => navigate('/memories?filter=due30days')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-yellow-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">Next 30 Days</p>
              <p className="text-xs text-slate-500">Upcoming</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {upcoming30Count}
          </div>
        </button>
      </div>

      {overdueCount === 0 && upcoming7Count === 0 && upcoming30Count === 0 && (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-slate-600">All caught up! 🎉</p>
        </div>
      )}
    </div>
  )
}
