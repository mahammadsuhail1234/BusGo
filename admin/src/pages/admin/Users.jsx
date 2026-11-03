import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { useAuth } from '../../auth'
import { useToast } from '../../components/Toast'
import { Badge, Field, Modal, PageHeader, State } from '../../components/ui'
import { fmtDate } from '../../utils'

export default function Users() {
  const toast = useToast()
  const { user: me } = useAuth()
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const { data, error, loading, reload } = useLoad(() => api('/admin/users', { params: { role, search: query } }), [role, query])
  const users = data?.users || []

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      await api('/admin/users', { method: 'POST', body: form })
      toast(`${form.role === 'operator' ? 'Operator' : 'User'} created`)
      setForm(null)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(u, newRole) {
    if (!confirm(`Change ${u.name} to ${newRole}?`)) return
    try {
      await api(`/admin/users/${u._id}/role`, { method: 'PATCH', body: { role: newRole } })
      toast('Role updated')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Users" subtitle="Customers, bus operators and admins">
        <button className="btn primary" onClick={() => { setFormError(''); setForm({ name: '', email: '', password: '', role: 'operator' }) }}>+ Add staff / user</button>
      </PageHeader>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()) }}>
        <input className="grow" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">All roles</option>
          <option value="user">Customers</option>
          <option value="operator">Operators</option>
          <option value="admin">Admins</option>
        </select>
        <button className="btn primary">Search</button>
      </form>

      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && users.length === 0} emptyText="No users found." />
        {users.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th className="num">Bookings</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><Badge>{u.role}</Badge></td>
                    <td className="num">{u.bookingCount}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        {u._id !== me.id && u.role === 'user' && <button className="btn small" onClick={() => changeRole(u, 'operator')}>Make operator</button>}
                        {u._id !== me.id && u.role === 'operator' && <button className="btn small" onClick={() => changeRole(u, 'user')}>Make customer</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <Modal title="Add user" onClose={() => setForm(null)}>
          <form onSubmit={create}>
            {formError && <div className="alert">{formError}</div>}
            <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Temporary password" hint="At least 6 characters"><input type="text" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="operator">Bus operator</option>
                <option value="admin">Admin</option>
                <option value="user">Customer</option>
              </select>
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
