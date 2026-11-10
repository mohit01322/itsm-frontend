import { Link } from 'react-router-dom'
import { StatusBadge, PriorityBadge } from './Badges'

// Shared table. Pass "actions" (a function that returns buttons for a row) to add an extra column.
export default function IncidentTable({ incidents, actions }) {
  if (!incidents.length) return <p className="muted">No incidents to show.</p>
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Technician</th><th>SLA deadline</th>
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {incidents.map((i) => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td><Link to={'/incidents/' + i.id}>{i.title}</Link></td>
              <td>{i.category}</td>
              <td><PriorityBadge priority={i.priority} /></td>
              <td><StatusBadge status={i.status} /></td>
              <td>{i.assignedTechnician?.name || <span className="muted">unassigned</span>}</td>
              <td className={i.slaViolated ? 'bad' : ''}>
                {i.slaDeadline ? new Date(i.slaDeadline).toLocaleString() : '-'}
                {i.slaViolated && ' (violated)'}
              </td>
              {actions && <td>{actions(i)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
