import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useAuthStore from '../store/authStore'
import { login } from '../api/auth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, setToken } = useAuthStore()

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
      const res = await login(data)
      setToken(res.data.token)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid credentials. Please try again.'
      setError('root', { message })
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Developer Portal
      </h2>

      {location.state?.message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {location.state.message}
        </div>
      )}

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
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline">
          Create account
        </Link>
      </p>
    </div>
  )
}

