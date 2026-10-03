import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Guard from './components/Guard'
import Login from './pages/Login'
import Referral from './pages/Referral'
import Admin from './pages/admin/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/referral" element={<Guard><Referral /></Guard>} />
        <Route path="/admin/login" element={<Login admin />} />
        <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
