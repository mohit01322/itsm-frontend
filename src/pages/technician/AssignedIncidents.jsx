import { api, errorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { useState } from 'react'

// PARTNER: this page is yours.
// A technician sees incidents assigned to them. user.technicianId comes from GET /api/me (requested from the backend team).
// Until that exists we show every not-closed incident, so the page still works.
export default function AssignedIncidents() {
  const { user } = useAuth()
  const [actionError, setActionError] = useState('')
  const { data, loading, error, reload } = useLoad(async () => {
    if (user.technicianId) return api.searchIncidents({ technicianId: user.technicianId })
    return (await api.getIncidents()).filter((i) => i.status !== 'CLOSED')
  }, [user.technicianId])

  async function setStatus(id, status) {
    setActionError('')
    try {
      await api.updateStatus(id, status)
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const actions = (i) => (
    <div className="row">
      <button className="btn small" disabled={i.status !== 'OPEN'} onClick={() => setStatus(i.id, 'IN_PROGRESS')}>Start</button>
      <button className="btn small" disabled={i.status !== 'IN_PROGRESS'} onClick={() => setStatus(i.id, 'RESOLVED')}>Resolve</button>
    </div>
  )

  return (
    <>
      <h2>Assigned incidents</h2>
      {!user.technicianId && <p className="muted">Showing all open incidents until the backend returns your technician id.</p>}
      {loading && <p>Loading...</p>}
      {(error || actionError) && <p className="bad">{error || actionError}</p>}
      {data && <IncidentTable incidents={data} actions={actions} />}
    </>
  )
}
