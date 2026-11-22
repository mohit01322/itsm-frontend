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
// Incidents are assigned automatically (skills first, then workload) when they are created.
// Admin override: change the technician of an incident.
export const overrideAssignment = (incidentId, technicianId) => request('/api/assignments/override', { method: 'POST', body: JSON.stringify({ incidentId, technicianId }) })
// Technician delegation REQUEST: the incident stays with the technician until an admin approves.
export const delegateIncident = (incidentId, technicianId) => request('/api/assignments/' + incidentId + '/delegate', { method: 'POST', body: JSON.stringify({ technicianId }) })
export const getDelegations = (status = 'PENDING') => request('/api/assignments/delegations?status=' + status) // admin
export const getMyDelegations = () => request('/api/assignments/delegations/mine') // technician
export const approveDelegation = (id) => request('/api/assignments/delegations/' + id + '/approve', { method: 'POST' })
export const rejectDelegation = (id) => request('/api/assignments/delegations/' + id + '/reject', { method: 'POST' })
export const getSla = (id) => request('/api/sla/' + id)
export const getNotifications = () => request('/api/notifications')
export const markRead = (id) => request('/api/notifications/' + id + '/read', { method: 'PUT' })
export const getAudit = (incidentId) => request('/api/audit/' + incidentId)

// Technicians: add and edit (used by the admin Technicians page)
export const createTechnician = (body) => request('/api/technicians', { method: 'POST', body: JSON.stringify(body) })
export const updateTechnician = (id, body) => request('/api/technicians/' + id, { method: 'PUT', body: JSON.stringify(body) })

export const updateIncident = (id, body) => request('/api/incidents/' + id, { method: 'PUT', body: JSON.stringify(body) })
export const getIncidentNotes = (id) => request('/api/incidents/' + id + '/notes')
export const addIncidentNote = (id, body) => request('/api/incidents/' + id + '/notes', { method: 'POST', body: JSON.stringify(body) })
export const getFeedback = (id) => request('/api/incidents/' + id + '/feedback')
export const submitFeedback = (id, body) => request('/api/incidents/' + id + '/feedback', { method: 'POST', body: JSON.stringify(body) })
export const getServices = () => request('/api/services')
export const createService = (body) => request('/api/services', { method: 'POST', body: JSON.stringify(body) })
export const updateService = (id, body) => request('/api/services/' + id, { method: 'PUT', body: JSON.stringify(body) })
export const getCategories = () => request('/api/categories')
export const createCategory = (body) => request('/api/categories', { method: 'POST', body: JSON.stringify(body) })
export const updateCategory = (id, body) => request('/api/categories/' + id, { method: 'PUT', body: JSON.stringify(body) })
export const getSlaPolicies = () => request('/api/sla-policies')
export const updateSlaPolicy = (priority, body) => request('/api/sla-policies/' + priority, { method: 'PUT', body: JSON.stringify(body) })
export const getUsers = () => request('/api/users')
export const updateUser = (id, body) => request('/api/users/' + id, { method: 'PUT', body: JSON.stringify(body) })

// Admin: how new incidents are assigned. Returns { strategy, options: [{ value, label, description }] }
export const getAssignmentStrategy = () => request('/api/settings/assignment-strategy')
export const updateAssignmentStrategy = (strategy) => request('/api/settings/assignment-strategy', { method: 'PUT', body: JSON.stringify({ strategy }) })

// Technician: "I have seen this incident". It stays OPEN; the time counts as the first response for the SLA.
export const acknowledgeIncident = (id) => request('/api/incidents/' + id + '/acknowledge', { method: 'POST' })

// Technician / admin: how similar finished incidents were fixed. [{ incidentId, title, category, resolutionNotes, matchPercent }]
export const getSuggestions = (id) => request('/api/incidents/' + id + '/suggestions')

// Admin: SLA for one IT service (replaces the standard SLA for that service). Body: { responseTimeMinutes, resolutionTimeMinutes, warningTimeMinutes }
export const getServiceSlaPolicies = () => request('/api/sla-policies/services')
export const updateServiceSlaPolicy = (serviceId, priority, body) => request('/api/sla-policies/services/' + serviceId + '/' + priority, { method: 'PUT', body: JSON.stringify(body) })
export const deleteServiceSlaPolicy = (serviceId, priority) => request('/api/sla-policies/services/' + serviceId + '/' + priority, { method: 'DELETE' })

// Most active incidents one technician may have. Returns { maxActiveIncidents }. Technicians and admins can read it; admins change it.
export const getWorkloadLimit = () => request('/api/settings/workload-limit')
export const updateWorkloadLimit = (maxActiveIncidents) => request('/api/settings/workload-limit', { method: 'PUT', body: JSON.stringify({ maxActiveIncidents }) })
