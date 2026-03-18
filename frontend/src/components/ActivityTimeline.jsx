import { ClockIcon } from '@heroicons/react/24/outline'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const actionColors = {
  created: 'bg-green-500',
  updated: 'bg-blue-500',
  deleted: 'bg-red-500',
  member_added: 'bg-purple-500',
  member_removed: 'bg-orange-500',
  member_updated: 'bg-yellow-500',
  server_added: 'bg-teal-500',
  server_removed: 'bg-pink-500',
  file_uploaded: 'bg-indigo-500',
  file_deleted: 'bg-red-400',
  note_created: 'bg-cyan-500',
  note_deleted: 'bg-rose-500',
}

export default function ActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ClockIcon className="mx-auto h-8 w-8 mb-2 text-gray-400" />
        <p>No activity yet.</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, i) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {i < activities.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${actionColors[activity.action] ?? 'bg-gray-400'}`}
                  >
                    {activity.user?.avatar_url ? (
                      <img
                        src={activity.user.avatar_url}
                        alt={activity.user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {activity.user?.name?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{activity.user?.name ?? 'System'}</span>{' '}
                      <span className="text-gray-500">{activity.description || activity.action}</span>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-400">
                    {formatDate(activity.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
