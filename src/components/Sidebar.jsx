import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  FolderIcon,
  CodeBracketIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import useAuthStore from '../store/authStore'
import RoleGuard from './RoleGuard'
import { logout as logoutApi } from '../api/auth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Repositories', href: '/repositories', icon: CodeBracketIcon },
  { name: 'Requests', href: '/requests', icon: ClipboardDocumentListIcon },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch {
      // proceed with local logout even if request fails
    }
    logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800 shrink-0">
          <h1 className="text-xl font-bold">Developer Portal</h1>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}

          <RoleGuard roles={['admin']}>
            <NavLink
              to="/users"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <UsersIcon className="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
              Users
            </NavLink>
            <NavLink
              to="/settings"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
              Settings
            </NavLink>
          </RoleGuard>
        </nav>

        <div className="border-t border-gray-700 p-4 shrink-0">
          {user && (
            <Link
              to="/profile"
              onClick={handleNavClick}
              className="flex items-center gap-3 mb-3 rounded-md px-1 py-1 hover:bg-gray-700 transition-colors"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-8 w-8 rounded-full shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {user.role}
                </p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

