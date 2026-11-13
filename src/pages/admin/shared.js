// Small helpers used by Raj's technician and admin pages.
import { errorMessage } from '../../api/client'

// Same category list as Mohiy's Report incident form.
// Technician skills must use these exact words, because SKILL assignment
// matches a technician's skill against the incident's category.
export const CATEGORIES = ['NETWORK', 'HARDWARE', 'SOFTWARE', 'DATABASE', 'SECURITY', 'OTHER']
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
export const PRIORITIES = ['P1', 'P2', 'P3', 'P4']

// The backend sends most errors as { "error": "some text" }. Show that text if it is there.
export function showError(e) {
  return e?.data?.error || errorMessage(e)
}

// The backend's slaViolated field only updates when someone opens /api/sla/{id},
// so we work it out ourselves: was the incident (or is it still) open after its deadline?
export function isSlaViolated(i) {
  if (!i.slaDeadline) return false
  const deadline = new Date(i.slaDeadline)
  const finishedAt = i.resolvedAt ? new Date(i.resolvedAt) : new Date()
  return finishedAt > deadline
}

// Returns a copy of the list with slaViolated worked out correctly (the shared table uses it to show red).
export const withSla = (list) => list.map((i) => ({ ...i, slaViolated: isSlaViolated(i) }))

export const isDone = (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
