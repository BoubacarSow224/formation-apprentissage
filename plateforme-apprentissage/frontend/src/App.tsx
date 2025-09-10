import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Container, Box, Toolbar } from '@mui/material';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import Quiz from './pages/quiz/Quiz';
import Community from './pages/community/Community';
import Jobs from './pages/jobs/Jobs';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import FormateurDashboard from './pages/FormateurDashboard';
import ApprenantDashboard from './pages/ApprenantDashboard';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <AuthProvider>
      <div className="App">
        {!isHomePage && <Navbar />}
        {isHomePage ? (
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        ) : (
          <Box>
            {!isHomePage && <Toolbar />}
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/courses" element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              } />
              <Route path="/courses/:id" element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              } />
              <Route path="/quiz/:id" element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } />
              <Route path="/community" element={
                <ProtectedRoute>
                  <Community />
                </ProtectedRoute>
              } />
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/formateur" element={
                <ProtectedRoute>
                  <FormateurDashboard />
                </ProtectedRoute>
              } />
              <Route path="/apprenant" element={
                <ProtectedRoute>
                  <ApprenantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/entreprise" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Routes>
            </Container>
          </Box>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
