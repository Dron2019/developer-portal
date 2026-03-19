import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartBarIcon,
  FolderIcon,
  CodeBracketIcon,
  UserGroupIcon,
  PlusIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { getDashboardStats } from '../api/dashboard'
import useAuthStore from '../store/authStore'
import ProjectStatusBadge from '../components/ProjectStatusBadge'

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`rounded-md p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

const QuickAction = ({ to, icon: Icon, title, description, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 hover:text-blue-700',
    green: 'text-green-600 hover:text-green-700',
    purple: 'text-purple-600 hover:text-purple-700',
  }

  return (
    <Link
      to={to}
      className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 ${colorClasses[color]} mt-0.5`} />
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const { data } = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="h-12 w-12 rounded-full" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-xl font-semibold">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">Good {getTimeOfDay()}, {user?.name || 'there'}!</h1>
            <p className="text-blue-100">Welcome back to your developer portal</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FolderIcon}
              title="Projects"
              value={stats.stats.total_projects}
              subtitle={`${stats.stats.projects_by_status.active} active`}
              color="blue"
            />
            <StatCard
              icon={CodeBracketIcon}
              title="Repositories"
              value={stats.stats.total_repositories}
              subtitle="Linked repos"
              color="green"
            />
            {stats.stats.total_users && (
              <StatCard
                icon={UserGroupIcon}
                title="Team Members"
                value={stats.stats.total_users}
                subtitle="Total users"
                color="purple"
              />
            )}
            <StatCard
              icon={ArrowTrendingUpIcon}
              title="Active Projects"
              value={stats.stats.projects_by_status.active}
              subtitle="In development"
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Projects */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <Link
                  to="/projects"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
              {stats.recent_projects && stats.recent_projects.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{project.name}</p>
                            <p className="text-xs text-gray-500">
                              {project.members_count} members • {project.repositories_count} repositories
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ProjectStatusBadge status={project.status} />
                          <span className="text-xs text-gray-500">{formatTimeAgo(project.updated_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No projects yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <QuickAction
                  to="/projects/create"
                  icon={PlusIcon}
                  title="New Project"
                  description="Create a new project"
                  color="blue"
                />
                <QuickAction
                  to="/repositories"
                  icon={CodeBracketIcon}
                  title="Browse Repositories"
                  description="Explore all repositories"
                  color="green"
                />
                <QuickAction
                  to="/projects"
                  icon={EyeIcon}
                  title="View Projects"
                  description="See all your projects"
                  color="purple"
                />
              </div>
            </div>
          </div>

          {/* Recent Activity & Language Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {stats.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recent_activity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {activity.user?.name || 'Someone'}
                          </span>{' '}
                          {activity.description}
                        </p>
                        {activity.project && (
                          <Link
                            to={`/projects/${activity.project.id}`}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {activity.project.name}
                          </Link>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No activity yet</p>
              )}
            </div>

            {/* Language Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Languages</h2>
              {stats.language_stats && stats.language_stats.length > 0 ? (
                <div className="space-y-3">
                  {stats.language_stats.map((lang, index) => (
                    <div key={lang.language} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" style={{
                          backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
                        }}></div>
                        <span className="text-sm font-medium text-gray-900">{lang.language}</span>
                      </div>
                      <span className="text-sm text-gray-500">{lang.count} repos</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No language data yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
