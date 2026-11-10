import { api } from '../../api/client'
import useLoad from '../../components/useLoad'

// MOHIY: this page is yours.
export default function Notifications() {
  const { data, loading, error, reload } = useLoad(() => api.getNotifications())

  async function read(id) {
    await api.markRead(id)
    reload()
  }

  return (
    <>
      <h2>Notifications</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && !data.length && <p className="muted">No notifications.</p>}
      <ul className="list">
        {(data || []).map((n) => (
          <li key={n.id} className={n.read ? '' : 'unread'}>
            <div>
              <strong>{n.message}</strong>
              <div className="muted">{n.channel} &middot; {new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {!n.read && <button className="btn small" onClick={() => read(n.id)}>Mark as read</button>}
          </li>
        ))}
      </ul>
    </>
  )
}
