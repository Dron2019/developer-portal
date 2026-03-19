import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { linkProjectRepository } from '../../api/projects'
import { getRepositories } from '../../api/repositories'

export default function LinkRepositoryModal({ projectId, onClose, onLinked }) {
  const [query, setQuery] = useState('')
  const [repositories, setRepositories] = useState([])
  const [filteredRepos, setFilteredRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAvailableRepos()
  }, [])

  useEffect(() => {
    // Filter repositories based on query
    if (!query.trim()) {
      setFilteredRepos(repositories)
    } else {
      const filtered = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(query.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(query.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(query.toLowerCase()))
      )
      setFilteredRepos(filtered)
    }
  }, [query, repositories])

  const fetchAvailableRepos = async () => {
    setLoading(true)
    try {
      const { data } = await getRepositories({ project_id: 'null' }) // Get repositories not linked to any project
      setRepositories(data.data || [])
      setFilteredRepos(data.data || [])
    } catch (err) {
      setError('Failed to load repositories.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRepo) return

    setSubmitting(true)
    setError('')
    try {
      await linkProjectRepository(projectId, selectedRepo.id)
      onLinked()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to link repository.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Link Repository</Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search repositories</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Repository List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-2 text-sm text-gray-500">Loading repositories...</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    {repositories.length === 0 
                      ? 'No available repositories to link.'
                      : 'No repositories match your search.'
                    }
                  </p>
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <label key={repo.id} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="repository"
                      value={repo.id}
                      checked={selectedRepo?.id === repo.id}
                      onChange={() => setSelectedRepo(repo)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{repo.full_name || repo.name}</h4>
                        {repo.private && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Private
                          </span>
                        )}
                        {repo.language && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>⭐ {repo.stars_count || 0}</span>
                        <span>🍴 {repo.forks_count || 0}</span>
                        {repo.open_issues_count > 0 && <span>🐛 {repo.open_issues_count}</span>}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedRepo || submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                )}
                {submitting ? 'Linking...' : 'Link Repository'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}