import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewInspectionPage } from './pages/NewInspectionPage'
import { ReportsListPage } from './pages/ReportsListPage'
import { NewVehiclePage } from './pages/NewVehiclePage'
import { NewDriverPage } from './pages/NewDriverPage'
import { AccountsPage } from './pages/AccountsPage'
import { MechanicQueuePage } from './pages/MechanicQueuePage'
import { FleetOverviewPage } from './pages/FleetOverviewPage'
import { VehicleHistoryPage } from './pages/VehicleHistoryPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections/new"
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <NewInspectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['MECHANIC', 'FLEET_MANAGER', 'ADMIN']}>
              <ReportsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <ProtectedRoute allowedRoles={['MECHANIC']}>
              <MechanicQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute allowedRoles={['MECHANIC', 'FLEET_MANAGER', 'ADMIN']}>
              <FleetOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/new"
          element={
            <ProtectedRoute allowedRoles={['FLEET_MANAGER']}>
              <NewVehiclePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <ProtectedRoute allowedRoles={['MECHANIC', 'FLEET_MANAGER', 'ADMIN']}>
              <VehicleHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers/new"
          element={
            <ProtectedRoute allowedRoles={['FLEET_MANAGER']}>
              <NewDriverPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
