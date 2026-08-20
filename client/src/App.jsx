import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Procurement from './pages/Procurement'
import TasksEquipment from './pages/TasksEquipment'
import PhotoProgress from './pages/PhotoProgress'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import { RoleProvider } from './context/RoleContext'
import { AlertsProvider } from './context/AlertsContext'
import { ROLES } from './lib/constants'

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <RoleProvider>
          <AlertsProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Marketing & Auth Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/welcome" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Application Portal Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/procurement" element={<Procurement />} />
                  <Route path="/tasks-equipment" element={<TasksEquipment />} />
                  <Route path="/photo-progress" element={<PhotoProgress />} />
                  <Route
                    path="/assistant"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER]}>
                        <Assistant />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/user-management"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AlertsProvider>
        </RoleProvider>
      </SiteProvider>
    </AuthProvider>
  )
}
