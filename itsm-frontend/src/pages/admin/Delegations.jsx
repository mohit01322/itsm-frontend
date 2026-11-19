import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import { showError } from './shared'

// Admin page: delegation requests from technicians. The incident only moves when you approve.
// Backend: GET /api/assignments/delegations?status=, POST /api/assignments/delegations/{id}/approve|reject
const when = (t) => (t ? new Date(t).toLocaleString() : '-')

export default function Delegations() {
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState(null) // { text, bad }
  const [busyId, setBusyId] = useState(null)
  const { data, loading, error, reload } = useLoad(() => api.getDelegations(filter), [filter])

  async function decide(d, approve) {
    setMessage(null)
    setBusyId(d.id)
    try {
      if (approve) await api.approveDelegation(d.id)
      else await api.rejectDelegation(d.id)
      setMessage({ bad: false, text: 'Incident #' + d.incidentId + (approve ? ' moved to ' + d.toTechnician.name + '.' : ': request rejected, it stays with ' + d.fromTechnician.name + '.') })
    } catch (e) {
      setMessage({ bad: true, text: 'Incident #' + d.incidentId + ': ' + showError(e) })
    } finally {
      setBusyId(null)
      reload()
    }
  }

  const requests = data || []
  const pendingCount = requests.filter((d) => d.status === 'PENDING').length
  const approvedCount = requests.filter((d) => d.status === 'APPROVED').length
  const rejectedCount = requests.filter((d) => d.status === 'REJECTED').length

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Delegation requests</h2>
          <p>Review technician-to-technician handovers. An incident changes owner only after an administrator approves the request.</p>
        </div>
      </div>

      <div className="delegation-summary">
        <div><b>{requests.length}</b><span>Requests in this view</span></div>
        <div><b>{pendingCount}</b><span>Pending in this view</span></div>
        <div><b>{approvedCount + rejectedCount}</b><span>Decided in this view</span></div>
      </div>

      <div className="delegation-toolbar">
        <label>
          Filter requests
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="PENDING">Waiting for approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ALL">All requests</option>
          </select>
        </label>
        <button type="button" className="btn small" onClick={reload}>↻ Refresh</button>
      </div>

      {message && <p className={'workflow-message' + (message.bad ? ' bad' : '')}>{message.text}</p>}
      {loading && <p className="muted">Loading delegation requests…</p>}
      {error && <p className="workflow-message bad">{error}</p>}
      {data && data.length === 0 && <div className="empty">No delegation requests match this filter.</div>}
      {data && data.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Incident</th><th>Current technician</th><th>Requested technician</th><th>Requested</th><th>Status</th><th>Decision</th></tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td><Link to={'/incidents/' + d.incidentId}>#{d.incidentId} {d.incidentTitle}</Link></td>
                  <td>{d.fromTechnician?.name || '—'}</td>
                  <td>{d.toTechnician?.name || '—'}</td>
                  <td>{when(d.requestedAt)}</td>
                  <td>
                    <span className={'delegation-status ' + String(d.status || '').toLowerCase()}>{d.status}</span>
                    {d.decidedBy && <div className="muted">by {d.decidedBy}</div>}
                  </td>
                  <td>
                    {d.status === 'PENDING' ? (
                      <div className="delegation-actions">
                        <button className="btn small" disabled={busyId === d.id} onClick={() => decide(d, true)}>{busyId === d.id ? 'Working…' : 'Approve'}</button>
                        <button className="btn small reject" disabled={busyId === d.id} onClick={() => decide(d, false)}>Reject</button>
                      </div>
                    ) : <span className="muted">No action needed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
