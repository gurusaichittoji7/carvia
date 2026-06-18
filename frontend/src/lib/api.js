import { supabase } from "./supabase"
const BASE = import.meta.env.VITE_API_URL

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data && data.session && data.session.access_token
  if (!token) throw new Error("Not logged in")
  return { "Content-Type": "application/json", Authorization: "Bearer " + token }
}

export async function tailorResume(payload) {
  const res = await fetch(BASE + "/tailor", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error((await res.json()).detail || "Failed")
  return res.json()
}

export async function generateCoverLetter(payload) {
  const res = await fetch(BASE + "/cover-letter", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error((await res.json()).detail || "Failed")
  return res.json()
}

export async function getDashboard() {
  const res = await fetch(BASE + "/dashboard", { headers: await authHeaders() })
  if (!res.ok) throw new Error("Failed to load dashboard")
  return res.json()
}

export async function deleteResume(id) {
  const res = await fetch(BASE + "/dashboard/" + id, {
    method: "DELETE",
    headers: await authHeaders()
  })
  if (!res.ok) throw new Error("Failed to delete")
  return res.json()
}

export async function analyzeMatch(payload) {
  const res = await fetch(BASE + "/analyze", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error((await res.json()).detail || "Failed")
  return res.json()
}

export async function generateInterviewPrep(payload) {
  const res = await fetch(BASE + "/interview", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error((await res.json()).detail || "Failed")
  return res.json()
}

export async function updateResumeStatus(id, status) {
  const res = await fetch(BASE + "/dashboard/" + id + "/status", {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ status })
  })
  if (!res.ok) throw new Error("Failed to update status")
  return res.json()
}