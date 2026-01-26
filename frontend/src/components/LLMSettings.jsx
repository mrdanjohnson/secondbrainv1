import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { llmSettingsApi } from '../services/api'
import { Cpu, Download, Trash2, RefreshCw, ChevronDown, ChevronUp, Info, Loader2 } from 'lucide-react'

export default function LLMSettings() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [expandedAreas, setExpandedAreas] = useState({ chat: true })
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null)
  const [downloadingModel, setDownloadingModel] = useState(null) // Track which model is downloading
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Fetch user's LLM settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['llmSettings'],
    queryFn: async () => {
      const response = await llmSettingsApi.getSettings()
      return response.data.data
    }
  })

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['availableModels'],
    queryFn: async () => {
      const response = await llmSettingsApi.getAvailableModels()
      return response.data.data
    }
  })

  // Fetch Ollama status
  const { data: ollamaData, refetch: refetchOllama } = useQuery({
    queryKey: ['ollamaStatus'],
    queryFn: async () => {
      const response = await llmSettingsApi.getOllamaStatus()
      return response.data.data
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Local state for form
  const [settings, setSettings] = useState({
    chat: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      relevancyScore: 0.3
    },
    search: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1024,
      relevancyScore: 0.5
    },
    classification: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 512
    }
  })

  // Update local state when data is loaded
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData)
    }
  }, [settingsData])

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      console.log('[LLM Settings] Saving settings:', JSON.stringify(data, null, 2))
      const response = await llmSettingsApi.updateSettings(data)
      console.log('[LLM Settings] Save response:', response.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['llmSettings'])
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('[LLM Settings] Save error:', error)
      setSaveStatus('error')
      setMessage(error.response?.data?.message || 'Failed to update settings')
      setTimeout(() => {
        setSaveStatus('idle')
        setMessage('')
      }, 3000)
    }
  })

  // Pull Ollama model mutation with progress tracking
  const pullModelMutation = useMutation({
    mutationFn: async (modelName) => {
      setDownloadingModel(modelName)
      setDownloadProgress(0)
      setMessage(`Starting download of ${modelName}...`)
      
      const response = await llmSettingsApi.pullOllamaModel(modelName)
      
      // Start polling for progress
      pollDownloadProgress(modelName)
      
      return response.data
    },
    onSuccess: (data, modelName) => {
      // Initial success message
      setMessage(`Downloading ${modelName}... This may take several minutes.`)
    },
    onError: (error, modelName) => {
      setDownloadingModel(null)
      setDownloadProgress(0)
      setMessage(error.response?.data?.message || `Failed to download ${modelName}`)
      setTimeout(() => setMessage(''), 5000)
    }
  })

  // Poll Ollama to check if model download is complete
  const pollDownloadProgress = async (modelName) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check if model exists in installed models
        const response = await llmSettingsApi.getOllamaStatus()
        const installedModels = response.data.data.models || []
        const isInstalled = installedModels.some(m => m.name === modelName)
        
        if (isInstalled) {
          // Download complete!
          clearInterval(pollInterval)
          setDownloadingModel(null)
          setDownloadProgress(100)
          setMessage(`✓ Successfully downloaded ${modelName}!`)
          
          // Refresh the models list
          await refetchOllama()
          
          // Clear message after 3 seconds
          setTimeout(() => {
            setMessage('')
            setDownloadProgress(0)
          }, 3000)
        } else {
          // Still downloading - increment progress (simulated since Ollama API doesn't provide real progress)
          setDownloadProgress(prev => {
            if (prev < 90) return prev + 5
            return prev
          })
        }
      } catch (error) {
        console.error('Error polling download progress:', error)
      }
    }, 2000) // Check every 2 seconds

    // Safety timeout - stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (downloadingModel) {
        setDownloadingModel(null)
        setMessage(`Download of ${modelName} is taking longer than expected. Check Ollama logs.`)
        setTimeout(() => setMessage(''), 5000)
      }
    }, 600000)
  }

  // Delete Ollama model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (modelName) => {
      const response = await llmSettingsApi.deleteOllamaModel(modelName)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ollamaStatus'])
      setMessage('Model deleted successfully')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (error) => {
      setMessage(error.response?.data?.message || 'Failed to delete model')
    }
  })

  const handleSave = () => {
    setSaveStatus('saving')
    updateMutation.mutate(settings)
  }

  const handleAreaChange = (area, field, value) => {
    console.log(`[LLM Settings] Changing ${area}.${field} to:`, value)
    
    const newSettings = {
      ...settings,
      [area]: {
        ...settings[area],
        [field]: value
      }
    }
    
    console.log('[LLM Settings] New settings state:', newSettings)
    setSettings(newSettings)

    // Auto-save after 1 second of no changes
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    setSaveStatus('idle')
    const timeoutId = setTimeout(() => {
      console.log('[LLM Settings] Auto-saving settings:', newSettings)
      setSaveStatus('saving')
      updateMutation.mutate(newSettings)
    }, 1000)
    
    setAutoSaveTimeout(timeoutId)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [autoSaveTimeout])

  const toggleArea = (area) => {
    setExpandedAreas(prev => ({
      ...prev,
      [area]: !prev[area]
    }))
  }

  const getModelsForProvider = (provider, type = 'chat') => {
    if (!modelsData) return []
    
    if (provider === 'anthropic') {
      return modelsData.anthropic?.chat || []
    } else if (provider === 'ollama') {
      if (type === 'embeddings') {
        return modelsData.ollama?.embeddings || []
      }
      return modelsData.ollama?.chat || []
    } else {
      // OpenAI
      if (type === 'embeddings') {
        return modelsData.openai?.embeddings || []
      }
      return modelsData.openai?.chat || []
    }
  }

  const recommendedSettings = {
    chat: { temperature: 0.7, description: 'Balanced creativity for conversations' },
    search: { temperature: 0.3, description: 'Lower for more focused results' },
    classification: { temperature: 0.3, description: 'Deterministic categorization' }
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">LLM Settings</h2>
          <p className="text-slate-500">Configure AI providers and models for different app features</p>
        </div>
        {saveStatus !== 'idle' && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            saveStatus === 'saving' 
              ? 'bg-blue-50 text-blue-700' 
              : saveStatus === 'saved'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'error' && '✗ Error'}
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') || message.includes('Successfully') 
            ? 'bg-emerald-50 text-emerald-700' 
            : message.includes('Pulling')
            ? 'bg-blue-50 text-blue-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* AI Chat Settings */}
      <AreaSettings
        area="chat"
        title="AI Chat"
        description="Settings for the conversational AI chat feature"
        settings={settings.chat}
        expanded={expandedAreas.chat}
        onToggle={() => toggleArea('chat')}
        onChange={(field, value) => handleAreaChange('chat', field, value)}
        getModels={getModelsForProvider}
        recommended={recommendedSettings.chat}
        showRelevancy={true}
      />

      {/* Search Settings */}
      <AreaSettings
        area="search"
        title="Semantic Search"
        description="Relevancy threshold for filtering search results (embeddings configured system-wide)"
        settings={settings.search}
        expanded={expandedAreas.search}
        onToggle={() => toggleArea('search')}
        onChange={(field, value) => handleAreaChange('search', field, value)}
        getModels={getModelsForProvider}
        recommended={recommendedSettings.search}
        showRelevancy={true}
        hideModelSelection={true}
      />

      {/* Classification Settings */}
      <AreaSettings
        area="classification"
        title="Auto-Classification"
        description="Settings for automatic memory categorization and tagging"
        settings={settings.classification}
        expanded={expandedAreas.classification}
        onToggle={() => toggleArea('classification')}
        onChange={(field, value) => handleAreaChange('classification', field, value)}
        getModels={getModelsForProvider}
        recommended={recommendedSettings.classification}
        showRelevancy={false}
      />

      {/* Vector Embeddings Info */}
      <div className="memory-card p-6 space-y-4 bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Vector Embeddings</h3>
            <p className="text-sm text-slate-600 mt-1">
              Embedding model is configured system-wide via environment variables:
            </p>
            <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li><code className="bg-slate-200 px-1 rounded">EMBEDDING_PROVIDER</code> (openai or ollama)</li>
              <li><code className="bg-slate-200 px-1 rounded">EMBEDDING_MODEL</code> (e.g., text-embedding-3-small)</li>
            </ul>
            <p className="text-xs text-slate-500 mt-3 italic">
              Note: All memories must use the same embedding model for similarity search to work. 
              Changing this requires re-embedding all existing memories.
            </p>
          </div>
        </div>
      </div>

      {/* Ollama Management */}
      <div className="memory-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Ollama Models</h3>
              <p className="text-sm text-slate-500">
                {ollamaData?.available 
                  ? `${ollamaData.models.length} models installed` 
                  : 'Ollama service not available'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchOllama()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {ollamaData?.available && ollamaData.models.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-700">Installed Models</h4>
            {ollamaData.models.map(model => (
              <div key={model.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">{model.name}</p>
                  <p className="text-sm text-slate-500">Size: {model.size}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete model ${model.name}?`)) {
                      deleteModelMutation.mutate(model.name)
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {ollamaData?.recommended && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-700">Recommended Models</h4>
            <div className="grid gap-2">
              {ollamaData.recommended.chat.map(model => {
                const isDownloading = downloadingModel === model.name
                const isAnyDownloading = downloadingModel !== null
                
                return (
                  <div key={model.name} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{model.name}</p>
                      <p className="text-sm text-slate-500">{model.description} • {model.size}</p>
                      {isDownloading && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-primary-600 h-full transition-all duration-500 ease-out"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{downloadProgress}%</span>
                          </div>
                          <p className="text-xs text-slate-600">Downloading... This may take several minutes</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => pullModelMutation.mutate(model.name)}
                      disabled={isAnyDownloading}
                      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                        isDownloading
                          ? 'bg-primary-600 text-white cursor-wait'
                          : isAnyDownloading
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Pull
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info about auto-save */}
      <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
        Settings are automatically saved as you change them
      </div>
    </div>
  )
}

// Area Settings Component
function AreaSettings({ 
  area, 
  title, 
  description, 
  settings, 
  expanded, 
  onToggle, 
  onChange, 
  getModels,
  recommended,
  showRelevancy,
  hideModelSelection = false
}) {
  return (
    <div className="memory-card p-6 space-y-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {expanded && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          {!hideModelSelection && (
            <>
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select
                  value={settings.provider}
                  onChange={(e) => onChange('provider', e.target.value)}
                  className="input-field"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => onChange('model', e.target.value)}
                  className="input-field"
                >
                  {getModels(settings.provider).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Temperature</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary-600">{settings.temperature}</span>
                {recommended && (
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                      Recommended: {recommended.temperature} - {recommended.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Focused (0)</span>
              <span>Balanced (1)</span>
              <span>Creative (2)</span>
            </div>
          </div>

          {/* Max Tokens Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Max Tokens</label>
              <span className="text-sm font-medium text-primary-600">{settings.maxTokens}</span>
            </div>
            <input
              type="range"
              min="128"
              max="4096"
              step="128"
              value={settings.maxTokens}
              onChange={(e) => onChange('maxTokens', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>128</span>
              <span>2048</span>
              <span>4096</span>
            </div>
          </div>

          {/* Relevancy Score (for chat and search) */}
          {showRelevancy && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Relevancy Score Threshold</label>
                <span className="text-sm font-medium text-primary-600">{settings.relevancyScore}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.relevancyScore}
                onChange={(e) => onChange('relevancyScore', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>More Results (0)</span>
                <span>Balanced (0.5)</span>
                <span>Higher Quality (1)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
