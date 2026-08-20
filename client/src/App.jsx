import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Procurement from './pages/Procurement'
import TasksEquipment from './pages/TasksEquipment'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'
import { SiteProvider } from './context/SiteContext'
import { RoleProvider } from './context/RoleContext'
import { AlertsProvider } from './context/AlertsContext'

export default function App() {
  return (
    <SiteProvider>
      <RoleProvider>
        <AlertsProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/procurement" element={<Procurement />} />
                <Route path="/tasks-equipment" element={<TasksEquipment />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/user-management" element={<UserManagement />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AlertsProvider>
      </RoleProvider>
    </SiteProvider>
  )
}
