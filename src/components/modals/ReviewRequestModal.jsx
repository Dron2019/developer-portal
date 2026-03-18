import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { updateRepositoryRequest } from '../../api/repositories'
import StatusBadge from '../StatusBadge'

export default function ReviewRequestModal({ request, isOpen, onClose, onSuccess }) {
  const [adminComment, setAdminComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !request) return null

  const handleReview = async (status) => {
    setLoading(true)
    setError(null)
    try {
      await updateRepositoryRequest(request.id, { status, admin_comment: adminComment.trim() || undefined })
      onSuccess?.(`Request ${status} successfully.`)
      setAdminComment('')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Review Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium capitalize">{request.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status:</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Requester:</span>
              <span className="font-medium">{request.user?.name}</span>
            </div>
            {request.repository && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Repository:</span>
                <span className="font-medium">{request.repository.full_name}</span>
              </div>
            )}
            {request.repository_name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">New repo name:</span>
                <span className="font-medium">{request.repository_name}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Reason:</span>
              <p className="mt-1 text-gray-800">{request.reason}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Comment</label>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional comment for the requester"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => handleReview('rejected')}
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Reject'}
            </button>
            <button
              onClick={() => handleReview('approved')}
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
