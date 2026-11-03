import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Buses from './pages/admin/Buses'
import RoutesPage from './pages/admin/Routes'
import Schedules from './pages/admin/Schedules'
import Bookings from './pages/admin/Bookings'
import Users from './pages/admin/Users'
import Reports from './pages/admin/Reports'
import OperatorTrips from './pages/operator/OperatorTrips'
import OperatorBuses from './pages/operator/OperatorBuses'
import TripPassengers from './pages/operator/TripPassengers'

function Guard({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/operator'} replace />
  return children
}

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/operator'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<Guard role="admin"><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="buses" element={<Buses />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="/operator" element={<Guard role="operator"><Layout /></Guard>}>
        <Route index element={<OperatorTrips />} />
        <Route path="buses" element={<OperatorBuses />} />
        <Route path="trips/:id" element={<TripPassengers />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  )
}
