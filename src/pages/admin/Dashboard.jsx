import { api } from '../../api/client'
import useLoad from '../../components/useLoad'

// PARTNER: this page is yours. There is no stats endpoint, so we count in the browser.
export default function Dashboard() {
  const { data, loading, error } = useLoad(() => api.getIncidents())
  if (loading) return <p>Loading...</p>
  if (error) return <p className="bad">{error}</p>

  const count = (fn) => data.filter(fn).length
  const stats = [
    ['Total incidents', data.length],
    ['Open', count((i) => i.status === 'OPEN')],
    ['In progress', count((i) => i.status === 'IN_PROGRESS')],
    ['Critical (P1)', count((i) => i.priority === 'P1')],
    ['Unassigned', count((i) => !i.assignedTechnician)],
    ['SLA violated', count((i) => i.slaViolated)],
  ]

  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        {stats.map(([label, n]) => (
          <div className="stat" key={label}><b>{n}</b><span>{label}</span></div>
        ))}
      </div>
    </>
  )
}
