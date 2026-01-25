import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AnalyticsCharts() {
  const [period, setPeriod] = useState('30days')

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline', period],
    queryFn: () => analyticsApi.getTimeline({ period, groupBy: 'day' }).then(res => res.data.data.timeline)
  })

  const { data: busiestData, isLoading: busiestLoading } = useQuery({
    queryKey: ['busiest', period],
    queryFn: () => analyticsApi.getBusiestTimes({ period }).then(res => res.data.data)
  })

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  const periods = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' }
  ]

  if (timelineLoading && busiestLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-800">Memory Activity</h3>
          </div>
          <div className="flex gap-2">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {timelineLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                labelFormatter={formatDate}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Memories"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Busiest Days Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Busiest Days of Week</h3>
        
        {busiestLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={busiestData?.busiestDays || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="dayName" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#8b5cf6" 
                radius={[8, 8, 0, 0]}
                name="Memories"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
