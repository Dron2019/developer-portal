import { StarIcon, CodeBracketIcon, TrashIcon } from '@heroicons/react/24/outline'

const languageColors = {
  JavaScript: 'bg-yellow-100 text-yellow-800',
  TypeScript: 'bg-blue-100 text-blue-800',
  PHP: 'bg-purple-100 text-purple-800',
  Python: 'bg-green-100 text-green-800',
  Ruby: 'bg-red-100 text-red-800',
  Go: 'bg-cyan-100 text-cyan-800',
  Java: 'bg-orange-100 text-orange-800',
  'C#': 'bg-indigo-100 text-indigo-800',
}

export default function RepositoryCard({ repository, onRequestAccess, onDelete, canDelete }) {
  const langClass = languageColors[repository.language] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CodeBracketIcon className="h-5 w-5 text-gray-400 shrink-0" />
          <a
            href={repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:underline truncate"
          >
            {repository.name}
          </a>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${repository.private ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {repository.private ? 'Private' : 'Public'}
        </span>
      </div>

      {repository.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{repository.description}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
        {repository.language && (
          <span className={`px-2 py-0.5 rounded-full font-medium ${langClass}`}>
            {repository.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <StarIcon className="h-3.5 w-3.5" />
          {repository.stars_count ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
          </svg>
          {repository.forks_count ?? 0}
        </span>
      </div>

      <div className="mt-auto pt-2 flex gap-2">
        <button
          onClick={() => onRequestAccess(repository)}
          className="flex-1 text-sm px-3 py-1.5 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
        >
          Request Access
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(repository)}
            className="flex items-center justify-center px-2.5 py-1.5 rounded-md border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove from local database"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
