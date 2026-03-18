import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createRepositoryRequest } from '../../api/repositories'

export default function CreateRepoModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    repository_name: '',
    repository_description: '',
    repository_private: false,
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createRepositoryRequest({
        type: 'create',
        repository_name: form.repository_name.trim(),
        repository_description: form.repository_description.trim() || undefined,
        repository_private: form.repository_private,
        reason: form.reason.trim(),
      })
      onSuccess?.('Repository creation request submitted successfully!')
      setForm({ repository_name: '', repository_description: '', repository_private: false, reason: '' })
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
          <h2 className="text-lg font-semibold">Request New Repository</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repository Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="repository_name"
              value={form.repository_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-new-repo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="repository_description"
              value={form.repository_description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the repository"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="repository_private"
              name="repository_private"
              checked={form.repository_private}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="repository_private" className="text-sm text-gray-700">Private repository</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Why do you need this repository? (min 10 characters)"
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
