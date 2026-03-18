import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      initAuth: () => {
        const { token } = get()
        set({ isAuthenticated: !!token })
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
)

export default useAuthStore
