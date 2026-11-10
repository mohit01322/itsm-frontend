// Fake backend. Same function names and data shapes as realApi.js, so pages never know the difference.
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

const USERS = [
  { username: 'admin', password: 'admin123', role: 'ADMINISTRATOR' },
  { username: 'technician', password: 'tech123', role: 'TECHNICIAN', technicianId: 1 },
  { username: 'employee', password: 'employee123', role: 'EMPLOYEE' },
]

let technicians = [
  { id: 1, name: 'Asha Rao', skills: ['NETWORK', 'HARDWARE'], activeIncidentCount: 2, active: true },
  { id: 2, name: 'Ravi Kumar', skills: ['SOFTWARE', 'DATABASE'], activeIncidentCount: 1, active: true },
  { id: 3, name: 'Meera Nair', skills: ['SECURITY', 'NETWORK'], activeIncidentCount: 0, active: true },
  { id: 4, name: 'Imran Shaikh', skills: ['HARDWARE'], activeIncidentCount: 0, active: false },
]

const hours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString()

let incidents = [
  { id: 1, title: 'Wi-Fi down in Block C', description: 'No connectivity on floors 2 and 3.', category: 'NETWORK', priority: 'P1', status: 'IN_PROGRESS', impact: 'HIGH', urgency: 'HIGH', businessCriticality: 'HIGH', createdAt: hours(-3), resolvedAt: null, slaDeadline: hours(1), slaViolated: false, assignedTechnician: technicians[0] },
  { id: 2, title: 'Laptop will not boot', description: 'Black screen after the logo.', category: 'HARDWARE', priority: 'P3', status: 'OPEN', impact: 'MEDIUM', urgency: 'MEDIUM', businessCriticality: 'LOW', createdAt: hours(-30), resolvedAt: null, slaDeadline: hours(-6), slaViolated: true, assignedTechnician: null },
  { id: 3, title: 'Cannot access HR portal', description: 'Login returns error 500.', category: 'SOFTWARE', priority: 'P2', status: 'IN_PROGRESS', impact: 'HIGH', urgency: 'MEDIUM', businessCriticality: 'MEDIUM', createdAt: hours(-6), resolvedAt: null, slaDeadline: hours(6), slaViolated: false, assignedTechnician: technicians[1] },
  { id: 4, title: 'Printer offline on floor 1', description: 'Shows offline for everyone.', category: 'HARDWARE', priority: 'P4', status: 'RESOLVED', impact: 'LOW', urgency: 'LOW', businessCriticality: 'LOW', createdAt: hours(-60), resolvedAt: hours(-48), slaDeadline: hours(-12), slaViolated: false, assignedTechnician: technicians[0] },
  { id: 5, title: 'Suspicious email received', description: 'Looks like phishing.', category: 'SECURITY', priority: 'P2', status: 'OPEN', impact: 'HIGH', urgency: 'MEDIUM', businessCriticality: 'HIGH', createdAt: hours(-2), resolvedAt: null, slaDeadline: hours(8), slaViolated: false, assignedTechnician: null },
  { id: 6, title: 'Database report is slow', description: 'Monthly report takes 15 minutes.', category: 'DATABASE', priority: 'P3', status: 'CLOSED', impact: 'MEDIUM', urgency: 'LOW', businessCriticality: 'MEDIUM', createdAt: hours(-120), resolvedAt: hours(-100), slaDeadline: hours(-72), slaViolated: false, assignedTechnician: technicians[1] },
]

let notifications = [
  { id: 1, incidentId: 1, message: 'Incident #1 was assigned to Asha Rao', channel: 'IN_APP', createdAt: hours(-3), read: false },
  { id: 2, incidentId: 4, message: 'Incident #4 was resolved', channel: 'IN_APP', createdAt: hours(-48), read: true },
  { id: 3, incidentId: 2, message: 'Incident #2 has breached its SLA', channel: 'IN_APP', createdAt: hours(-5), read: false },
]

let audit = [
  { id: 1, incidentId: 1, action: 'INCIDENT_CREATED', performedBy: 'employee', timestamp: hours(-3), details: 'Created with priority P1' },
  { id: 2, incidentId: 1, action: 'TECHNICIAN_ASSIGNED', performedBy: 'admin', timestamp: hours(-2.9), details: 'Assigned to Asha Rao (SKILL)' },
  { id: 3, incidentId: 1, action: 'STATUS_UPDATED', performedBy: 'technician', timestamp: hours(-2.5), details: 'OPEN to IN_PROGRESS' },
]

function fail(status, data) {
  const e = new Error('Request failed (' + status + ')')
  e.status = status
  e.data = data
  return e
}

function priorityFor(impact, urgency) {
  const v = { HIGH: 3, MEDIUM: 2, LOW: 1 }
  const score = v[impact] + v[urgency]
  return score >= 6 ? 'P1' : score >= 5 ? 'P2' : score >= 3 ? 'P3' : 'P4'
}

const slaHours = { P1: 4, P2: 8, P3: 24, P4: 72 }

export async function login(username, password) {
  await delay()
  const u = USERS.find((x) => x.username === username && x.password === password)
  if (!u) throw fail(401, { error: 'Wrong username or password' })
  return { username: u.username, role: u.role, technicianId: u.technicianId ?? null }
}

export function logout() {}

export async function register(body) {
  await delay()
  const errors = {}
  if (!body.username) errors.username = 'Username is required'
  if (!body.password || body.password.length < 6) errors.password = 'Password must be at least 6 characters'
  if (USERS.some((u) => u.username === body.username)) errors.username = 'Username already taken'
  if (Object.keys(errors).length) throw fail(400, errors)
  USERS.push({ username: body.username, password: body.password, role: 'EMPLOYEE' })
  return { username: body.username, role: 'EMPLOYEE' }
}

export async function getIncidents() {
  await delay()
  return [...incidents].sort((a, b) => b.id - a.id)
}

export async function searchIncidents(p = {}) {
  await delay()
  return incidents.filter(
    (i) =>
      (!p.incidentId || i.id === Number(p.incidentId)) &&
      (!p.priority || i.priority === p.priority) &&
      (!p.status || i.status === p.status) &&
      (!p.category || i.category === p.category) &&
      (!p.technicianId || i.assignedTechnician?.id === Number(p.technicianId)) &&
      (!p.title || i.title.toLowerCase().includes(p.title.toLowerCase()))
  )
}

export async function createIncident(body) {
  await delay()
  const errors = {}
  if (!body.title?.trim()) errors.title = 'Title is required'
  if (!body.description?.trim()) errors.description = 'Description is required'
  if (!body.category) errors.category = 'Category is required'
  if (!body.impact) errors.impact = 'Impact is required'
  if (!body.urgency) errors.urgency = 'Urgency is required'
  if (!body.businessCriticality) errors.businessCriticality = 'Business criticality is required'
  if (Object.keys(errors).length) throw fail(400, errors)
  const priority = priorityFor(body.impact, body.urgency)
  const inc = {
    ...body,
    id: Math.max(0, ...incidents.map((i) => i.id)) + 1,
    priority,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    slaDeadline: hours(slaHours[priority]),
    slaViolated: false,
    assignedTechnician: null,
  }
  incidents.push(inc)
  notifications.push({ id: notifications.length + 1, incidentId: inc.id, message: 'Incident #' + inc.id + ' was created', channel: 'IN_APP', createdAt: inc.createdAt, read: false })
  return inc
}

export async function updateStatus(id, status) {
  await delay()
  const inc = incidents.find((i) => i.id === Number(id))
  if (!inc) throw fail(400, { error: 'Incident not found' })
  if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) throw fail(400, { error: 'Invalid status' })
  audit.push({ id: audit.length + 1, incidentId: inc.id, action: 'STATUS_UPDATED', performedBy: 'you', timestamp: new Date().toISOString(), details: inc.status + ' to ' + status })
  inc.status = status
  if (status === 'RESOLVED' || status === 'CLOSED') inc.resolvedAt = new Date().toISOString()
  return inc
}

export async function getTechnicians() {
  await delay()
  return technicians
}

export async function assignIncident(incidentId, strategy) {
  await delay()
  const inc = incidents.find((i) => i.id === Number(incidentId))
  if (!inc) throw fail(400, { error: 'Incident not found' })
  const pool = technicians.filter((t) => t.active)
  let pick
  if (strategy === 'SKILL') pick = pool.find((t) => t.skills.includes(inc.category)) || pool[0]
  else pick = [...pool].sort((a, b) => a.activeIncidentCount - b.activeIncidentCount)[0]
  inc.assignedTechnician = pick
  pick.activeIncidentCount += 1
  audit.push({ id: audit.length + 1, incidentId: inc.id, action: 'TECHNICIAN_ASSIGNED', performedBy: 'you', timestamp: new Date().toISOString(), details: 'Assigned to ' + pick.name + ' (' + strategy + ')' })
  return pick
}

export async function getSla(id) {
  await delay(100)
  const inc = incidents.find((i) => i.id === Number(id))
  return { incidentId: inc.id, priority: inc.priority, slaDeadline: inc.slaDeadline, slaViolated: inc.slaViolated }
}

export async function getNotifications() {
  await delay()
  return [...notifications].sort((a, b) => b.id - a.id)
}

export async function markRead(id) {
  await delay(100)
  const n = notifications.find((x) => x.id === Number(id))
  n.read = true
  return n
}

export async function getAudit(incidentId) {
  await delay()
  return audit.filter((a) => a.incidentId === Number(incidentId))
}
