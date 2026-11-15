import { Link } from 'react-router-dom'
import { StatusBadge, PriorityBadge } from './Badges'

// Shared table. Pass "actions" (a function that returns buttons for a row) to add an extra column.
export default function IncidentTable({ incidents, actions }) {
  if (!incidents.length) return <div className="empty">No incidents to show.</div>
  return (
    <div className="tablewrap table-cards">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Technician</th><th>SLA deadline</th>
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {incidents.map((i) => (
            <tr key={i.id} className={'prio-row-' + i.priority + (i.slaViolated ? ' sla-bad' : '')}>
              <td className="cell-id" data-label="#">{i.id}</td>
              <td className="cell-title" data-label="Title">
                <Link to={'/incidents/' + i.id}><span className="only-mobile">#{i.id} </span>{i.title}</Link>
              </td>
              <td className="cell-cat" data-label="Category">{i.category}</td>
              <td data-label="Priority"><PriorityBadge priority={i.priority} /></td>
              <td data-label="Status"><StatusBadge status={i.status} /></td>
              <td data-label="Technician">{i.assignedTechnician?.name || <span className="muted">unassigned</span>}</td>
              <td data-label="SLA deadline" className={i.slaViolated ? 'bad' : ''}>
                {i.slaDeadline ? new Date(i.slaDeadline).toLocaleString() : '-'}
                {i.slaViolated && ' (violated)'}
              </td>
              {actions && <td data-label="Actions">{actions(i)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
