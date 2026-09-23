import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import RootLanding from './pages/RootLanding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import MapView from './pages/MapView';
import AlertCenter from './pages/AlertCenter';
import DataManagement from './pages/DataManagement';
import About from './pages/About';
import SampleDetail from './pages/SampleDetail';

import WorkerDashboard from './pages/worker/WorkerDashboard';
import CollectSample from './pages/worker/CollectSample';
import WorkerSamples from './pages/worker/WorkerSamples';
import WorkerProfile from './pages/worker/WorkerProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSamples from './pages/admin/AdminSamples';
import WorkerManagement from './pages/admin/WorkerManagement';
import AuditLogs from './pages/admin/AuditLogs';

import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Root & Auth */}
            <Route path="/" element={<RootLanding />} />
            <Route path="/login" element={<Login />} />

            {/* Citizen Portal (Public) */}
            <Route path="/citizen">
              <Route index element={<Navigate to="/citizen/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="explorer" element={<Explorer />} />
              <Route path="map" element={<MapView />} />
              <Route path="alerts" element={<AlertCenter />} />
              <Route path="about" element={<About />} />
              <Route path="sample/:id" element={<SampleDetail />} />
            </Route>

            {/* Worker Portal (Protected) */}
            <Route path="/worker" element={<ProtectedRoute allowedRoles={['field_worker']} />}>
              <Route index element={<Navigate to="/worker/dashboard" replace />} />
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="collect" element={<CollectSample />} />
              <Route path="samples" element={<WorkerSamples />} />
              <Route path="profile" element={<WorkerProfile />} />
            </Route>

            {/* Admin Portal (Protected) */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="samples" element={<AdminSamples />} />
              <Route path="data" element={<DataManagement />} />
              <Route path="workers" element={<WorkerManagement />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
            
            {/* Fallbacks */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
