// Talks to the real Spring Boot backend (through the /api proxy in vite.config.js).
// Auth is HTTP Basic: we send the header "Authorization: Basic base64(user:pass)" on every request.

function authHeader() {
  return sessionStorage.getItem('auth')
}

function clearAuth() {
  sessionStorage.removeItem('auth')
  sessionStorage.removeItem('user')
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(options.headers || {}) }
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
    // On 401, clear stored credentials so the user is forced to log in again
    if (res.status === 401) {
      clearAuth()
    }
    const e = new Error('Request failed (' + res.status + ')')
    e.status = res.status
    e.data = data // for a 400 this is {fieldName: "message"}
    throw e
  }
  return data
}

const normaliseRole = (r) => (r || '').replace('ROLE_', '')

export async function login(username, password) {
  sessionStorage.setItem('auth', 'Basic ' + btoa(username + ':' + password))
  try {
    const me = await request('/api/me')
    return { username: me.username, role: normaliseRole(me.role), technicianId: me.technicianId ?? null }
  } catch (e) {
    sessionStorage.removeItem('auth')
    throw e
  }
}

export function logout() {
  clearAuth()
}

export const register = (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) })

export const getIncidents = () => request('/api/incidents')

// Who am I (username, role, technicianId, email). Used by the My account page.
export const getMe = () => request('/api/me')

// Save my email address for notification emails. An empty value removes it.
export const updateEmail = (email) => request('/api/me/email', { method: 'PUT', body: JSON.stringify({ email }) })

// The free cloud server sleeps when nobody uses it and takes a minute or two to wake up.
// This asks /api/health every 5 seconds until the server answers. Returns true when it is awake.
export async function wakeUp({ onWaiting, isCancelled } = {}, maxSeconds = 240) {
  const until = Date.now() + maxSeconds * 1000
  let told = false
  while (Date.now() < until && !isCancelled?.()) {
    try {
      const res = await fetch('/api/health', { headers: { 'X-Requested-With': 'XMLHttpRequest' }, cache: 'no-store' })
      // 200 {"status":"UP"} = awake. A 4xx also comes from our backend (an older one without /api/health), so it is awake too.
      // 502/503/504 = the cloud is still starting it.
      const data = res.ok ? await res.json().catch(() => null) : null
      if (data?.status === 'UP' || (res.status >= 400 && res.status < 500)) return true
    } catch {
      // cannot reach it yet
    }
    if (!told) {
      onWaiting?.()
      told = true
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
  return false
}

// Change my own password. Afterwards every request must carry the new password, so the stored login is updated too.
export async function changePassword(currentPassword, newPassword) {
  const result = await request('/api/me/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
  const username = atob(authHeader().replace('Basic ', '')).split(':')[0]
  sessionStorage.setItem('auth', 'Basic ' + btoa(username + ':' + newPassword))
  return result
}

export const getMyIncidents = () => request('/api/incidents/mine')

export function searchIncidents(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== '' && v != null && q.append(k, v))
  return request('/api/incidents/search?' + q.toString())
}

export const createIncident = (body) => request('/api/incidents', { method: 'POST', body: JSON.stringify(body) })
export const updateStatus = (id, status, notes) => request('/api/incidents/' + id + '/status?status=' + status + (notes ? '&notes=' + encodeURIComponent(notes) : ''), { method: 'PUT' })
export const getTechnicians = () => request('/api/technicians')
export const assignIncident = (incidentId, strategy) => request('/api/assignments?incidentId=' + incidentId + '&strategy=' + strategy, { method: 'POST' })
export const getSla = (id) => request('/api/sla/' + id)
export const getNotifications = () => request('/api/notifications')
export const markRead = (id) => request('/api/notifications/' + id + '/read', { method: 'PUT' })
export const getAudit = (incidentId) => request('/api/audit/' + incidentId)

// Technicians: add and edit (used by the admin Technicians page)
export const createTechnician = (body) => request('/api/technicians', { method: 'POST', body: JSON.stringify(body) })
export const updateTechnician = (id, body) => request('/api/technicians/' + id, { method: 'PUT', body: JSON.stringify(body) })
