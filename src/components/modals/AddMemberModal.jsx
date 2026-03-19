import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { addProjectMember } from '../../api/projects'
import api from '../../api/axios'

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'qa', label: 'QA' },
  { value: 'tech_lead', label: 'Tech Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'guest', label: 'Guest' },
]

export default function AddMemberModal({ projectId, onClose, onAdded }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [role, setRole] = useState('developer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (selectedUser) return
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setDropdownOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get('/users/search', { params: { q: query.trim() } })
        setSuggestions(data)
        setDropdownOpen(data.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query, selectedUser])

  const selectUser = (user) => {
    setSelectedUser(user)
    setQuery(user.name)
    setDropdownOpen(false)
    setSuggestions([])
  }

  const clearSelection = () => {
    setSelectedUser(null)
    setQuery('')
    setSuggestions([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    setError('')
    try {
      await addProjectMember(projectId, { user_id: selectedUser.id, role })
      onAdded()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to add member.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Add Team Member</Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Search with autocomplete */}
            <div ref={wrapperRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or email</label>
              <div className="relative flex items-center">
                <MagnifyingGlassIcon className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    if (selectedUser) clearSelection()
                    setQuery(e.target.value)
                  }}
                  onFocus={() => { if (suggestions.length > 0) setDropdownOpen(true) }}
                  placeholder="Start typing a name or email…"
                  autoComplete="off"
                  className="w-full pl-9 pr-8 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searching && (
                  <svg className="absolute right-3 h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </div>

              {dropdownOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {suggestions.map((u) => (
                    <li
                      key={u.id}
                      onMouseDown={() => selectUser(u)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 cursor-pointer"
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="h-7 w-7 rounded-full shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selected user card */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.name} className="h-8 w-8 rounded-full shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedUser || loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
