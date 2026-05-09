// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect dari "/" ke "/login" */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Halaman Login */}
        <Route path="/login" element={<Login />} />

        {/* Halaman Register */}
        <Route path="/register" element={<Register />} />

        {/* Halaman Dashboard — dilindungi PrivateRoute */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App