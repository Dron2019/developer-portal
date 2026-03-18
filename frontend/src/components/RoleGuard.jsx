import useAuthStore from '../store/authStore'

export default function RoleGuard({ roles = [], children, fallback = null }) {
  const user = useAuthStore((state) => state.user)

  if (!user || !roles.includes(user.role)) {
    return fallback
  }

  return children
}
