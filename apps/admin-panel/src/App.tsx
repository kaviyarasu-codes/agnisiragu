// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ArticleListPage from './pages/ArticleListPage';
import ArticleFormPage from './pages/ArticleFormPage';
import CategoryManagerPage from './pages/CategoryManagerPage';
import UserManagementPage from './pages/UserManagementPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import PushNotificationPage from './pages/PushNotificationPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/articles" element={<ArticleListPage />} />
                <Route path="/articles/new" element={<ArticleFormPage mode="create" />} />
                <Route path="/articles/:id/edit" element={<ArticleFormPage mode="edit" />} />
                <Route path="/categories" element={<CategoryManagerPage />} />
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/media" element={<MediaLibraryPage />} />
                <Route path="/notifications" element={<PushNotificationPage />} />
                <Route path="/audit-logs" element={<AuditLogPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
