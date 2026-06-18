import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ session }) {
  const nav = useNavigate()
  async function signOut() { await supabase.auth.signOut(); nav('/') }
  return (
    <nav className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">      <Link to="/" className="flex items-center gap-2">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
  <rect width="36" height="36" rx="10" fill="#2563eb"/>
  <rect x="10" y="8" width="13" height="17" rx="2" fill="white" opacity="0.9"/>
  <path d="M13 14 L20 14 M13 17 L20 17 M13 20 L17 20" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="23" cy="23" r="6" fill="#0a0a0a"/>
  <path d="M20 23 L22 25 L26 21" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    <span className="text-lg font-bold text-gray-900">Car<span className="text-blue-600">via</span></span>      </Link>
      <div className="flex items-center gap-6">
        {session ? (
          <>
            <Link to="/tailor" className="text-sm text-gray-600 hover:text-gray-900">Resume</Link>
            <Link to="/cover-letter" className="text-sm text-gray-600 hover:text-gray-900">Cover Letter</Link>
            <Link to="/analyze" className="text-sm text-gray-600 hover:text-gray-900">Analyzer</Link>
            <Link to="/interview" className="text-sm text-gray-600 hover:text-gray-900">Interview Prep</Link>
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
          </>
        ) : (
          <Link to="/auth" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            Get started
          </Link>
        )}
      </div>
    </nav>
  )
}