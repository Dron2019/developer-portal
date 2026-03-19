import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'
import { getRepositoryMembers, removeRepositoryCollaborator } from '../../api/repositories'

const permissionLabel = (collab) => {
  if (collab.role_name) return collab.role_name
  const p = collab.permissions ?? {}
  if (p.admin) return 'admin'
  if (p.maintain) return 'maintain'
  if (p.push) return 'write'
  if (p.triage) return 'triage'
  return 'read'
}

const permissionColor = (perm) => {
  switch (perm) {
    case 'admin':    return 'bg-purple-100 text-purple-700'
    case 'maintain': return 'bg-blue-100 text-blue-700'
    case 'write':    return 'bg-green-100 text-green-700'
    case 'triage':   return 'bg-yellow-100 text-yellow-700'
    default:         return 'bg-gray-100 text-gray-600'
  }
}

export default function RepositoryDetailModal({ repository, isOpen, onClose }) {
  const [collaborators, setCollaborators] = useState([])
  const [loadingCollabs, setLoadingCollabs] = useState(false)
  const [collabError, setCollabError] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  useEffect(() => {
    if (!isOpen || !repository) return
    setCollaborators([])
    setCollabError(null)
    setConfirmRemove(null)
    setRemoveError(null)
    setLoadingCollabs(true)
    getRepositoryMembers(repository.id)
      .then((res) => setCollaborators(res.data))
      .catch(() => setCollabError('Failed to load collaborators.'))
      .finally(() => setLoadingCollabs(false))
  }, [isOpen, repository])

  const handleRemove = async (username) => {
    setRemoving(username)
    setRemoveError(null)
    try {
      await removeRepositoryCollaborator(repository.id, username)
      setCollaborators((prev) => prev.filter((c) => c.login !== username))
      setConfirmRemove(null)
    } catch (err) {
      setRemoveError(err.response?.data?.message ?? 'Failed to remove collaborator.')
      setConfirmRemove(null)
    } finally {
      setRemoving(null)
    }
  }

  if (!isOpen || !repository) return null

  const lastSynced = repository.last_synced_at
    ? new Date(repository.last_synced_at).toLocaleDateString()
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <CodeBracketIcon className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{repository.name}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${repository.private ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {repository.private ? 'Private' : 'Public'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{repository.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Open on GitHub"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Description */}
          {repository.description && (
            <p className="text-sm text-gray-600">{repository.description}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Language',       value: repository.language ?? '—' },
              { label: 'Default Branch', value: repository.default_branch ?? '—' },
              { label: 'Stars',          value: repository.stars_count ?? 0 },
              { label: 'Forks',          value: repository.forks_count ?? 0 },
              { label: 'Open Issues',    value: repository.open_issues_count ?? 0 },
              { label: 'Last Synced',    value: lastSynced },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Clone URL */}
          {repository.clone_url && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Clone URL</p>
              <code className="block text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-700 select-all break-all">
                {repository.clone_url}
              </code>
            </div>
          )}

          {/* Collaborators */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Collaborators</h3>

            {removeError && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {removeError}
              </p>
            )}

            {loadingCollabs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </div>
                ))}
              </div>
            ) : collabError ? (
              <p className="text-sm text-red-600">{collabError}</p>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-gray-400">No collaborators found.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {collaborators.map((collab) => {
                  const perm = permissionLabel(collab)
                  const isConfirming = confirmRemove === collab.login
                  const isRemoving = removing === collab.login

                  return (
                    <li key={collab.login} className="flex items-center gap-3 py-2.5">
                      <img
                        src={collab.avatar_url}
                        alt={collab.login}
                        className="h-8 w-8 rounded-full shrink-0"
                      />
                      <a
                        href={collab.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-800 hover:text-blue-600 flex-1 truncate font-mono"
                      >
                        {collab.login}
                      </a>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${permissionColor(perm)}`}>
                        {perm}
                      </span>
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-gray-500">Remove?</span>
                          <button
                            onClick={() => handleRemove(collab.login)}
                            disabled={isRemoving}
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isRemoving ? '...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            disabled={isRemoving}
                            className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(collab.login)}
                          className="shrink-0 p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title={`Remove ${collab.login}`}
                        >
                          <UserMinusIcon className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
