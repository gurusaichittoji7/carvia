import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Tailor from './pages/Tailor'
import CoverLetter from './pages/CoverLetter'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import ProtectedRoute from './components/ProtectedRoute'
import Interview from './pages/Interview'

export default function App() {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  if (session === undefined) return null
  return (
    <BrowserRouter>
      <Navbar session={session} />
      <Routes>
        <Route path="/" element={<Landing session={session} />} />
        <Route path="/auth" element={session ? <Navigate to="/tailor" /> : <Auth />} />
        <Route path="/tailor" element={<ProtectedRoute session={session}><Tailor /></ProtectedRoute>} />
        <Route path="/cover-letter" element={<ProtectedRoute session={session}><CoverLetter /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute session={session}><Dashboard /></ProtectedRoute>} />
        <Route path="/analyze" element={<ProtectedRoute session={session}><Analyze /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute session={session}><Interview /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
