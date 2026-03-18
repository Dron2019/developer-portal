const statusConfig = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', classes: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-800' },
  active: { label: 'Active', classes: 'bg-blue-100 text-blue-800' },
  archived: { label: 'Archived', classes: 'bg-gray-100 text-gray-800' },
  development: { label: 'Development', classes: 'bg-purple-100 text-purple-800' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
