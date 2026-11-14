import { useParams, useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import useLoad from '../../components/useLoad'
import { StatusBadge, PriorityBadge } from '../../components/Badges'
import { useState } from 'react'

// MOHIY: this page is yours (shared by all roles). Status buttons only show for technician and admin.
// TODO: add resolution text, notes and the feedback form after the backend adds those endpoints.
export default function IncidentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useLoad(async () => {
    const list = await api.searchIncidents({ incidentId: id })
    const sla = await api.getSla(id)
    return { incident: list[0], sla }
  }, [id])
  const [actionError, setActionError] = useState('')
  const [notes, setNotes] = useState('')

  // currentStatus = the incident's status now. Resolving needs notes (the backend checks this too).
  async function setStatus(status, currentStatus) {
    setActionError('')
    const done = (s) => s === 'RESOLVED' || s === 'CLOSED'
    if (status === 'RESOLVED' && !done(currentStatus) && !notes.trim()) {
      setActionError('Write resolution notes before setting RESOLVED.')
      return
    }
    try {
      await api.updateStatus(id, status, done(status) ? notes.trim() : undefined)
      setNotes('')
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="bad">{error}</p>
  const { incident: i, sla } = data
  if (!i) return <p>Incident not found.</p>
  // Admins can change any incident; a technician only the incidents assigned to them
  const canChange = user.role === 'ADMINISTRATOR' || (user.role === 'TECHNICIAN' && user.technicianId != null && i.assignedTechnician?.id === user.technicianId)

  return (
    <div className="card">
      <p><button className="btn small" onClick={() => navigate(-1)}>&larr; Back</button></p>
      <h2>#{i.id} {i.title}</h2>
      <p><PriorityBadge priority={i.priority} /> <StatusBadge status={i.status} /></p>
      <p>{i.description}</p>
      <dl>
        <dt>Category</dt><dd>{i.category}</dd>
        <dt>Impact / Urgency / Criticality</dt><dd>{i.impact} / {i.urgency} / {i.businessCriticality}</dd>
        <dt>Assigned technician</dt><dd>{i.assignedTechnician?.name || 'Not assigned yet'}</dd>
        <dt>Created</dt><dd>{new Date(i.createdAt).toLocaleString()}</dd>
        <dt>SLA deadline</dt>
        <dd className={sla.slaViolated ? 'bad' : ''}>{new Date(sla.slaDeadline).toLocaleString()} {sla.slaViolated ? '(SLA violated)' : '(within SLA)'}</dd>
        {i.resolvedAt && (<><dt>Resolved</dt><dd>{new Date(i.resolvedAt).toLocaleString()}</dd></>)}
        {i.resolutionNotes && (<><dt>Resolution notes</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{i.resolutionNotes}</dd></>)}
      </dl>
      {canChange && i.status !== 'RESOLVED' && i.status !== 'CLOSED' && (
        <label>
          Resolution notes <span className="muted">(needed to set RESOLVED)</span>
          <textarea rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      )}
      {canChange && (
        <div className="row">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
            <button key={s} className="btn small" disabled={i.status === s} onClick={() => setStatus(s, i.status)}>Set {s.replace('_', ' ')}</button>
          ))}
        </div>
      )}
      {actionError && <p className="bad">{actionError}</p>}
    </div>
  )
}
