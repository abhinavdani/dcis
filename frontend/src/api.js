const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function getToken() {
  return localStorage.getItem('dcis_token')
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = `Token ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('dcis_token')
    localStorage.removeItem('dcis_user')
    window.location.href = '/login'
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: (username, password) =>
    request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  overview: () => request('/overview/'),
  projects: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/projects/${qs ? '?' + qs : ''}`)
  },
  project: (id) => request(`/projects/${id}/`),
  alerts: () => request('/alerts/'),
  stageUpdate: (id, data) =>
    request(`/projects/${id}/stage-update/`, { method: 'POST', body: JSON.stringify(data) }),
  updateFinancials: (id, data) =>
    request(`/projects/${id}/financials/`, { method: 'PATCH', body: JSON.stringify(data) }),
}
