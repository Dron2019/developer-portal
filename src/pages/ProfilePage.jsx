import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CodeBracketIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import useAuthStore from '../store/authStore'
import api from '../api/axios'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  current_password: z.string().optional(),
}).superRefine((data, ctx) => {
  // current_password required only if email is being changed — validated server-side
})

const passwordSchema = z.object({
  current_password:      z.string().min(1, 'Current password is required'),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  )
}

function Alert({ type, message }) {
  if (!message) return null
  const styles = type === 'success'
    ? 'text-green-700 bg-green-50 border-green-200'
    : 'text-red-700 bg-red-50 border-red-200'
  const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon
  return (
    <div className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-3 mb-4 ${styles}`}>
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  )
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' })
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' })
  const [githubStatus, setGithubStatus] = useState({ type: '', message: '' })
  const [preferencesStatus, setPreferencesStatus] = useState({ type: '', message: '' })
  const [githubNickname, setGithubNickname] = useState(user?.github_nickname ?? '')
  const [githubSaving, setGithubSaving] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', current_password: '' },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })

  // Update local state when user object changes
  useEffect(() => {
    if (user) {
      setEmailNotifications(user.email_notifications ?? true)
      setGithubNickname(user.github_nickname ?? '')
    }
  }, [user])

  const onProfileSubmit = async (data) => {
    setProfileStatus({ type: '', message: '' })
    const payload = { name: data.name, email: data.email }
    if (data.current_password) payload.current_password = data.current_password
    try {
      const res = await api.put('/auth/profile', payload)
      setUser({ ...user, ...res.data.data })
      profileForm.setValue('current_password', '')
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' })
    } catch (err) {
      const errors = err.response?.data?.errors ?? {}
      if (errors.current_password) profileForm.setError('current_password', { message: errors.current_password[0] })
      if (errors.email) profileForm.setError('email', { message: errors.email[0] })
      const msg = err.response?.data?.message ?? 'Failed to update profile.'
      setProfileStatus({ type: 'error', message: msg })
    }
  }

  const onPasswordSubmit = async (data) => {
    setPasswordStatus({ type: '', message: '' })
    try {
      await api.put('/auth/profile', data)
      passwordForm.reset()
      setPasswordStatus({ type: 'success', message: 'Password changed successfully.' })
    } catch (err) {
      const errors = err.response?.data?.errors ?? {}
      if (errors.current_password) {
        passwordForm.setError('current_password', { message: errors.current_password[0] })
      }
      const msg = err.response?.data?.message ?? 'Failed to change password.'
      setPasswordStatus({ type: 'error', message: msg })
    }
  }

  const onGithubSubmit = async (e) => {
    e.preventDefault()
    setGithubStatus({ type: '', message: '' })
    const value = githubNickname.trim().replace(/^@/, '')
    if (value && !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
      setGithubStatus({ type: 'error', message: 'Invalid GitHub username format.' })
      return
    }
    setGithubSaving(true)
    try {
      const res = await api.put('/auth/profile', { github_nickname: value || null })
      setUser({ ...user, github_nickname: res.data.data?.github_nickname ?? (value || null) })
      setGithubStatus({ type: 'success', message: 'GitHub username saved.' })
    } catch (err) {
      const msg = err.response?.data?.errors?.github_nickname?.[0]
        ?? err.response?.data?.message
        ?? 'Failed to save GitHub username.'
      setGithubStatus({ type: 'error', message: msg })
    } finally {
      setGithubSaving(false)
    }
  }

  const onPreferencesSubmit = async (e) => {
    e.preventDefault()
    setPreferencesStatus({ type: '', message: '' })
    setPreferencesSaving(true)
    try {
      const res = await api.put('/auth/profile', { email_notifications: emailNotifications })
      setUser({ ...user, email_notifications: emailNotifications })
      setPreferencesStatus({ type: 'success', message: 'Preferences updated successfully.' })
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to update preferences.'
      setPreferencesStatus({ type: 'error', message: msg })
    } finally {
      setPreferencesSaving(false)
    }
  }

  const roleColors = {
    admin:     'bg-purple-100 text-purple-700',
    manager:   'bg-blue-100 text-blue-700',
    developer: 'bg-green-100 text-green-700',
    guest:     'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your account details</p>

      {/* Avatar + info card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center gap-5 mb-6">
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          : <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
              {user?.name?.[0]}
            </div>
        }
        <div>
          <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {user?.role}
            </span>
            {user?.github_nickname && (
              <span className="text-xs text-gray-400 font-mono">@{user.github_nickname}</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit name & email */}
      <Section icon={UserCircleIcon} title="Personal Information">
        <Alert {...profileStatus} />
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              {...profileForm.register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {profileForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              {...profileForm.register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {profileForm.formState.errors.email && (
              <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span className="text-gray-400 font-normal">(required to change email)</span>
            </label>
            <input
              type="password"
              placeholder="Leave blank if not changing email"
              {...profileForm.register('current_password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {profileForm.formState.errors.current_password && (
              <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.current_password.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
            >
              {profileForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change password */}
      <Section icon={KeyIcon} title="Change Password">
        <Alert {...passwordStatus} />
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              {...passwordForm.register('current_password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.current_password && (
              <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              {...passwordForm.register('password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              {...passwordForm.register('password_confirmation')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.password_confirmation && (
              <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.password_confirmation.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
            >
              {passwordForm.formState.isSubmitting ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </Section>

      {/* Notification Preferences */}
      <Section icon={BellIcon} title="Notification Preferences">
        <Alert {...preferencesStatus} />
        <form onSubmit={onPreferencesSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive email notifications for repository requests, approvals, and other important updates
                </p>
              </div>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={preferencesSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
            >
              {preferencesSaving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </Section>

      {/* GitHub username */}
      <Section icon={CodeBracketIcon} title="GitHub Account">
        <Alert {...githubStatus} />
        <form onSubmit={onGithubSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Username</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm select-none">@</span>
              <input
                type="text"
                value={githubNickname}
                onChange={(e) => setGithubNickname(e.target.value)}
                placeholder="your-github-username"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Required for GitHub collaboration invitations when a repository access request is approved.
              If you signed in with GitHub OAuth this is set automatically.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={githubSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
            >
              {githubSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  )
}
