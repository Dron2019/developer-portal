import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '../api/auth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      const res = await forgotPassword(data)
      setSuccessMessage(res.data.message)
    } catch (err) {
      const message =
        err.response?.data?.message || 'Something went wrong. Please try again.'
      setError('root', { message })
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Forgot Password
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {successMessage ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm text-center">
          {successMessage}
        </div>
      ) : (
        <>
          {errors.root && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  )
}
