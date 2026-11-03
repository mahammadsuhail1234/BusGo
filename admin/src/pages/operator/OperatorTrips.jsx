import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { useToast } from '../../components/Toast'
import { Badge, PageHeader, State } from '../../components/ui'
import { fmtDate, todayISO } from '../../utils'

export const TRIP_STATUSES = ['Scheduled', 'Boarding', 'Departed', 'Delayed', 'Arrived', 'Cancelled']

export default function OperatorTrips() {
  const toast = useToast()
  const [date, setDate] = useState(todayISO())
  const [all, setAll] = useState(false)
  const [updating, setUpdating] = useState('')

  const { data, error, loading, reload } = useLoad(
    () => api('/operator/schedules', { params: all ? { from: todayISO() } : { date } }),
    [date, all]
  )
  const trips = data?.schedules || []

  async function setStatus(trip, tripStatus) {
    if (tripStatus === trip.tripStatus) return
    if (tripStatus === 'Cancelled' && !confirm('Mark this trip as cancelled?')) return
    setUpdating(trip._id)
    try {
      await api(`/operator/schedules/${trip._id}/status`, { method: 'PATCH', body: { tripStatus } })
      toast(`Trip marked as ${tripStatus}`)
      reload()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setUpdating('')
    }
  }

  return (
    <>
      <PageHeader title="My trips" subtitle="Schedules for your assigned buses — update status as the trip progresses" />

      <div className="filters">
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setAll(false) }} disabled={all} aria-label="Trip date" />
        <button className="btn" onClick={() => { setDate(todayISO()); setAll(false) }}>Today</button>
        <button className={`btn ${all ? 'primary' : ''}`} onClick={() => setAll(!all)}>All upcoming</button>
      </div>

      <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && trips.length === 0} emptyText="No trips for your buses on this selection." />

      <div className="trip-grid">
        {trips.map((t) => (
          <div className="card trip-card" key={t._id}>
            <div className="trip-top">
              <div>
                <div className="trip-route">{t.source} → {t.destination}</div>
                <div className="sub">{fmtDate(t.travelDate)} · {t.departureTime} – {t.arrivalTime}</div>
              </div>
              <Badge>{t.tripStatus || 'Scheduled'}</Badge>
            </div>

            <div className="trip-meta">
              <span>🚌 {t.busName} <span className="mono">({t.busNumber})</span></span>
              <span>{t.busType}</span>
            </div>

            <div>
              <div className="sub" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Seats booked</span><span>{t.bookedSeats} / {t.totalSeats}</span>
              </div>
              <div className="occupancy"><i style={{ width: `${(t.bookedSeats / t.totalSeats) * 100}%` }} /></div>
            </div>

            <div>
              <div className="sub" style={{ marginBottom: 6 }}>Update trip status</div>
              <div className="status-pick">
                {TRIP_STATUSES.map((s) => (
                  <button
                    key={s}
                    className={(t.tripStatus || 'Scheduled') === s ? 'current' : ''}
                    disabled={updating === t._id || (t.tripStatus || 'Scheduled') === s}
                    onClick={() => setStatus(t, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Link className="btn" style={{ textAlign: 'center', textDecoration: 'none' }} to={`/operator/trips/${t._id}`}>
              View passenger list
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
