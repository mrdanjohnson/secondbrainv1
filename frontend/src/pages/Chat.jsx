import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi, memoriesApi, categoriesApi } from '../services/api'
import { Send, Plus, Trash2, Bot, User, Loader2, Sparkles, X, CheckSquare, Square, FileText, ChevronDown, CheckCircle } from 'lucide-react'

export default function Chat() {
  const [selectedSession, setSelectedSession] = useState(null)
  const [message, setMessage] = useState('')
  const [sessions, setSessions] = useState([])
  const [viewMemoryModal, setViewMemoryModal] = useState(null)
  const [selectedSources, setSelectedSources] = useState([])
  const [showMemorySelector, setShowMemorySelector] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMemories, setSelectedMemories] = useState([])
  const [savedMemoryNotification, setSavedMemoryNotification] = useState(null)
  const messagesEndRef = useRef(null)
  const queryClient = useQueryClient()

  // Load sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => chatApi.getSessions().then(res => res.data.data)
  })

  // Load categories for memory selector
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(res => res.data)
  })

  const categories = categoriesData?.data || categoriesData || []

  // Load memories for selector
  const { data: memories } = useQuery({
    queryKey: ['memories', selectedCategory],
    queryFn: () => memoriesApi.getAll({ category: selectedCategory || undefined }).then(res => res.data.data),
    enabled: showMemorySelector
  })

  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData)
      if (!selectedSession && sessionsData.length > 0) {
        setSelectedSession(sessionsData[0])
      }
    }
  }, [sessionsData, selectedSession])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data) => chatApi.sendMessage(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['chatSessions'])
      queryClient.invalidateQueries(['chatMessages', selectedSession?.id])
      setMessage('')
      
      // Log prompt info to browser console
      if (response.data.data.promptInfo) {
        const info = response.data.data.promptInfo;
        console.log(`\n========== ${info.provider.toUpperCase()} PROMPT ==========`);
        console.log('Model:', info.model);
        console.log('Temperature:', info.temperature);
        console.log('Max Tokens:', info.maxTokens);
        console.log('Context Memories:', info.contextCount);
        if (info.systemPrompt) {
          console.log('\nSystem Prompt:', info.systemPrompt);
        }
        console.log('\nMessages:');
        info.messages?.forEach((msg, idx) => {
          console.log(`[${idx}] ${msg.role.toUpperCase()}:`, msg.content);
        });
        console.log('===================================\n');
      }
      
      // Check if conversation was saved as memory
      if (response.data.data.savedAsMemory) {
        setSavedMemoryNotification(response.data.data.savedAsMemory)
        setTimeout(() => setSavedMemoryNotification(null), 5000)
      }
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

  // Load current session messages
  const { data: currentMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', selectedSession?.id],
    queryFn: () => chatApi.getSession(selectedSession.id).then(res => res.data.data.messages),
    enabled: !!selectedSession?.id
  })

  // Scroll to bottom when messages change or when sending
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, sendMessageMutation.isPending])

  // Also scroll after a short delay to ensure DOM is updated
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [currentMessages?.length])

  const handleSend = async (customMessage = null, specificMemoryIds = null) => {
    const msgToSend = customMessage || message
    if (!msgToSend.trim() || sendMessageMutation.isPending) return

    const data = {
      message: msgToSend.trim(),
      sessionId: selectedSession?.id,
      specificMemoryIds: specificMemoryIds || (selectedMemories.length > 0 ? selectedMemories : undefined)
    }

    sendMessageMutation.mutate(data, {
      onSuccess: () => {
        setSelectedMemories([])
        setSelectedSources([])
        if (!customMessage) {
          setMessage('')
        }
      }
    })
  }

  const handleAskAboutSources = () => {
    if (selectedSources.length === 0) return
    handleSend(message, selectedSources.map(s => s.id))
    setSelectedSources([])
  }

  const toggleSourceSelection = (source) => {
    setSelectedSources(prev => {
      const exists = prev.find(s => s.id === source.id)
      if (exists) {
        return prev.filter(s => s.id !== source.id)
      } else {
        return [...prev, source]
      }
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  const truncateToWords = (text, wordCount) => {
    const words = text.trim().split(/\s+/)
    if (words.length <= wordCount) return text
    return words.slice(0, wordCount).join(' ') + '...'
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
                    group p-3 cursor-pointer transition-colors relative
                    ${selectedSession?.id === session.id 
                      ? 'bg-primary-50 border-l-2 border-primary-500' 
                      : 'hover:bg-slate-50'
                    }
                  `}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-slate-700 text-sm">
                        Chat <span className="text-xs font-normal text-slate-500">- {formatDateTime(session.createdAt)}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {session.firstUserMessage ? truncateToWords(session.firstUserMessage, 5) : 'No messages yet'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this conversation?')) {
                          deleteSessionMutation.mutate(session.id)
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 rounded transition-opacity opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
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
            {/* Saved Memory Notification */}
            {savedMemoryNotification && (
              <div className="bg-green-50 border-b border-green-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    {savedMemoryNotification.message}
                  </span>
                </div>
                <button
                  onClick={() => setSavedMemoryNotification(null)}
                  className="p-1 hover:bg-green-100 rounded"
                >
                  <X className="w-4 h-4 text-green-600" />
                </button>
              </div>
            )}
            
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
                      {msg.context && msg.context.length > 0 && msg.role === 'assistant' && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50">
                          <p className="text-xs font-medium text-slate-600 mb-2">Sources ({msg.context.length}):</p>
                          <div className="space-y-2">
                            {msg.context.map((ctx, i) => {
                              const isSelected = selectedSources.find(s => s.id === ctx.id)
                              return (
                                <div 
                                  key={i} 
                                  className={`text-xs p-2 rounded border transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-primary-50 border-primary-300' 
                                      : 'bg-slate-50 border-slate-200 hover:border-primary-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <button
                                      onClick={() => toggleSourceSelection(ctx)}
                                      className="mt-0.5 flex-shrink-0"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-primary-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-400" />
                                      )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-slate-600 line-clamp-2">
                                        {ctx.rawContent}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-400">
                                          {ctx.category}
                                        </span>
                                        {ctx.similarity && (
                                          <span className="text-xs text-slate-400">
                                            • {Math.round(ctx.similarity * 100)}% match
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => setViewMemoryModal(ctx)}
                                      className="p-1 hover:bg-white rounded flex-shrink-0"
                                      title="View full memory"
                                    >
                                      <FileText className="w-4 h-4 text-slate-500" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {selectedSources.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Ask about selected sources..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAskAboutSources()
                                  }
                                }}
                                className="flex-1 text-xs px-3 py-2 border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                              />
                              <button
                                onClick={handleAskAboutSources}
                                disabled={!message.trim()}
                                className="btn-primary text-xs px-3 py-2"
                              >
                                Ask
                              </button>
                              <button
                                onClick={() => setSelectedSources([])}
                                className="text-xs px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                              >
                                Clear
                              </button>
                            </div>
                          )}
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
              {selectedMemories.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedMemories.map(memId => {
                    const mem = memories?.find(m => m.id === memId)
                    return mem ? (
                      <div key={memId} className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                        <span className="truncate max-w-[200px]">{truncateToWords(mem.rawContent, 5)}</span>
                        <button
                          onClick={() => setSelectedMemories(prev => prev.filter(id => id !== memId))}
                          className="hover:bg-primary-200 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null
                  })}
                  <button
                    onClick={() => setSelectedMemories([])}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your memories..."
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    onClick={() => setShowMemorySelector(!showMemorySelector)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded"
                    title="Select specific memories"
                  >
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showMemorySelector ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="btn-primary px-4"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Memory Selector Dropdown */}
              {showMemorySelector && (
                <div className="mt-3 border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-64 overflow-y-auto">
                  <div className="mb-3">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Filter by Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full text-sm px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="">All Categories</option>
                      {categories?.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Select Memories</label>
                    {memories?.slice(0, 20).map(mem => {
                      const isSelected = selectedMemories.includes(mem.id)
                      return (
                        <div
                          key={mem.id}
                          onClick={() => {
                            setSelectedMemories(prev => 
                              isSelected ? prev.filter(id => id !== mem.id) : [...prev, mem.id]
                            )
                          }}
                          className={`p-2 rounded cursor-pointer text-xs border transition-all ${
                            isSelected 
                              ? 'bg-primary-100 border-primary-300' 
                              : 'bg-white border-slate-200 hover:border-primary-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 line-clamp-2">{mem.rawContent}</p>
                              <p className="text-slate-400 mt-0.5">{mem.category}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* View Memory Modal */}
      {viewMemoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewMemoryModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Memory Details</h3>
              <button
                onClick={() => setViewMemoryModal(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Content</label>
                  <p className="mt-1 text-slate-700 whitespace-pre-wrap">{viewMemoryModal.rawContent}</p>
                </div>
                {viewMemoryModal.category && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Category</label>
                    <p className="mt-1 text-slate-700">{viewMemoryModal.category}</p>
                  </div>
                )}
                {viewMemoryModal.tags && viewMemoryModal.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {viewMemoryModal.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {viewMemoryModal.similarity && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Similarity</label>
                    <p className="mt-1 text-slate-700">{Math.round(viewMemoryModal.similarity * 100)}%</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewMemoryModal(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
