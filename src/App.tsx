import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { FileProvider } from './context/FileContext';
import Navigation from './components/Navigation';
import AdminNavigation from './components/AdminNavigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import Upload from './pages/Upload';
import MyFiles from './pages/MyFiles';
import Contact from './pages/Contact';
import PublicFiles from './pages/PublicFiles';
import PublicFileView from './pages/PublicFileView';

// const AppContent: React.FC = () => {
//   const { isAdmin } = useAuth();

//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       {isAdmin ? <AdminNavigation /> : <Navigation />}
      
//       <main className="flex-1">
//         <Routes>
//           <Route path="/" element={<Navigate to="/login" replace />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/admin/login" element={<AdminLogin />} />
//           <Route path="/admin/dashboard" element={
//             <AdminRoute>
//               <AdminDashboard />
//             </AdminRoute>
//           } />
//           <Route path="/home" element={
//             <ProtectedRoute>
//               <Home />
//             </ProtectedRoute>
//           } />
//           <Route path="/upload" element={
//             <ProtectedRoute>
//               <Upload />
//             </ProtectedRoute>
//           } />
//           <Route path="/my-files" element={
//             <ProtectedRoute>
//               <MyFiles />
//             </ProtectedRoute>
//           } />
//           <Route path="/contact" element={
//             <ProtectedRoute>
//               <Contact />
//             </ProtectedRoute>
//           } />
//           <Route path="/:username/files" element={<PublicFiles />} />
//           <Route path="/:username/files/:filename" element={<PublicFileView />} />
//           <Route path="*" element={<Navigate to="/home" replace />} />
//         </Routes>
//       </main>
      
//       {!isAdmin && <Footer />}
//     </div>
//   );
// };

const AppContent: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {isAdmin ? <AdminNavigation /> : <Navigation />}
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/my-files" element={
            <ProtectedRoute>
              <MyFiles />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          } />
          <Route path="/:username/files" element={<PublicFiles />} />
          <Route path="/:username/files/:filename" element={<PublicFileView />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      
      {!isAdmin && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <FileProvider>
          <Router>
            <AppContent />
          </Router>
        </FileProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;