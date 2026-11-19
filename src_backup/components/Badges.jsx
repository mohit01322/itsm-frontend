const PRIORITY_NAME = { P1: 'Critical', P2: 'High', P3: 'Medium', P4: 'Low' }

export function StatusBadge({ status }) {
  const label = String(status || '').replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())
  return <span className={'status status-' + status}>{label}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={'badge prio-' + priority}>{priority} {PRIORITY_NAME[priority] || ''}</span>
}
