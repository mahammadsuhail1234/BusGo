import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { PageHeader, State, Stat, Badge } from '../../components/ui'
import { fmtDate, money } from '../../utils'

export default function Dashboard() {
  const { data, error, loading, reload } = useLoad(() => api('/admin/dashboard'))
  const s = data?.stats

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of buses, bookings and revenue" />
      <State loading={loading} error={error} onRetry={reload} />
      {s && (
        <>
          <div className="stats">
            <Stat tone="amber" label="Total revenue" value={money(s.revenue)} sub={`${s.activeBookings} active bookings`} />
            <Stat tone="green" label="Today's revenue" value={money(s.todayRevenue)} sub={`${s.todayBookings} bookings today`} />
            <Stat tone="blue" label="Total bookings" value={s.bookings} />
            <Stat tone="purple" label="Upcoming trips" value={s.upcomingTrips} />
            <Stat label="Active buses" value={s.buses} />
            <Stat label="Active routes" value={s.routes} />
            <Stat label="Registered users" value={s.users} />
          </div>

          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 0, display: 'flex', justifyContent: 'space-between' }}>
              <h2>Recent bookings</h2>
              <Link to="/admin/bookings" className="sub">View all →</Link>
            </div>
            {data.recentBookings.length === 0 ? (
              <State empty emptyText="No bookings yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Booking</th><th>Trip</th><th>Travel date</th><th className="num">Seats</th><th className="num">Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.recentBookings.map((b) => (
                      <tr key={b._id}>
                        <td className="mono">{b.bookingId}</td>
                        <td>{b.bus ? `${b.bus.source} → ${b.bus.destination}` : <span className="sub">Trip removed</span>}</td>
                        <td>{fmtDate(b.bus?.travelDate)}</td>
                        <td className="num">{b.selectedSeats.length}</td>
                        <td className="num">{money(b.totalPrice)}</td>
                        <td><Badge>{b.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
