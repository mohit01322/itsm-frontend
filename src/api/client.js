// Pages import "api" from here. config.js decides whether it is fake or real.
import { USE_MOCK } from './config'
import * as mock from './mockApi'
import * as real from './realApi'

export const api = USE_MOCK ? mock : real

// Turns an error into something to show on screen.
export function errorMessage(e) {
  if (e.status === 401) return 'Wrong username or password.'
  if (e.status === 403) return 'You are not allowed to do this.'
  if (e.status === 409 && e.data?.error) return e.data.error // e.g. "Invalid status transition: OPEN -> CLOSED"
  if (e.status === 502 || e.status === 503 || e.status === 504) return 'The server is waking up (the free cloud server sleeps when nobody uses it). Wait a minute, then reload the page.'
  if (e.status === 400 && e.data && typeof e.data === 'object') return Object.values(e.data).join(' ')
  if (e instanceof TypeError) return 'Cannot reach the backend. Is it running? Is USE_MOCK correct?'
  return e.message || 'Something went wrong.'
}
