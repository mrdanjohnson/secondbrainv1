import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Bell, Palette, Database, Trash2, AlertTriangle, Cpu, Code, Copy, Check, ExternalLink, Key } from 'lucide-react'
import LLMSettings from '../components/LLMSettings'
import CleanupManagement from '../components/CleanupManagement'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const [tokenCopied, setTokenCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState('')

  const getToken = () => {
    return localStorage.getItem('token') || ''
  }

  const copyToClipboard = async (text, type = 'token') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'token') {
        setTokenCopied(true)
        setTimeout(() => setTokenCopied(false), 2000)
      } else {
        setCodeCopied(type)
        setTimeout(() => setCodeCopied(''), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleProfileSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await updateProfile({ name: profile.name })
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API', icon: Code },
    { id: 'llm', label: 'LLM Settings', icon: Cpu },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data', icon: Database }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="memory-card p-0 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Profile Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  className="input-field bg-slate-50"
                  placeholder="you@example.com"
                  disabled
                />
                <p className="text-xs text-slate-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Change Password</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="input-field"
                />
              </div>

              <button
                className="btn-primary"
                disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm}
              >
                Update Password
              </button>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">API Access</h3>
                <p className="text-sm text-slate-600">
                  Use the API to integrate Second Brain with iOS Shortcuts, external apps, and automation tools.
                </p>
              </div>

              {/* Authentication Token */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary-600" />
                    <h4 className="font-semibold text-slate-800">Authentication Token</h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getToken(), 'token')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {tokenCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg overflow-x-auto">
                  <code className="text-xs text-emerald-400 font-mono break-all">
                    {getToken() || 'No token available'}
                  </code>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  ⚠️ Keep this token secret! It provides full access to your Second Brain account.
                </p>
              </div>

              {/* API Base URL */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-slate-800 mb-2">API Base URL</h4>
                <div className="bg-slate-900 p-3 rounded-lg">
                  <code className="text-sm text-blue-400 font-mono">
                    {window.location.protocol}//{window.location.hostname}:3001/api
                  </code>
                </div>
              </div>

              {/* iOS Shortcuts Example */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <div className="flex items-center gap-2 text-white">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.8 6.1L15.4 3.7c-.6-.6-1.5-.6-2.1 0l-10 10c-.3.3-.3.7 0 1l2.4 2.4c.6.6 1.5.6 2.1 0l10-10c.3-.3.3-.8 0-1.1zM5.8 15.7L4.3 14.2l8.6-8.6 1.5 1.5-8.6 8.6z"/>
                      <path d="M19.4 8.3l-2.4-2.4c-.3-.3-.7-.3-1 0L14.6 7.3c-.3.3-.3.7 0 1l2.4 2.4c.3.3.7.3 1 0l1.4-1.4c.3-.3.3-.7 0-1z"/>
                    </svg>
                    <h4 className="font-semibold text-lg">iOS Shortcuts Integration</h4>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-slate-600">
                    Create a Shortcut to capture memories with Siri voice commands or from the iOS Share Sheet.
                  </p>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-slate-800">Quick Setup:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 pl-2">
                      <li>Open <strong>Shortcuts</strong> app on your iPhone/iPad</li>
                      <li>Create a new shortcut and add <strong>"Get Contents of URL"</strong></li>
                      <li>Configure the API request (see example below)</li>
                      <li>Add to Siri: <strong>"Hey Siri, save a memory"</strong></li>
                    </ol>
                  </div>

                  <a
                    href="https://github.com/your-repo/docs/IOS-SHORTCUTS-TUTORIAL.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Full Tutorial
                  </a>
                </div>
              </div>

              {/* API Examples */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800">API Examples</h4>

                {/* Create Memory Example */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Create a Memory</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST ${window.location.protocol}//${window.location.hostname}:3001/api/memories \\
  -H "Authorization: Bearer ${getToken()}" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Your memory text here", "tags": ["optional", "tags"]}'`, 'create')}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                    >
                      {codeCopied === 'create' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {codeCopied === 'create' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-slate-900 p-4 overflow-x-auto">
                    <pre className="text-xs text-slate-300 font-mono">
{`curl -X POST ${window.location.protocol}//${window.location.hostname}:3001/api/memories \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Your memory text here",
    "tags": ["optional", "tags"]
  }'`}
                    </pre>
                  </div>
                </div>

                {/* Search Example */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Semantic Search</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST ${window.location.protocol}//${window.location.hostname}:3001/api/search/semantic \\
  -H "Authorization: Bearer ${getToken()}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "your search query", "limit": 10}'`, 'search')}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                    >
                      {codeCopied === 'search' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {codeCopied === 'search' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-slate-900 p-4 overflow-x-auto">
                    <pre className="text-xs text-slate-300 font-mono">
{`curl -X POST ${window.location.protocol}//${window.location.hostname}:3001/api/search/semantic \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "your search query",
    "limit": 10
  }'`}
                    </pre>
                  </div>
                </div>

                {/* Get Memories Example */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">List Memories</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X GET "${window.location.protocol}//${window.location.hostname}:3001/api/memories?limit=20&category=Idea" \\
  -H "Authorization: Bearer ${getToken()}"`, 'list')}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                    >
                      {codeCopied === 'list' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {codeCopied === 'list' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-slate-900 p-4 overflow-x-auto">
                    <pre className="text-xs text-slate-300 font-mono">
{`curl -X GET "${window.location.protocol}//${window.location.hostname}:3001/api/memories?limit=20&category=Idea" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Available Endpoints */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Available Endpoints</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { method: 'POST', path: '/memories', desc: 'Create a new memory' },
                    { method: 'GET', path: '/memories', desc: 'List all memories with filters' },
                    { method: 'GET', path: '/memories/:id', desc: 'Get a specific memory' },
                    { method: 'PUT', path: '/memories/:id', desc: 'Update a memory' },
                    { method: 'DELETE', path: '/memories/:id', desc: 'Delete a memory' },
                    { method: 'POST', path: '/search/semantic', desc: 'Semantic search memories' },
                    { method: 'POST', path: '/chat/quick', desc: 'Quick RAG question' },
                    { method: 'POST', path: '/chat/sessions', desc: 'Create chat session' },
                    { method: 'GET', path: '/categories', desc: 'List all categories' }
                  ].map((endpoint, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                      <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                        endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                        endpoint.method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
                        endpoint.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1">
                        <code className="text-xs font-mono text-slate-700">{endpoint.path}</code>
                        <p className="text-xs text-slate-500 mt-0.5">{endpoint.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">💡 Pro Tips</h4>
                <ul className="space-y-1 text-sm text-purple-800 list-disc list-inside">
                  <li>When you create a memory, AI automatically generates summary, category, and tags</li>
                  <li>You can add your own tags - they'll be merged with AI-generated tags</li>
                  <li>All content gets vector embeddings for semantic search</li>
                  <li>Use the iOS Shortcuts tutorial for mobile integration</li>
                  <li>Rate limit: 500 requests per 15 minutes</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'llm' && <LLMSettings />}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Notification Preferences</h3>
              
              <div className="space-y-3">
                {[
                  { id: 'email_digest', label: 'Weekly digest email', desc: 'Summary of your memories' },
                  { id: 'reminders', label: 'Task reminders', desc: 'Get reminded about tasks' },
                  { id: 'suggestions', label: 'AI suggestions', desc: 'Suggestions for organizing' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-700">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Theme</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', bg: 'bg-white' },
                  { id: 'dark', label: 'Dark', bg: 'bg-slate-800' },
                  { id: 'system', label: 'System', bg: 'bg-gradient-to-r from-white to-slate-800' }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    <div className={`w-full h-16 rounded-lg ${theme.bg} border border-slate-200 mb-2`} />
                    <p className="font-medium text-slate-700">{theme.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8">
              {/* Cleanup Management Section */}
              <CleanupManagement />

              {/* Divider */}
              <div className="border-t border-slate-200"></div>

              {/* Data Management Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Data Management</h3>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Danger Zone</p>
                      <p className="text-sm text-amber-700 mt-1">
                        These actions are irreversible. Please proceed with caution.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-700">Delete all memories</p>
                      <p className="text-sm text-slate-500">This will permanently delete all your memories</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Delete All
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-700">Export data</p>
                      <p className="text-sm text-slate-500">Download all your data as JSON</p>
                    </div>
                  </div>
                  <button className="btn-secondary">
                    Export
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
