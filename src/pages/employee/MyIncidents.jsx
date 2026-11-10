import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'

// MOHIY: this page is yours.
// TODO (after the backend adds GET /api/incidents/mine): call that instead, so employees only see their own incidents.
export default function MyIncidents() {
  const { data, loading, error } = useLoad(() => api.getIncidents())
  const [text, setText] = useState('')

  const shown = (data || []).filter((i) => i.title.toLowerCase().includes(text.toLowerCase()))

  return (
    <>
      <div className="row">
        <h2>My incidents</h2>
        <span className="spacer" />
        <Link className="btn" to="/employee/report">+ Report incident</Link>
      </div>
      <input className="search" placeholder="Search by title..." value={text} onChange={(e) => setText(e.target.value)} />
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && <IncidentTable incidents={shown} />}
    </>
  )
}
