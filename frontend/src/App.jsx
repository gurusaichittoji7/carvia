import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Tailor from './pages/Tailor'
import CoverLetter from './pages/CoverLetter'
import Dashboard from './pages/Dashboard'
import ResumeOutput from './pages/ResumeOutput'
import ProtectedRoute from './components/ProtectedRoute'

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
      <Routes>
        <Route path="/" element={<><Navbar session={session} /><Landing session={session} /></>} />
        <Route path="/auth" element={session ? <Navigate to="/tailor" /> : <Auth />} />
        <Route path="/tailor" element={<ProtectedRoute session={session}><Navbar session={session} /><Tailor /></ProtectedRoute>} />
        <Route path="/cover-letter" element={<ProtectedRoute session={session}><Navbar session={session} /><CoverLetter /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute session={session}><Navbar session={session} /><Dashboard /></ProtectedRoute>} />
        <Route path="/resume-output" element={<ProtectedRoute session={session}><ResumeOutput /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
