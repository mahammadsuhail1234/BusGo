import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

const ADMIN_NAV = [
  ['/admin', 'Dashboard', '▦', true],
  ['/admin/buses', 'Buses', '🚌'],
  ['/admin/routes', 'Routes', '⇄'],
  ['/admin/schedules', 'Schedules', '🗓'],
  ['/admin/bookings', 'Bookings', '🎫'],
  ['/admin/users', 'Users', '👥'],
  ['/admin/reports', 'Reports', '📈'],
]

const OPERATOR_NAV = [
  ['/operator', 'My Trips', '🗓', true],
  ['/operator/buses', 'My Buses', '🚌'],
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = user.role === 'admin' ? ADMIN_NAV : OPERATOR_NAV

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">B</span>
          <div>
            <strong>BusGo</strong>
            <small>{user.role === 'admin' ? 'Admin Console' : 'Operator Portal'}</small>
          </div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {nav.map(([to, label, icon, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
          <span>{user.role === 'admin' ? 'Administrator' : 'Bus Operator'}</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
