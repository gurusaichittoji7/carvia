import { useState, useRef } from 'react'
import mammoth from 'mammoth'
import { analyzeMatch } from '../lib/api'

export default function Analyze() {
  const [tab, setTab] = useState('upload')
  const [resumeText, setResumeText] = useState('')
  const [resumePdfBase64, setResumePdfBase64] = useState(null)
  const [fileName, setFileName] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    setFileName(file.name)
    setResumeText('')
    setResumePdfBase64(null)
    if (ext === 'txt') {
      setResumeText(await file.text())
    } else if (ext === 'docx') {
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

  async function analyze() {
    if (!jd.trim()) { setError('Please paste a job description.'); return }
    if (!resumeText.trim() && !resumePdfBase64) { setError('Please upload or paste your resume.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const data = await analyzeMatch({
        resume_text: resumeText || null,
        resume_pdf_base64: resumePdfBase64 || null,
        job_description: jd,
      })
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const scoreColor = (score) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const scoreBg = (score) => {
    if (score >= 75) return 'bg-green-50 border-green-200'
    if (score >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const verdictColor = (v) => v === 'APPLY' ? 'bg-green-600' : 'bg-red-500'

  const h1bColor = (h) => {
    if (h === 'Likely') return 'text-green-600'
    if (h === 'Unlikely') return 'text-red-500'
    return 'text-yellow-500'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-gray-900 mb-1">JD Match Analyzer</h1>
      <p className="text-sm text-gray-400 mb-6">See how well your resume matches a job description before you apply.</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-2xl p-5 bg-white">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Your Resume</p>
          <div className="flex gap-2 mb-3">
            {['upload', 'paste'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={'text-xs px-4 py-1.5 rounded-full border ' + (tab === t ? 'bg-blue-600 text-white border-transparent' : 'border-gray-200 text-gray-500')}>
                {t === 'upload' ? 'Upload file' : 'Paste text'}
              </button>
            ))}
          </div>
          {tab === 'upload' ? (
            <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50">
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
              placeholder="Paste your full resume text here..." />
          )}
        </div>

        <div className="border border-gray-200 rounded-2xl p-5 bg-white">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Job Description</p>
          <textarea value={jd} onChange={e => setJd(e.target.value)}
            className="w-full h-64 text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-blue-500"
            placeholder="Paste the full job description here..." />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <button onClick={analyze} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-6">
        {loading ? 'Analyzing match...' : 'Analyze with Carvia'}
      </button>

      {result && (
        <div className="space-y-4">
          <div className={'border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 ' + scoreBg(result.match_score)}>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">Match Score</p>
              <p className={'text-5xl font-bold ' + scoreColor(result.match_score)}>{result.match_score}<span className="text-2xl">%</span></p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Verdict</p>
              <span className={'text-white text-sm font-semibold px-5 py-2 rounded-full ' + verdictColor(result.verdict)}>
                {result.verdict}
              </span>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">H1B Signal</p>
              <p className={'text-lg font-semibold ' + h1bColor(result.h1b_signal)}>{result.h1b_signal}</p>
            </div>
            <div className="max-w-xs">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">Recommendation</p>
              <p className="text-sm text-gray-700">{result.recommendation}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-2xl p-5 bg-white">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">✅ Matched Keywords</p>
              <div className="flex flex-wrap gap-2">
                {result.matched_keywords.map(k => (
                  <span key={k} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">{k}</span>
                ))}
              </div>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5 bg-white">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">❌ Missing Keywords</p>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map(k => (
                  <span key={k} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-2xl p-5 bg-white">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">💪 Strengths</p>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-green-500 mt-0.5">•</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5 bg-white">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">⚠️ Gaps</p>
              <ul className="space-y-2">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-red-400 mt-0.5">•</span>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}