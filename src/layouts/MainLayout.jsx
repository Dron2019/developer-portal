import { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline'
import Sidebar from '../components/Sidebar'
import { getNotifications, markNotificationRead } from '../api/repositories'

export default function MainLayout() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.data.data ?? [])
      setUnreadCount(res.data.unread_count ?? 0)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      fetchNotifications()
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between items-center shrink-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="hidden md:block" /> {/* spacer on desktop */}

          {/* Notification bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-blue-600">{unreadCount} unread</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 ${!n.read_at ? 'bg-blue-50' : ''}`}
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">
                            {n.data?.type?.replace(/_/g, ' ')}
                          </p>
                          {n.data?.requester_name && (
                            <p className="text-xs text-gray-500">by {n.data.requester_name}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        {!n.read_at && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

