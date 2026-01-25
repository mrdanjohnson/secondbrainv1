import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useQuery } from '@tanstack/react-query'
import { memoriesApi } from '../services/api'
import { X, Calendar as CalendarIcon } from 'lucide-react'

const locales = {
  'en-US': enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const categoryColors = {
  'Idea': '#f59e0b',
  'Task': '#ef4444',
  'Project': '#a855f7',
  'Reference': '#10b981',
  'Journal': '#3b82f6',
  'Meeting': '#ec4899',
  'Learning': '#06b6d4',
  'Unsorted': '#64748b'
}

export default function CalendarView() {
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [view, setView] = useState('month')

  const { data: memories = [] } = useQuery({
    queryKey: ['memories', 'all'],
    queryFn: () => memoriesApi.getAll({ limit: 1000 }).then(res => res.data.data)
  })

  // Transform memories into calendar events
  const events = useMemo(() => {
    const eventsList = []
    
    memories.forEach(memory => {
      // Add event for memory_date
      if (memory.memoryDate) {
        eventsList.push({
          id: `${memory.id}-memory`,
          title: memory.rawContent.substring(0, 50) + (memory.rawContent.length > 50 ? '...' : ''),
          start: new Date(memory.memoryDate),
          end: new Date(memory.memoryDate),
          resource: { memory, type: 'memory' }
        })
      }
      
      // Add event for due_date
      if (memory.dueDate) {
        eventsList.push({
          id: `${memory.id}-due`,
          title: `📌 ${memory.rawContent.substring(0, 40)}${memory.rawContent.length > 40 ? '...' : ''}`,
          start: new Date(memory.dueDate),
          end: new Date(memory.dueDate),
          resource: { memory, type: 'due' }
        })
      }
      
      // Add event for received_date
      if (memory.receivedDate) {
        eventsList.push({
          id: `${memory.id}-received`,
          title: `📥 ${memory.rawContent.substring(0, 40)}${memory.rawContent.length > 40 ? '...' : ''}`,
          start: new Date(memory.receivedDate),
          end: new Date(memory.receivedDate),
          resource: { memory, type: 'received' }
        })
      }
    })
    
    return eventsList
  }, [memories])

  const eventStyleGetter = (event) => {
    const category = event.resource.memory.category
    const backgroundColor = categoryColors[category] || categoryColors['Unsorted']
    
    let opacity = '0.8'
    if (event.resource.type === 'due') {
      opacity = '0.95'
    } else if (event.resource.type === 'received') {
      opacity = '0.7'
    }
    
    return {
      style: {
        backgroundColor,
        opacity,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px'
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <CalendarIcon className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-800">Calendar</h3>
      </div>

      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          views={['month', 'week', 'day']}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedMemory(event.resource.memory)}
          popup
          tooltipAccessor={(event) => event.resource.memory.rawContent}
        />
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Memory Details</h3>
              <button
                onClick={() => setSelectedMemory(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  categoryColors[selectedMemory.category] ? 'text-white' : 'bg-slate-200 text-slate-800'
                }`} style={{ 
                  backgroundColor: categoryColors[selectedMemory.category] 
                }}>
                  {selectedMemory.category}
                </span>
              </div>
              
              <p className="text-slate-700 mb-4 whitespace-pre-wrap">
                {selectedMemory.rawContent}
              </p>
              
              {selectedMemory.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMemory.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="space-y-2 text-sm text-slate-600">
                {selectedMemory.memoryDateFormatted && (
                  <p>📅 Memory Date: {selectedMemory.memoryDateFormatted}</p>
                )}
                {selectedMemory.dueDateFormatted && (
                  <p>📌 Due Date: {selectedMemory.dueDateFormatted}</p>
                )}
                {selectedMemory.receivedDateFormatted && (
                  <p>📥 Received: {selectedMemory.receivedDateFormatted}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
