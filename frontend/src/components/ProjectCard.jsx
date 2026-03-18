import { Link } from 'react-router-dom'
import { UsersIcon } from '@heroicons/react/24/outline'
import ProjectStatusBadge from './ProjectStatusBadge'
import TechStackChips from './TechStackChips'

export default function ProjectCard({ project }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
          <ProjectStatusBadge status={project.status} />
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
        )}

        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="mb-3">
            <TechStackChips stack={project.tech_stack} limit={3} />
          </div>
        )}

        <div className="flex items-center text-xs text-gray-500">
          <UsersIcon className="h-3.5 w-3.5 mr-1" />
          <span>{project.members_count ?? 0} member{project.members_count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="px-5 pb-4">
        <Link
          to={`/projects/${project.id}`}
          className="block w-full text-center py-1.5 px-3 text-sm font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
        >
          Open
        </Link>
      </div>
    </div>
  )
}
