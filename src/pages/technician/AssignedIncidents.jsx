import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { showError, withSla, isDone, isSlaViolated } from '../admin/shared'

// Technician page: my incidents, my workload, Start work, and Resolve (with notes).
// Backend: GET /api/incidents/search?technicianId=, GET /api/technicians, PUT /api/incidents/{id}/status?status=&notes=
// Which technician I am comes from GET /api/me at login. An admin links each login to a technician on the Technicians page.

// Unfinished work first, then by priority (P1 first).
const byUrgency = (a, b) => isDone(a) - isDone(b) || (a.priority || '').localeCompare(b.priority || '') || a.id - b.id

export default function AssignedIncidents() {
  const { user } = useAuth()
  const isTechnician = user.role === 'TECHNICIAN'
  const techId = user.technicianId ?? null
  const notLinked = isTechnician && !techId
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [resolving, setResolving] = useState(null) // the incident being resolved, or null
  const [notes, setNotes] = useState('')

  const { data, loading, error, reload } = useLoad(async () => {
    if (notLinked) return { incidents: [], me: null }
    const [incidents, technicians] = await Promise.all([
      techId ? api.searchIncidents({ technicianId: techId }) : api.getIncidents(),
      api.getTechnicians(),
    ])
    // Admin viewing this page (no technician id): show everything that is not closed.
    const list = techId ? incidents : incidents.filter((i) => i.status !== 'CLOSED')
    return { incidents: withSla(list).sort(byUrgency), me: technicians.find((t) => t.id === techId) }
  }, [techId, notLinked])

  // Returns true when the change worked
  async function setStatus(id, status, resolutionNotes) {
    setActionError('')
    setBusyId(id)
    try {
      await api.updateStatus(id, status, resolutionNotes)
      reload()
      return true
    } catch (e) {
      setActionError(showError(e))
      return false
    } finally {
      setBusyId(null)
    }
  }

  function startResolve(i) {
    setResolving(i)
    setNotes('')
    setActionError('')
  }

  async function confirmResolve(e) {
    e.preventDefault()
    if (!notes.trim()) return setActionError('Write what was wrong and what you did before resolving.')
    if (await setStatus(resolving.id, 'RESOLVED', notes.trim())) setResolving(null)
  }

  // Only the sensible next step is allowed: OPEN -> IN_PROGRESS -> RESOLVED
  const actions = (i) => (
    <div className="row">
      <button className="btn small" disabled={i.status !== 'OPEN' || busyId === i.id} onClick={() => setStatus(i.id, 'IN_PROGRESS')}>Start work</button>
      <button className="btn small" disabled={i.status !== 'IN_PROGRESS' || busyId === i.id} onClick={() => startResolve(i)}>Mark resolved</button>
    </div>
  )

  const list = data?.incidents || []
  const count = (fn) => list.filter(fn).length

  return (
    <>
      <h2>{techId || isTechnician ? 'My assigned incidents' : 'Open incidents (all technicians)'}</h2>

      {notLinked && (
        <p className="bad">
          Your login ({user.username}) is not linked to a technician yet. Ask an admin to set it on the Technicians page,
          then log out and log in again.
        </p>
      )}
      {data && techId && !data.me && (
        <p className="bad">Technician #{techId} was not found. Ask an admin to check the Technicians page.</p>
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

      {resolving && (
        <form className="card" onSubmit={confirmResolve} style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Resolve #{resolving.id} {resolving.title}</h3>
          <label>
            Resolution notes (required)
            <textarea rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="What was wrong, and what did you do to fix it?" autoFocus />
          </label>
          <div className="row">
            <button className="btn" disabled={busyId === resolving.id}>Resolve incident</button>
            <button type="button" className="btn small" onClick={() => { setResolving(null); setActionError('') }}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {(error || actionError) && <p className="bad">{error || actionError}</p>}
      {data && !notLinked && <IncidentTable incidents={list} actions={actions} />}
      {data && list.length > 0 && <p className="muted">Click a title to see full details, the SLA status and resolution notes.</p>}
    </>
  )
}
