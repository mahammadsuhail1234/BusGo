import { api } from '../../api'
import { useLoad } from '../../hooks'
import { Badge, PageHeader, State } from '../../components/ui'

export default function OperatorBuses() {
  const { data, error, loading, reload } = useLoad(() => api('/operator/buses'))
  const buses = data?.buses || []

  return (
    <>
      <PageHeader title="My buses" subtitle="Buses assigned to you by the admin" />
      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && buses.length === 0} emptyText="No buses are assigned to you yet. Please contact the admin." />
        {buses.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bus</th><th>Number</th><th>Company</th><th>Type</th><th className="num">Seats</th><th>Status</th></tr></thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.busName}</strong></td>
                    <td className="mono">{b.busNumber}</td>
                    <td>{b.operator}</td>
                    <td>{b.busType}</td>
                    <td className="num">{b.totalSeats}</td>
                    <td><Badge>{b.isActive ? 'Active' : 'Inactive'}</Badge></td>
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
