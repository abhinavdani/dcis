import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.login(username, password)
      localStorage.setItem('dcis_token', data.token)
      localStorage.setItem('dcis_user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏛</div>
          <h1 className="text-2xl font-bold text-blue-900">DCIS</h1>
          <p className="text-gray-600 text-sm mt-1">District CapEx Intelligence System</p>
          <p className="text-gray-400 text-xs">Government of Chhattisgarh · Finance Department</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required autoFocus autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium text-sm
                       hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 border-t pt-4">
          <p className="text-xs text-gray-400 text-center mb-2">Demo credentials</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              ['fin_secretary', 'Finance Secy'],
              ['collector_dhamtari', 'Collector'],
              ['je_sukma', 'JE Sukma'],
              ['ddo_raipur', 'DDO Raipur'],
            ].map(([u, label]) => (
              <button key={u} type="button"
                onClick={() => { setUsername(u); setPassword('demo123') }}
                className="text-left bg-gray-50 hover:bg-blue-50 border rounded px-2 py-1.5 transition-colors">
                <span className="text-gray-500">{label}</span>
                <span className="block text-gray-400 font-mono text-xs">{u}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
