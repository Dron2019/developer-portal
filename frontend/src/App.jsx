import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GithubCallbackPage from './pages/GithubCallbackPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import RepositoriesPage from './pages/RepositoriesPage'
import RequestsPage from './pages/RequestsPage'
import UsersPage from './pages/UsersPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/auth/github/callback" element={<GithubCallbackPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route
              path="/users"
              element={
                <RoleGuard roles={['admin']} fallback={<Navigate to="/" replace />}>
                  <UsersPage />
                </RoleGuard>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

