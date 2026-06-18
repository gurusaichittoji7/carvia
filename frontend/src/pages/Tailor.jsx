import { useState, useRef } from 'react'
import { tailorResume } from '../lib/api'
import mammoth from 'mammoth'
export default function Tailor() {
  const [tab, setTab] = useState('upload')
  const [resumeText, setResumeText] = useState('')
  const [resumePdfBase64, setResumePdfBase64] = useState(null)
  const [jd, setJd] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [template, setTemplate] = useState('classic')
  const [copied, setCopied] = useState(false)
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
    setError(''); setLoading(true); setResult('')
    try {
      const data = await tailorResume({
        resume_text: resumeText || null,
        resume_pdf_base64: resumePdfBase64 || null,
        job_description: jd, linkedin, github, portfolio
      })
      setResult(data.tailored_resume)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  function copy() { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  function downloadTxt() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([result], { type: 'text/plain' }))
    a.download = 'carvia_resume.txt'; a.click()
  }
  function downloadPdf() {
    const w = window.open('', '_blank')
    w.document.write('<html><head><title>Carvia Resume</title><style>body{font-family:Georgia,serif;font-size:13px;line-height:1.8;padding:48px 60px;max-width:820px;margin:0 auto;}pre{white-space:pre-wrap;font-family:inherit;}</style></head><body><pre>' + result + '</pre></body></html>')
    w.document.close(); w.print()
  }
  const templates = ['classic','modern','professional','executive','creative']
  const boxClass = { classic:'font-serif', modern:'font-sans text-base', professional:'font-sans border-l-4 border-blue-600 pl-6', executive:'font-serif text-base leading-loose', creative:'font-sans bg-gray-50 rounded-xl' }
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Tailor your resume</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-2xl p-5 bg-white">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Your Resume</p>
          <div className="flex gap-2 mb-3">
            {['upload','paste'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={'text-xs px-4 py-1.5 rounded-full border ' + (tab===t ? 'bg-blue-600 text-white border-transparent' : 'border-gray-200 text-gray-500')}>
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
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['LinkedIn',linkedin,setLinkedin,'linkedin.com/in/yourname'],['GitHub',github,setGithub,'github.com/yourusername'],['Portfolio',portfolio,setPortfolio,'yourportfolio.com']].map(([label,val,setter,ph]) => (
          <div key={label}>
            <label className="text-xs font-medium uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
            <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <button onClick={generate} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-6">
        {loading ? 'Tailoring your resume...' : 'Tailor my resume with Carvia'}
      </button>
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-medium text-gray-900">Your tailored resume</h2>
            <div className="flex gap-2">
              <button onClick={copy} className={'text-xs border rounded-lg px-3 py-1.5 ' + (copied ? 'border-green-300 text-green-600' : 'border-gray-200')}>{copied ? 'Copied' : 'Copy'}</button>
              <button onClick={downloadTxt} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5">Download TXT</button>
              <button onClick={downloadPdf} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5">Save as PDF</button>
            </div>
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-widest text-gray-400 mr-1 self-center">Template</span>
            {templates.map(t => (
              <button key={t} onClick={() => setTemplate(t)}
                className={'text-xs px-3 py-1.5 rounded-full border capitalize ' + (template===t ? 'bg-gray-900 text-white border-transparent' : 'border-gray-200 text-gray-500')}>
                {t}
              </button>
            ))}
          </div>
          <div className={'border border-gray-200 rounded-2xl p-8 text-sm leading-relaxed whitespace-pre-wrap text-gray-800 ' + boxClass[template]}>
            {result}
          </div>
        </div>
      )}
    </div>
  )
}