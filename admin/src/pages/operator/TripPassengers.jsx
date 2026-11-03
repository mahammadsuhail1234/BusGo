import { Link, useParams } from 'react-router-dom'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { Badge, PageHeader, State } from '../../components/ui'
import { downloadCSV, fmtDate } from '../../utils'

export default function TripPassengers() {
  const { id } = useParams()
  const { data, error, loading, reload } = useLoad(() => api(`/operator/schedules/${id}/passengers`), [id])
  const trip = data?.trip
  const passengers = data?.passengers || []

  function exportCSV() {
    downloadCSV(`passengers-${trip.travelDate}-${trip.busNumber}.csv`, [
      ['Seat', 'Name', 'Age', 'Gender', 'Phone', 'Booking ID', 'Status'],
      ...passengers.map((p) => [p.seat, p.name, p.age, p.gender, p.phone, p.bookingId, p.bookingStatus]),
    ])
  }

  return (
    <>
      <PageHeader
        title="Passenger list"
        subtitle={trip ? `${trip.source} → ${trip.destination} · ${fmtDate(trip.travelDate)} · ${trip.departureTime} · ${trip.busName} (${trip.busNumber})` : ''}
      >
        <Link to="/operator" className="btn" style={{ textDecoration: 'none' }}>← Back</Link>
        <button className="btn" onClick={exportCSV} disabled={!passengers.length}>Export CSV</button>
        <button className="btn primary" onClick={() => window.print()}>Print</button>
      </PageHeader>

      {trip && (
        <p style={{ marginBottom: 14 }}>
          Trip status: <Badge>{trip.tripStatus || 'Scheduled'}</Badge> &nbsp; · &nbsp; <strong>{passengers.length}</strong> of {trip.totalSeats} seats occupied
        </p>
      )}

      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && passengers.length === 0} emptyText="No passengers have booked this trip yet." />
        {passengers.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Seat</th><th>Passenger</th><th>Age</th><th>Gender</th><th>Phone</th><th>Booking</th><th>Status</th></tr></thead>
              <tbody>
                {passengers.map((p) => (
                  <tr key={`${p.bookingId}-${p.seat}`}>
                    <td><strong>{p.seat}</strong></td>
                    <td>{p.name}</td>
                    <td>{p.age}</td>
                    <td>{p.gender}</td>
                    <td>{p.phone}</td>
                    <td className="mono">{p.bookingId}</td>
                    <td><Badge>{p.bookingStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
