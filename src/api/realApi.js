// Talks to the real Spring Boot backend (through the /api proxy in vite.config.js).
// Auth is HTTP Basic: we send the header "Authorization: Basic base64(user:pass)" on every request.

function authHeader() {
  return sessionStorage.getItem('auth')
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (authHeader()) headers.Authorization = authHeader()
  const res = await fetch(path, { ...options, headers })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const e = new Error('Request failed (' + res.status + ')')
    e.status = res.status
    e.data = data // for a 400 this is {fieldName: "message"}
    throw e
  }
  return data
}

const normaliseRole = (r) => (r || '').replace('ROLE_', '')
const guessRole = (u) => (u === 'admin' ? 'ADMINISTRATOR' : u === 'technician' ? 'TECHNICIAN' : 'EMPLOYEE')

export async function login(username, password) {
  sessionStorage.setItem('auth', 'Basic ' + btoa(username + ':' + password))
  try {
    let me = null
    try {
      me = await request('/api/me') // requested from the backend team
    } catch (e) {
      if (e.status === 401) throw e
    }
    if (!me) {
      await request('/api/incidents') // proves the password is right
      me = { username, role: guessRole(username) } // fallback until /api/me exists
    }
    return { username: me.username, role: normaliseRole(me.role), technicianId: me.technicianId ?? null }
  } catch (e) {
    sessionStorage.removeItem('auth')
    throw e
  }
}

export function logout() {
  sessionStorage.removeItem('auth')
}

export const register = (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }) // requested

export const getIncidents = () => request('/api/incidents')

export function searchIncidents(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== '' && v != null && q.append(k, v))
  return request('/api/incidents/search?' + q.toString())
}

export const createIncident = (body) => request('/api/incidents', { method: 'POST', body: JSON.stringify(body) })
export const updateStatus = (id, status) => request('/api/incidents/' + id + '/status?status=' + status, { method: 'PUT' })
export const getTechnicians = () => request('/api/technicians')
export const assignIncident = (incidentId, strategy) => request('/api/assignments?incidentId=' + incidentId + '&strategy=' + strategy, { method: 'POST' })
export const getSla = (id) => request('/api/sla/' + id)
export const getNotifications = () => request('/api/notifications')
export const markRead = (id) => request('/api/notifications/' + id + '/read', { method: 'PUT' })
export const getAudit = (incidentId) => request('/api/audit/' + incidentId)
