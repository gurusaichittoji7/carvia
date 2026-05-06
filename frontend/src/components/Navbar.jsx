import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ session }) {
  const nav = useNavigate()
  async function signOut() { await supabase.auth.signOut(); nav('/') }
  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <span className="text-lg font-bold text-white">Car<span className="text-blue-500">via</span></span>
      </Link>
      <div className="flex items-center gap-6">
        {session ? (
          <>
            <Link to="/tailor" className="text-sm text-gray-400 hover:text-white">Resume</Link>
            <Link to="/cover-letter" className="text-sm text-gray-400 hover:text-white">Cover Letter</Link>
            <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-white">Sign out</button>
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