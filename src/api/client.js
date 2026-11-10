// Pages import "api" from here. config.js decides whether it is fake or real.
import { USE_MOCK } from './config'
import * as mock from './mockApi'
import * as real from './realApi'

export const api = USE_MOCK ? mock : real

// Turns an error into something to show on screen.
export function errorMessage(e) {
  if (e.status === 401) return 'Wrong username or password.'
  if (e.status === 403) return 'You are not allowed to do this.'
  if (e.status === 400 && e.data && typeof e.data === 'object') return Object.values(e.data).join(' ')
  if (e instanceof TypeError) return 'Cannot reach the backend. Is it running? Is USE_MOCK correct?'
  return e.message || 'Something went wrong.'
}
