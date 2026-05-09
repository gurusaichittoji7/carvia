import { useState, useRef } from "react"
import { generateCoverLetter } from "../lib/api"
import mammoth from "mammoth"

export default function CoverLetter() {
  const [tab, setTab] = useState("upload")
  const [resumeText, setResumeText] = useState("")
  const [resumePdfBase64, setResumePdfBase64] = useState(null)
  const [jd, setJd] = useState("")
  const [hiringManager, setHiringManager] = useState("")
  const [company, setCompany] = useState("")
  const [tone, setTone] = useState("professional")
  const [length, setLength] = useState("standard")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const fileRef = useRef()

  async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  setFileName(file.name)
  setResumeText(''); setResumePdfBase64(null)
  if (ext === 'txt') { setResumeText(await file.text()) }
  else if (ext === 'docx') {
    const buf = await file.arrayBuffer()
    const res = await mammoth.extractRawText({ arrayBuffer: buf })
    setResumeText(res.value)
  } else if (ext === 'pdf') {
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    bytes.forEach(b => binary += String.fromCharCode(b))
    setResumePdfBase64(btoa(binary))
  }
}

  async function generate() {
    if (!jd.trim()) { setError("Please paste a job description."); return }
    if (!resumeText.trim() && !resumePdfBase64) { setError('Please upload or paste your resume.'); return }
    setError(""); setLoading(true); setResult("")
    try {
      const data = await generateCoverLetter({ resume_text: resumeText || null, resume_pdf_base64: resumePdfBase64 || null, job_description: jd, hiring_manager: hiringManager, company, tone, length })
      setResult(data.cover_letter)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  function downloadPdf() {
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><title>Cover Letter</title><style>@page{size:A4 portrait;margin:20mm 16mm;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;font-size:12px;line-height:1.8;color:#111;}pre{white-space:pre-wrap;font-family:inherit;}</style></head><body><pre>${result}</pre></body></html>`)
  w.document.close()
  setTimeout(() => { w.focus(); w.print() }, 500)
}
  function copy() {
    navigator.clipboard.writeText(result)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([result], { type: "text/plain" }))
    a.download = "carvia_cover_letter.txt"; a.click()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Write a cover letter</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-2xl p-5 bg-white">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Your Resume</p>
          <div className="flex gap-2 mb-3">
            {["upload","paste"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={"text-xs px-4 py-1.5 rounded-full border " + (tab === t ? "bg-blue-600 text-white border-transparent" : "border-gray-200 text-gray-500")}>
                {t === "upload" ? "Upload file" : "Paste text"}
              </button>
            ))}
          </div>
          {tab === "upload" ? (
            <div onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-gray-400">Drop your resume here</p>
              <p className="text-xs text-blue-600 font-medium mt-1">Browse file</p>
              <p className="text-xs text-gray-300 mt-1">PDF · DOCX · TXT</p>
              {fileName && <p className="text-xs text-green-600 mt-2">✓ {fileName}</p>}
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
              className="w-full h-48 text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-blue-500"
              placeholder="Paste your resume here..." />
          )}
        </div>
        <div className="border border-gray-200 rounded-2xl p-5 bg-white">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Job Description</p>
          <textarea value={jd} onChange={e => setJd(e.target.value)}
            className="w-full h-64 text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-blue-500"
            placeholder="Paste the full job description here..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[["Hiring Manager (optional)", hiringManager, setHiringManager, "e.g. Sarah Johnson"],
          ["Company name", company, setCompany, "e.g. Acme Corp"]].map(([label, val, setter, ph]) => (
          <div key={label}>
            <label className="text-xs font-medium uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
            <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-gray-400 block mb-1">Tone</label>
          <select value={tone} onChange={e => setTone(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
            {["professional","enthusiastic","confident","conversational"].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-gray-400 block mb-1">Length</label>
          <select value={length} onChange={e => setLength(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
            <option value="concise">Concise (3 paragraphs)</option>
            <option value="standard">Standard (4 paragraphs)</option>
            <option value="detailed">Detailed (5 paragraphs)</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <button onClick={generate} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-6">
        {loading ? "Writing your cover letter..." : "Write my cover letter with Carvia"}
      </button>
      <button onClick={downloadPdf} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">Save as PDF</button>
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-medium text-gray-900">Your cover letter</h2>
            <div className="flex gap-2">
              <button onClick={copy} className={"text-xs border rounded-lg px-3 py-1.5 " + (copied ? "border-green-300 text-green-600" : "border-gray-200 hover:bg-gray-50")}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={downloadTxt} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">Download TXT</button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-2xl p-8 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}