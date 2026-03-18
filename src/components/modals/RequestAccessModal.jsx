import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createRepositoryRequest, getRepositories } from '../../api/repositories'

export default function RequestAccessModal({ repository, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [selectedRepoId, setSelectedRepoId] = useState('')
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && !repository) {
      getRepositories({ per_page: 100 })
        .then((res) => setRepos(res.data.data ?? []))
        .catch(() => {})
    }
  }, [isOpen, repository])

  if (!isOpen) return null

  const repoId = repository?.id ?? (selectedRepoId ? parseInt(selectedRepoId) : null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.')
      return
    }
    if (!repoId) {
      setError('Please select a repository.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createRepositoryRequest({
        type: 'access',
        repository_id: repoId,
        reason: reason.trim(),
      })
      onSuccess?.('Access request submitted successfully!')
      setReason('')
      setSelectedRepoId('')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Request Access</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {repository ? (
            <p className="text-sm text-gray-600">
              Requesting access to <span className="font-semibold">{repository.full_name}</span>
            </p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a repository...</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe why you need access to this repository (min 10 characters)"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

