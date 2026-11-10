import { useState } from 'react'
import { api, errorMessage } from '../../api/client'

// PARTNER: this page is yours. Enter an incident number, see its history (admin only on the backend).
export default function AuditLog() {
  const [id, setId] = useState('')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  async function load(e) {
    e.preventDefault()
    setError('')
    setRows(null)
    try {
      setRows(await api.getAudit(id))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <>
      <h2>Audit log</h2>
      <form className="filters" onSubmit={load}>
        <label>Incident number<input value={id} onChange={(e) => setId(e.target.value)} /></label>
        <button className="btn">Show history</button>
      </form>
      {error && <p className="bad">{error}</p>}
      {rows && !rows.length && <p className="muted">No audit records for this incident.</p>}
      {rows && rows.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Time</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td><td>{r.action}</td><td>{r.performedBy}</td><td>{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
