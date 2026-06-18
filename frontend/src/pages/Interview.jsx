import { useState, useRef } from 'react'
import mammoth from 'mammoth'
import { generateInterviewPrep } from '../lib/api'

export default function Interview() {
  const [tab, setTab] = useState('upload')
  const [resumeText, setResumeText] = useState('')
  const [resumePdfBase64, setResumePdfBase64] = useState(null)
  const [fileName, setFileName] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [openIndex, setOpenIndex] = useState(null)
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

  async function generate() {
    if (!jd.trim()) { setError('Please paste a job description.'); return }
    if (!resumeText.trim() && !resumePdfBase64) { setError('Please upload or paste your resume.'); return }
    setError(''); setLoading(true); setResult(null); setOpenIndex(null)
    try {
      const data = await generateInterviewPrep({
        resume_text: resumeText || null,
        resume_pdf_base64: resumePdfBase64 || null,
        job_description: jd,
      })
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const categoryColor = (cat) => {
    const map = {
      'Technical': 'bg-blue-50 text-blue-700 border-blue-200',
      'Behavioral': 'bg-purple-50 text-purple-700 border-purple-200',
      'Situational': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Role-Specific': 'bg-green-50 text-green-700 border-green-200',
    }
    return map[cat] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-gray-900 mb-1">Interview Prep</h1>
      <p className="text-sm text-gray-400 mb-6">Upload your resume and the job description to get targeted interview questions with model answers.</p>

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

      <button onClick={generate} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-6">
        {loading ? 'Generating questions...' : 'Generate Interview Questions'}
      </button>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium text-gray-900">{result.questions.length} Questions for {result.role}</h2>
            <span className="text-xs text-gray-400">Click any question to reveal the model answer</span>
          </div>
          {result.questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{i + 1}</span>
                  <div>
                    <span className={'text-xs border px-2 py-0.5 rounded-full mr-2 ' + categoryColor(q.category)}>{q.category}</span>
                    <span className="text-sm text-gray-800 font-medium">{q.question}</span>
                  </div>
                </div>
                <span className="text-gray-400 text-lg shrink-0">{openIndex === i ? '−' : '+'}</span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Model Answer</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{q.answer}</p>
                  {q.tip && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-blue-600 mb-1">💡 Tip</p>
                      <p className="text-xs text-blue-700">{q.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}