import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { linkProjectRepository } from '../../api/projects'
import { getRepositories } from '../../api/repositories'

export default function LinkRepositoryModal({ projectId, onClose, onLinked }) {
  const [query, setQuery] = useState('')
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const searchTimeoutRef = useRef(null)

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchRepositories(searchQuery, 1, true) // Reset to page 1 for new search
    }, 300)
  }, [])

  useEffect(() => {
    fetchRepositories('', 1, true) // Initial load
  }, [])

  useEffect(() => {
    if (query.trim()) {
      setSearching(true)
      debouncedSearch(query.trim())
    } else {
      // If query is empty, reset to initial state
      setSearching(true)
      debouncedSearch('')
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, debouncedSearch])

  const fetchRepositories = async (searchQuery = '', pageNum = 1, reset = false) => {
    const isInitialOrSearch = reset || pageNum === 1
    
    if (isInitialOrSearch) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const params = { 
        project_id: 'null', // Get repositories not linked to any project
        page: pageNum
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      const { data } = await getRepositories(params)
      const newRepos = data.data || []
      
      if (reset || pageNum === 1) {
        setRepositories(newRepos)
        setPage(1)
      } else {
        setRepositories(prev => [...prev, ...newRepos])
      }
      
      // Check if there are more pages (Laravel pagination)
      setHasMore(data.current_page < data.last_page)
      setPage(pageNum)
      setError('')
      
    } catch (err) {
      setError('Failed to load repositories.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setSearching(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchRepositories(query.trim(), page + 1, false)
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
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                  </div>
                )}
              </div>
            </div>

            {/* Repository List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-2 text-sm text-gray-500">Loading repositories...</p>
                </div>
              ) : repositories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    {query.trim() 
                      ? `No repositories found matching "${query}".`
                      : 'No available repositories to link.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {repositories.map((repo) => (
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
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && !searching && (
                    <div className="text-center py-4">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {loadingMore && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                        )}
                        {loadingMore ? 'Loading...' : 'Load More Repositories'}
                      </button>
                    </div>
                  )}
                </>
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