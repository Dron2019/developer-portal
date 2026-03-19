import { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import api from '../api/axios'
import UserDetailModal from '../components/modals/UserDetailModal'

const ROLES = ['admin', 'manager', 'developer', 'guest']
const FILTERS = ['all', 'pending']

const roleBadge = {
  admin:     'bg-purple-100 text-purple-700',
  manager:   'bg-blue-100 text-blue-700',
  developer: 'bg-green-100 text-green-700',
  guest:     'bg-gray-100 text-gray-600',
}

export default function UsersPage() {
  const [users, setUsers]             = useState([])
  const [meta, setMeta]               = useState(null)
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(null) // user id being saved
  const [detailUserId, setDetailUserId] = useState(null)

  const fetchUsers = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/users', { params: { page: p } })
      const all = res.data.data ?? []
      const pending = all.filter(u => !u.is_active)
      setPendingCount(pending.length)
      let filtered = filter === 'pending' ? pending : all
      if (search) {
        filtered = filtered.filter(u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        )
      }
      setUsers(filtered)
      setMeta(res.data.meta ?? null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(page) }, [page, filter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers(1)
    setPage(1)
  }

  const updateUser = async (userId, patch) => {
    setSaving(userId)
    try {
      const res = await api.put(`/users/${userId}`, patch)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res.data.data } : u))
    } catch {
      // ignore
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage roles and account status</p>
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-4 py-2 font-medium capitalize transition-colors flex items-center gap-1.5 ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
              {f === 'pending' && pendingCount > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  filter === 'pending' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                }`}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">GitHub</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.is_active ? 'bg-amber-50' : ''}`}>
        <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      : <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">{user.name?.[0]}</div>
                    }
                    <div>
                      <button
                        onClick={() => setDetailUserId(user.id)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {user.name}
                      </button>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    disabled={saving === user.id}
                    onChange={e => updateUser(user.id, { role: e.target.value })}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${roleBadge[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>

                <td className="px-6 py-4">
                  <button
                    disabled={saving === user.id}
                    onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    {user.is_active
                      ? <><CheckCircleIcon className="h-4 w-4 text-green-500" /><span className="text-green-600">Active</span></>
                      : <><XCircleIcon className="h-4 w-4 text-red-400" /><span className="text-red-500">Inactive</span></>
                    }
                  </button>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.github_nickname
                    ? <span className="font-mono text-xs">@{user.github_nickname}</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setDetailUserId(user.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <UserDetailModal
        userId={detailUserId}
        isOpen={!!detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  )
}

