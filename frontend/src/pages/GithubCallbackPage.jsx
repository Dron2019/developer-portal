import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getMe } from '../api/auth'

export default function GithubCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setToken, setUser } = useAuthStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setToken(token)
      getMe()
        .then((res) => {
          setUser(res.data)
          navigate('/')
        })
        .catch(() => {
          setToken(null)
          setError('GitHub authentication failed. Please try again.')
          setTimeout(() => navigate('/login'), 3000)
        })
    } else {
      setError('No authentication token received. Redirecting to login...')
      setTimeout(() => navigate('/login'), 3000)
    }
  }, [navigate, searchParams, setToken, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <>
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md text-sm max-w-sm">
              {error}
            </div>
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Completing GitHub login...</p>
          </>
        )}
      </div>
    </div>
  )
}
