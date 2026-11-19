import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'

const isDone = (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'

export default function MyIncidents() {
  const { data, loading, error } = useLoad(() => api.getMyIncidents())
  const [text, setText] = useState('')
  const [viewing, setViewing] = useState(null) // the resolved incident whose resolution is shown

  const shown = (data || []).filter((i) => i.title.toLowerCase().includes(text.toLowerCase()))
  const active = shown.filter((i) => !isDone(i))
  const resolved = shown.filter(isDone).sort((a, b) => b.id - a.id)

  // "View resolution" button shown beside each resolved incident
  const actions = (i) => (
    <button className="btn small" onClick={() => setViewing(viewing?.id === i.id ? null : i)}>
      {viewing?.id === i.id ? 'Hide resolution' : 'View resolution'}
    </button>
  )

  return (
    <>
      <div className="row">
        <h2>My tickets</h2>
        <span className="spacer" />
        <Link className="btn" to="/employee/report">+ Report incident</Link>
      </div>
      <input className="search" placeholder="Search by title..." value={text} onChange={(e) => setText(e.target.value)} />
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && <IncidentTable incidents={active} />}

      {data && (
        <details style={{ marginTop: 20 }} onToggle={(e) => { if (!e.currentTarget.open) setViewing(null) }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Resolved incidents ({resolved.length})</summary>
          <div style={{ marginTop: 12 }}>
            <IncidentTable incidents={resolved} actions={actions} />
            {viewing && (
              <div className="card" style={{ marginTop: 12 }}>
                <h3>#{viewing.id} {viewing.title}</h3>
                <p className="muted">
                  Resolved by {viewing.assignedTechnician?.name || 'a technician'}
                  {viewing.resolvedAt ? ' on ' + new Date(viewing.resolvedAt).toLocaleString() : ''}
                </p>
                <p><strong>What was the problem:</strong></p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.description}</p>
                <p><strong>How it was fixed:</strong></p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.resolutionNotes || 'The technician did not leave any notes.'}</p>
              </div>
            )}
          </div>
        </details>
      )}
    </>
  )
}
