import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/public/Home';
import QuizRunner from './pages/public/QuizRunner';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import QuizManagement from './pages/admin/QuizManagement';
import ResponseList from './pages/admin/ResponseList';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:id" element={<QuizRunner />} />
        <Route path="/manage/login" element={<Login />} />

        <Route path="/manage" element={<AdminLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route index element={<QuizManagement />} />
            <Route path="responses" element={<ResponseList />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
