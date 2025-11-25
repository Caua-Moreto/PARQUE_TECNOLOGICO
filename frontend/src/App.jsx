import react from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AssetList from "./pages/AssetList";
import AssetForm from "./pages/AssetForm";
import Sidebar from "./components/Sidebar";
import AuthLayout from "./components/AuthLayout";
import FieldManager from "./pages/FieldManager";
import ForgotPassword from './pages/ForgotPassword';
import AdminUserList from "./pages/AdminUserList";

const AppLayout = () => (
  <>
    <Sidebar />
    <main className="main-content">
      <Outlet /> 
    </main>
  </>
);

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      {/* --- CONFIGURAÇÃO DO TOASTER --- */}
      <Toaster
        position="top-right"
        toastOptions={{
          // Estilos para o tema escuro
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
          // Estilos para notificações de sucesso
          success: {
            iconTheme: {
              primary: '#38b2ac',
              secondary: '#f9fafb',
            },
          },
          // Estilos para notificações de erro
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />

      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<NotFound />} />

        <Route 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/admin/users" element={<AdminUserList />} />
          <Route path="/category/:categoryId" element={<AssetList />} />
          <Route path="/category/:categoryId/manage" element={<FieldManager />} />
          <Route path="/category/:categoryId/new-asset" element={<AssetForm />} />
          <Route path="/edit-asset/:assetId" element={<AssetForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;