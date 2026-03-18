const statusConfig = {
  active: { label: 'Active', classes: 'bg-green-100 text-green-800' },
  development: { label: 'Development', classes: 'bg-blue-100 text-blue-800' },
  archived: { label: 'Archived', classes: 'bg-gray-100 text-gray-800' },
  on_hold: { label: 'On Hold', classes: 'bg-yellow-100 text-yellow-800' },
}

export default function ProjectStatusBadge({ status }) {
  const config = statusConfig[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
