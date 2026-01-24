import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Bell, Palette, Database, Trash2, AlertTriangle, Cpu } from 'lucide-react'
import LLMSettings from '../components/LLMSettings'

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
          )}
        </div>
      </div>
    </div>
  )
}
