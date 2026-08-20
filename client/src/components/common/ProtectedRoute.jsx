import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-xs font-semibold text-navy-600">Verifying JWT Authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role !== 'Admin' && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h3 className="text-base font-bold text-red-900">403 — Access Denied</h3>
        <p className="mt-1 text-xs text-red-700">
          Your authenticated role (<strong>{user?.role}</strong>) does not have authorization to view this page.
        </p>
      </div>
    )
  }

  return children
}
