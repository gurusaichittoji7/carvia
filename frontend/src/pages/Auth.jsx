import { useState } from "react"
import { supabase } from "../lib/supabase"
export default function Auth() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true); setMessage("")
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else if (mode === "signup") setMessage("Check your email to confirm your account.")
    setLoading(false)
  }
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/tailor" } })
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-semibold">C</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-gray-500 mt-1">{mode === "login" ? "Sign in to Carvia" : "Start tailoring resumes for free"}</p>
        </div>
        <button onClick={handleGoogle} className="w-full border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 mb-4">Continue with Google</button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-100" /><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-100" />
        </div>
        <form onSubmit={handleEmail} className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required />
          {message && <p className="text-xs text-blue-600">{message}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-blue-600 hover:underline">{mode === "login" ? "Sign up" : "Sign in"}</button>
        </p>
      </div>
    </div>
  )
}
