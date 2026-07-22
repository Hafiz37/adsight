
import React from 'react';
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  // Cek apakah token ada di localStorage
  const token = localStorage.getItem('token')

  // Kalau tidak ada token → paksa redirect ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Kalau ada token → tampilkan halaman yang diminta
  return children
}


