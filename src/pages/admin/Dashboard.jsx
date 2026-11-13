import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import { StatusBadge, PriorityBadge } from '../../components/Badges'
import { PRIORITIES, STATUSES, isSlaViolated, isDone } from './shared'

// Admin home page. There is no stats endpoint, so we count everything in the browser.
// Backend: GET /api/incidents, GET /api/technicians

// A simple bar chart made from divs: one row per value, bar width = share of the biggest value.
function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className="card">
      <h3 style={{ margin: 0 }}>{title}</h3>
      {rows.map((r) => (
        <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 32px', gap: 8, alignItems: 'center' }}>
          <span>{r.label}</span>
          <div style={{ background: '#eef3f9', borderRadius: 4 }}>
            <div style={{ width: (r.n / max) * 100 + '%', height: 14, background: 'var(--blue)', borderRadius: 4 }} />
          </div>
          <b style={{ textAlign: 'right' }}>{r.n}</b>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, loading, error } = useLoad(async () => {
    const [incidents, technicians] = await Promise.all([api.getIncidents(), api.getTechnicians()])
    return { incidents, technicians }
  })
  if (loading) return <p>Loading...</p>
  if (error) return <p className="bad">{error}</p>

  const { incidents, technicians } = data
  const count = (fn) => incidents.filter(fn).length

  const stats = [
    ['Total incidents', incidents.length],
    ['Open', count((i) => i.status === 'OPEN')],
    ['In progress', count((i) => i.status === 'IN_PROGRESS')],
    ['Critical (P1)', count((i) => i.priority === 'P1')],
    ['Unassigned', count((i) => !i.assignedTechnician && !isDone(i))],
    ['SLA violated', count(isSlaViolated)],
  ]

  const byPriority = PRIORITIES.map((p) => ({ key: p, label: <PriorityBadge priority={p} />, n: count((i) => i.priority === p) }))
  const byStatus = STATUSES.map((s) => ({ key: s, label: <StatusBadge status={s} />, n: count((i) => i.status === s) }))
  const workload = [...technicians].sort((a, b) => (b.activeIncidentCount ?? 0) - (a.activeIncidentCount ?? 0))

  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        {stats.map(([label, n]) => (
          <div className="stat" key={label}><b>{n}</b><span>{label}</span></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Bars title="Incidents by priority" rows={byPriority} />
        <Bars title="Incidents by status" rows={byStatus} />
      </div>

      <div className="row">
        <h3>Technician workload</h3>
        <span className="spacer" />
        <Link to="/admin/technicians">Manage technicians</Link>
      </div>
      {!workload.length && <p className="muted">No technicians yet. <Link to="/admin/technicians">Add one</Link>.</p>}
      {workload.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Name</th><th>Skills</th><th>Active incidents</th><th>Available</th></tr></thead>
            <tbody>
              {workload.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{(t.skills || []).join(', ')}</td>
                  <td>{t.activeIncidentCount ?? 0}</td>
                  <td>{t.active === false ? <span className="muted">No</span> : 'Yes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
