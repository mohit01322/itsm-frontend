import { api } from '../../api/client'
import useLoad from '../../components/useLoad'

// PARTNER: this page is yours. Read-only list to start with.
// TODO: add a form for POST /api/technicians and an edit button for PUT /api/technicians/{id}.
export default function Technicians() {
  const { data, loading, error } = useLoad(() => api.getTechnicians())
  return (
    <>
      <h2>Technicians</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && (
        <div className="tablewrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Skills</th><th>Active incidents</th><th>Available</th></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td><td>{t.name}</td>
                  <td>{(t.skills || []).join(', ')}</td>
                  <td>{t.activeIncidentCount ?? '-'}</td>
                  <td>{t.active === false ? 'No' : 'Yes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
