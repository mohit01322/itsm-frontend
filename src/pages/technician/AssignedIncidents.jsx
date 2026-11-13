import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { showError, withSla, isDone, isSlaViolated } from '../admin/shared'

// Technician page: my incidents, my workload, and Start / Resolve buttons.
// Backend: GET /api/incidents/search?technicianId=, GET /api/technicians, PUT /api/incidents/{id}/status

// The backend does not tell us yet which technician is logged in (no /api/me).
// For the demo, the "technician" login is treated as technician #1 (the first technician the admin adds).
const DEMO_TECHNICIAN_ID = 1

// Unfinished work first, then by priority (P1 first).
const byUrgency = (a, b) => isDone(a) - isDone(b) || (a.priority || '').localeCompare(b.priority || '') || a.id - b.id

export default function AssignedIncidents() {
  const { user } = useAuth()
  const techId = user.technicianId ?? (user.role === 'TECHNICIAN' ? DEMO_TECHNICIAN_ID : null)
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useLoad(async () => {
    const [incidents, technicians] = await Promise.all([
      techId ? api.searchIncidents({ technicianId: techId }) : api.getIncidents(),
      api.getTechnicians(),
    ])
    // Admin viewing this page (no technician id): show everything that is not closed.
    const list = techId ? incidents : incidents.filter((i) => i.status !== 'CLOSED')
    return { incidents: withSla(list).sort(byUrgency), me: technicians.find((t) => t.id === techId) }
  }, [techId])

  async function setStatus(id, status) {
    setActionError('')
    setBusyId(id)
    try {
      await api.updateStatus(id, status)
      reload()
    } catch (e) {
      setActionError(showError(e))
    } finally {
      setBusyId(null)
    }
  }

  // Only the sensible next step is allowed: OPEN -> IN_PROGRESS -> RESOLVED
  const actions = (i) => (
    <div className="row">
      <button className="btn small" disabled={i.status !== 'OPEN' || busyId === i.id} onClick={() => setStatus(i.id, 'IN_PROGRESS')}>Start work</button>
      <button className="btn small" disabled={i.status !== 'IN_PROGRESS' || busyId === i.id} onClick={() => setStatus(i.id, 'RESOLVED')}>Mark resolved</button>
    </div>
  )

  const list = data?.incidents || []
  const count = (fn) => list.filter(fn).length

  return (
    <>
      <h2>{techId ? 'My assigned incidents' : 'Open incidents (all technicians)'}</h2>

      {data && techId && !data.me && (
        <p className="bad">Technician #{techId} does not exist yet. Log in as admin and add technicians first.</p>
      )}

      {data?.me && (
        <>
          <p>
            <strong>{data.me.name}</strong> <span className="muted">(technician #{data.me.id})</span>
            {' · '}Skills: {(data.me.skills || []).join(', ') || '-'}
            {' · '}{data.me.active === false ? 'Not available for new work' : 'Available'}
          </p>
          <div className="stats">
            <div className="stat"><b>{data.me.activeIncidentCount ?? 0}</b><span>My workload (active incidents)</span></div>
            <div className="stat"><b>{count((i) => i.status === 'OPEN')}</b><span>Waiting to start</span></div>
            <div className="stat"><b>{count((i) => i.status === 'IN_PROGRESS')}</b><span>In progress</span></div>
            <div className="stat"><b>{count((i) => !isDone(i) && isSlaViolated(i))}</b><span>Past SLA deadline</span></div>
          </div>
        </>
      )}

      {loading && <p>Loading...</p>}
      {(error || actionError) && <p className="bad">{error || actionError}</p>}
      {data && <IncidentTable incidents={list} actions={actions} />}
      {data && list.length > 0 && <p className="muted">Click a title to see full details and the SLA status.</p>}
    </>
  )
}
