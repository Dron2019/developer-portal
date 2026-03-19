import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '../api/auth'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token || !email) {
      navigate('/login', { replace: true })
    }
  }, [token, email, navigate])

  if (!token || !email) {
    return null
  }

  const onSubmit = async (data) => {
    try {
      await resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      navigate('/login', { state: { message: 'Password reset successfully. You can now sign in.' } })
    } catch (err) {
      const message =
        err.response?.data?.message || 'Something went wrong. Please try again.'
      setError('root', { message })
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Reset Password
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Enter your new password below.
      </p>

      {errors.root && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            {...register('password_confirmation')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password_confirmation && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  )
}
