import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getRepositories, syncRepositories, deleteRepository } from '../api/repositories'
import RepositoryCard from '../components/RepositoryCard'
import RequestAccessModal from '../components/modals/RequestAccessModal'
import useAuthStore from '../store/authStore'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-4/5 mb-4" />
      <div className="h-8 bg-gray-200 rounded" />
    </div>
  )
}

export default function RepositoriesPage() {
  const { user } = useAuthStore()
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [toast, setToast] = useState(null)

  const canSync = user?.role === 'admin' || user?.role === 'manager'
  const canDelete = user?.role === 'admin' || user?.role === 'manager'
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRepository(deleteTarget.id)
      showToast(`"${deleteTarget.name}" removed from local database.`)
      setDeleteTarget(null)
      fetchRepositories()
    } catch {
      showToast('Failed to delete repository.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRepositories = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (search) params.search = search
      if (filter === 'public') params.private = false
      if (filter === 'private') params.private = true
      const res = await getRepositories(params)
      setRepositories(res.data.data)
      setMeta(res.data.meta)
    } catch {
      showToast('Failed to load repositories.', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, filter, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchRepositories(), search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchRepositories, search])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncRepositories()
      showToast(res.data.message)
      fetchRepositories()
    } catch {
      showToast('Sync failed.', 'error')
    } finally {
      setSyncing(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
        {canSync && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from GitHub'}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search repositories..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex rounded-md border border-gray-300 overflow-hidden">
          {['all', 'public', 'private'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-4 py-2 text-sm capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No repositories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onRequestAccess={setSelectedRepo}
              onDelete={setDeleteTarget}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      <RequestAccessModal
        repository={selectedRepo}
        isOpen={!!selectedRepo}
        onClose={() => setSelectedRepo(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Remove repository?</h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{deleteTarget.name}</span> will be removed from the local database only.
              The repository on GitHub will <span className="font-medium">not</span> be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

