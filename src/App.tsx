import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Dashboard } from './pages/Dashboard';
import { Fornecedores } from './pages/Fornecedores';
import { Compras } from './pages/Compras';
import { Receitas } from './pages/Receitas';
import { DespesasFixas } from './pages/DespesasFixas';
import { Relatorios } from './pages/Relatorios';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="compras" element={<Compras />} />
              <Route path="receitas" element={<Receitas />} />
              <Route path="despesas-fixas" element={<DespesasFixas />} />
              <Route path="relatorios" element={<Relatorios />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
