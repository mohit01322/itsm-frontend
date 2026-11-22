import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { showError, withSla, isDone, isSlaViolated, isFull, workloadText, loadWorkloadLimit } from '../admin/shared'

// Technician page: my incidents, my workload, Acknowledge, Start work, Request delegation (needs admin approval), and Resolve (with notes).
// Admins can look at this page but cannot start work for technicians.
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
  const [delegating, setDelegating] = useState(null) // incident being delegated
  const [target, setTarget] = useState('')
  const [info, setInfo] = useState('')

  const { data, loading, error, reload } = useLoad(async () => {
    // Not linked yet: nothing to load, but return every field the page reads (a missing list blanked the whole page)
    if (notLinked) return { incidents: [], me: null, technicians: [], requests: [], limit: null }
    const [incidents, technicians, requests, limit] = await Promise.all([
      techId ? api.searchIncidents({ technicianId: techId }) : api.getIncidents(),
      api.getTechnicians(),
      isTechnician ? api.getMyDelegations() : Promise.resolve([]),
      loadWorkloadLimit(api),
    ])
    // Admin viewing this page (no technician id): show everything that is not closed.
    const list = techId ? incidents : incidents.filter((i) => i.status !== 'CLOSED')
    return { incidents: withSla(list).sort(byUrgency), me: technicians.find((t) => t.id === techId), technicians, requests, limit }
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

  // "I have seen it": the incident stays OPEN, the employee is told, and the time counts as the first response
  async function acknowledge(i) {
    setActionError('')
    setInfo('')
    setBusyId(i.id)
    try {
      await api.acknowledgeIncident(i.id)
      setInfo('Acknowledged #' + i.id + '. The employee has been told you have seen it.')
      reload()
    } catch (e) {
      setActionError(showError(e))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelegate(e) {
    e.preventDefault()
    if (!target) return setActionError('Choose a technician to delegate to.')
    setActionError('')
    setBusyId(delegating.id)
    try {
      const t = await api.delegateIncident(delegating.id, Number(target))
      setInfo('Request sent: delegate #' + delegating.id + ' to ' + t.toTechnician.name + '. The incident stays with you until an administrator approves.')
      setDelegating(null)
      reload()
    } catch (err) {
      setActionError(showError(err))
    } finally {
      setBusyId(null)
    }
  }

  const pendingFor = (id) => (data?.requests || []).find((r) => r.incidentId === id && r.status === 'PENDING')

  // Only the sensible next step is allowed: OPEN (acknowledge) -> IN_PROGRESS -> RESOLVED
  const actions = (i) => (
    <div className="row">
      {isTechnician && i.status === 'OPEN' && (
        <button className="btn small" disabled={!!i.acknowledgedAt || busyId === i.id} onClick={() => acknowledge(i)}>
          {i.acknowledgedAt ? 'Acknowledged' : 'Acknowledge'}
        </button>
      )}
      {isTechnician && (
        <button className="btn small" disabled={i.status !== 'OPEN' || busyId === i.id} onClick={() => setStatus(i.id, 'IN_PROGRESS')}>Start work</button>
      )}
      {isTechnician && (
        <button className="btn small" disabled={isDone(i) || busyId === i.id || !!pendingFor(i.id)} onClick={() => { setDelegating(i); setTarget(''); setActionError(''); setInfo('') }}>
          {pendingFor(i.id) ? 'Delegation pending' : 'Request delegation'}
        </button>
      )}
      <button className="btn small" disabled={!isTechnician || i.status !== 'IN_PROGRESS' || busyId === i.id} onClick={() => startResolve(i)}>Mark resolved</button>
    </div>
  )

  const list = data?.incidents || []
  const count = (fn) => list.filter(fn).length

  return (
    <>
      <div className="page-heading"><div><h2>{techId || isTechnician ? 'My assigned incidents' : 'Open incidents (all technicians)'}</h2><p>Manage your workload, request an approved handover, and keep incident progress up to date.</p></div></div>

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
            <div className="stat"><b>{workloadText(data.me, data.limit)}</b><span>My workload (active incidents{data.limit != null ? ' / limit' : ''})</span></div>
            <div className="stat"><b>{count((i) => i.status === 'OPEN' && !i.acknowledgedAt)}</b><span>New, not acknowledged</span></div>
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

      {delegating && (
        <form className="card" onSubmit={confirmDelegate} style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Request delegation of #{delegating.id} {delegating.title}</h3>
          <label>
            Delegate to
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Select technician...</option>
              {(data?.technicians || []).filter((t) => t.active !== false && t.id !== techId).map((t) => (
                <option key={t.id} value={t.id} disabled={isFull(t, data.limit)}>{t.name} ({(t.skills || []).join(', ') || 'no skills'}; workload {workloadText(t, data.limit)})</option>
              ))}
            </select>
          </label>
          <p className="workflow-note">An administrator must approve this. Until then the incident stays assigned to you.</p>
          <div className="row">
            <button className="btn" disabled={busyId === delegating.id}>Send request</button>
            <button type="button" className="btn small" onClick={() => setDelegating(null)}>Cancel</button>
          </div>
        </form>
      )}

      {info && <p className="workflow-message">{info}</p>}
      {loading && <p>Loading...</p>}
      {(error || actionError) && <p className="bad">{error || actionError}</p>}
      {data && !notLinked && <IncidentTable incidents={list} actions={actions} />}
      {data?.requests?.length > 0 && (
        <>
          <div className="section-head"><h3>My delegation requests</h3><span className="muted">{data.requests.length} request{data.requests.length === 1 ? '' : 's'}</span></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Incident</th><th>Requested technician</th><th>Status</th></tr></thead>
              <tbody>
                {data.requests.map((r) => (
                  <tr key={r.id}><td>#{r.incidentId} {r.incidentTitle}</td><td>{r.toTechnician?.name || '—'}</td><td><span className={'delegation-status ' + String(r.status || '').toLowerCase()}>{r.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data && list.length > 0 && <p className="muted">Click a title to see full details, the SLA status and resolution notes.</p>}
    </>
  )
}
