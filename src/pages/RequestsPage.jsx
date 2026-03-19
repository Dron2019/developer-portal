import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getRepositoryRequests, deleteRepositoryRequest } from '../api/repositories'
import StatusBadge from '../components/StatusBadge'
import ReviewRequestModal from '../components/modals/ReviewRequestModal'
import CreateRepoModal from '../components/modals/CreateRepoModal'
import RequestAccessModal from '../components/modals/RequestAccessModal'
import useAuthStore from '../store/authStore'

export default function RequestsPage() {
  const { user } = useAuthStore()
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  const [tab, setTab] = useState('mine')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [reviewTarget, setReviewTarget] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (tab === 'all' && isAdminOrManager && statusFilter) {
        params.status = statusFilter
      }
      const res = await getRepositoryRequests(params)
      let data = res.data.data ?? res.data
      if (tab === 'mine') {
        data = data.filter((r) => r.user?.id === user?.id)
      }
      setRequests(data)
    } catch {
      showToast('Failed to load requests.', 'error')
    } finally {
      setLoading(false)
    }
  }, [tab, statusFilter, isAdminOrManager, user?.id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this request?')) return
    try {
      await deleteRepositoryRequest(id)
      showToast('Request deleted.')
      fetchRequests()
    } catch {
      showToast('Failed to delete request.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Repository Requests</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setAccessOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Request Access
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Repository
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex rounded-md border border-gray-300 overflow-hidden">
          <button
            onClick={() => setTab('mine')}
            className={`px-4 py-2 text-sm transition-colors ${tab === 'mine' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            My Requests
          </button>
          {isAdminOrManager && (
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-2 text-sm transition-colors ${tab === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              All Requests
            </button>
          )}
        </div>

        {isAdminOrManager && tab === 'all' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No requests found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Repository / Name</th>
                {tab === 'all' && <th className="px-4 py-3 text-left font-medium text-gray-600">Requester</th>}
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 capitalize">{req.type}</td>
                  <td className="px-4 py-3">
                    {req.repository?.full_name ?? req.repository_name ?? '—'}
                  </td>
                  {tab === 'all' && <td className="px-4 py-3">{req.user?.name}</td>}
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isAdminOrManager && req.status === 'pending' && (
                        <button
                          onClick={() => setReviewTarget(req)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Review
                        </button>
                      )}
                      {(isAdminOrManager || (req.status === 'pending' && req.user?.id === user?.id)) && (
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete request"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ReviewRequestModal
        request={reviewTarget}
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSuccess={(msg) => { showToast(msg); fetchRequests() }}
      />

      <CreateRepoModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(msg) => { showToast(msg); fetchRequests() }}
      />

      <RequestAccessModal
        repository={null}
        isOpen={accessOpen}
        onClose={() => setAccessOpen(false)}
        onSuccess={(msg) => { showToast(msg); fetchRequests() }}
      />
    </div>
  )
}

