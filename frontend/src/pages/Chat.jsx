import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../services/api'
import { Send, Plus, Trash2, Bot, User, Loader2, Sparkles } from 'lucide-react'

export default function Chat() {
  const [selectedSession, setSelectedSession] = useState(null)
  const [message, setMessage] = useState('')
  const [sessions, setSessions] = useState([])
  const messagesEndRef = useRef(null)
  const queryClient = useQueryClient()

  // Load sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => chatApi.getSessions().then(res => res.data.data),
    refetchInterval: 10000
  })

  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData)
      if (!selectedSession && sessionsData.length > 0) {
        setSelectedSession(sessionsData[0])
      }
    }
  }, [sessionsData, selectedSession])

  // Load current session messages
  const { data: currentMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', selectedSession?.id],
    queryFn: () => chatApi.getSession(selectedSession.id).then(res => res.data.data.messages),
    enabled: !!selectedSession?.id
  })

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data) => chatApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatSessions'])
      queryClient.invalidateQueries(['chatMessages', selectedSession?.id])
      setMessage('')
    }
  })

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: () => chatApi.createSession(),
    onSuccess: (data) => {
      setSelectedSession(data.data.data)
      queryClient.invalidateQueries(['chatSessions'])
    }
  })

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id) => chatApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatSessions'])
      setSessions(prev => prev.filter(s => s.id !== selectedSession?.id))
      if (selectedSession) {
        const remaining = sessions.filter(s => s.id !== selectedSession.id)
        setSelectedSession(remaining[0] || null)
      }
    }
  })

  const handleSend = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return

    const data = {
      message: message.trim(),
      sessionId: selectedSession?.id
    }

    sendMessageMutation.mutate(data)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Sessions sidebar */}
      <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={() => createSessionMutation.mutate()}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="p-4 flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    p-3 cursor-pointer transition-colors
                    ${selectedSession?.id === session.id 
                      ? 'bg-primary-50 border-l-2 border-primary-500' 
                      : 'hover:bg-slate-50'
                    }
                  `}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-700 truncate pr-2">
                      {session.title || 'New Chat'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this conversation?')) {
                          deleteSessionMutation.mutate(session.id)
                        }
                      }}
                      className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {session.messageCount} messages
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Start a Conversation</h2>
              <p className="text-slate-500 mb-4">
                Chat with your Second Brain using AI-powered context
              </p>
              <button
                onClick={() => createSessionMutation.mutate()}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="spinner"></div>
                </div>
              ) : currentMessages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-primary-600" />
                  </div>
                  <p className="text-slate-600 font-medium">Ask me anything about your memories</p>
                  <p className="text-sm text-slate-400 mt-1">
                    I&apos;ll use your stored knowledge to provide relevant answers
                  </p>
                </div>
              ) : (
                currentMessages?.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-primary-500' : 'bg-emerald-500'
                    }`}>
                      {msg.role === 'user' 
                        ? <User className="w-4 h-4 text-white" />
                        : <Bot className="w-4 h-4 text-white" />
                      }
                    </div>
                    <div className={`chat-bubble ${
                      msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.context && msg.context.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50">
                          <p className="text-xs text-slate-500 mb-1">Sources:</p>
                          <div className="space-y-1">
                            {msg.context.slice(0, 3).map((ctx, i) => (
                              <p key={i} className="text-xs text-slate-400 truncate">
                                • {ctx.rawContent?.slice(0, 80)}...
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="chat-bubble chat-bubble-assistant">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your memories..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="btn-primary px-4"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
