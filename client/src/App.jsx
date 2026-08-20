import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
                {/* Public Login Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Application Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
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
              </Routes>
            </BrowserRouter>
          </AlertsProvider>
        </RoleProvider>
      </SiteProvider>
    </AuthProvider>
  )
}
