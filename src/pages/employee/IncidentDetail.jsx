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

  async function setStatus(status) {
    setActionError('')
    try {
      await api.updateStatus(id, status)
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="bad">{error}</p>
  const { incident: i, sla } = data
  if (!i) return <p>Incident not found.</p>
  const canChange = user.role !== 'EMPLOYEE'

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
      </dl>
      {canChange && (
        <div className="row">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
            <button key={s} className="btn small" disabled={i.status === s} onClick={() => setStatus(s)}>Set {s.replace('_', ' ')}</button>
          ))}
        </div>
      )}
      {actionError && <p className="bad">{actionError}</p>}
    </div>
  )
}
