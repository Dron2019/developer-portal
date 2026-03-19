import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import api from '../../api/axios'

const roleBadge = {
  admin:     'bg-purple-100 text-purple-700',
  manager:   'bg-blue-100 text-blue-700',
  developer: 'bg-green-100 text-green-700',
  guest:     'bg-gray-100 text-gray-600',
}

const statusBadge = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function UserDetailModal({ userId, isOpen, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !userId) return
    setData(null)
    setError(null)
    setLoading(true)
    api.get(`/users/${userId}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load user details.'))
      .finally(() => setLoading(false))
  }, [isOpen, userId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {data && (
            <div className="space-y-6">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt={data.name} className="h-16 w-16 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
                    {data.name?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{data.name}</p>
                  <p className="text-sm text-gray-500 truncate">{data.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[data.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {data.role}
                    </span>
                    {data.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircleIcon className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <XCircleIcon className="h-3.5 w-3.5" /> Inactive
                      </span>
                    )}
                    {data.github_nickname && (
                      <a
                        href={`https://github.com/${data.github_nickname}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-mono"
                      >
                        <CodeBracketIcon className="h-3.5 w-3.5" />
                        @{data.github_nickname}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Member Since', value: data.created_at ? new Date(data.created_at).toLocaleDateString() : '—' },
                  { label: 'Projects',     value: data.project_count ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent requests */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Recent Repository Requests</h3>
                {data.recent_requests?.length === 0 ? (
                  <p className="text-sm text-gray-400">No requests yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {data.recent_requests?.map((req) => (
                      <li key={req.id} className="flex items-center gap-3 py-2.5">
                        <span className="text-xs text-gray-500 w-12 shrink-0 capitalize">{req.type}</span>
                        <span className="text-sm text-gray-700 flex-1 truncate">{req.repo_name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusBadge[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {req.status}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
