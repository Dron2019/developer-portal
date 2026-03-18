import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { KeyIcon, BuildingOfficeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { getGithubSettings, updateGithubSettings } from '../api/settings'

export default function SettingsPage() {
  const [hasToken, setHasToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { github_token: '', github_org: '' },
  })

  useEffect(() => {
    getGithubSettings()
      .then((res) => {
        setHasToken(res.data.has_token)
        setValue('github_org', res.data.github_org ?? '')
      })
      .catch(() => setErrorMsg('Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [setValue])

  const onSubmit = async (data) => {
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    // Don't send empty token string — means "leave unchanged"
    const payload = { github_org: data.github_org }
    if (data.github_token.trim() !== '') {
      payload.github_token = data.github_token
    }

    try {
      await updateGithubSettings(payload)
      setSuccessMsg('GitHub settings saved successfully.')
      setHasToken(true)
      setValue('github_token', '')
    } catch {
      setErrorMsg('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Global configuration. Only admins can change these.</p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-800">GitHub Account</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          {/* GitHub Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Access Token
            </label>
            <input
              type="password"
              placeholder={hasToken ? '••••••••••••••••••••• (set — enter new value to replace)' : 'ghp_...'}
              {...register('github_token')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Used for all GitHub API calls (repo sync, creation, collaborator management).
              Leave blank to keep the current token.
            </p>
          </div>

          {/* GitHub Org */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
              Organization
            </label>
            <input
              type="text"
              placeholder="my-github-org (optional)"
              {...register('github_org')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              When set, repositories are synced from and created under this organisation.
              Leave blank to use the authenticated user's account instead.
            </p>
          </div>

          {/* Status messages */}
          {successMsg && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
