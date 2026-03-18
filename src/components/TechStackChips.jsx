const colors = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-green-100 text-green-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
  'bg-teal-100 text-teal-800',
]

export default function TechStackChips({ stack = [], limit }) {
  if (!stack || stack.length === 0) return null

  const displayed = limit ? stack.slice(0, limit) : stack
  const remaining = limit && stack.length > limit ? stack.length - limit : 0

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((tech, i) => (
        <span
          key={tech}
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[i % colors.length]}`}
        >
          {tech}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          +{remaining}
        </span>
      )}
    </div>
  )
}
