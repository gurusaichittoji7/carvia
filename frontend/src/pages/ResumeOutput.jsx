import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function cleanResume(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\|\s*(SUMMARY|SKILLS|EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|TECHNICAL SKILLS)\s*\|/gi, '\n\n$1\n')
    .replace(/\|\s*•/g, '\n•')
    .replace(/\|\s*([A-Z][^|]{2,60})\s*\|/g, '\n$1\n')
    .replace(/\|\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const STYLES = {
  classic: {
    fontFamily: 'Georgia, serif',
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#111',
    padding: '48px 60px',
    background: '#fff',
  },
  modern: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#1e293b',
    padding: '48px 60px',
    background: '#fff',
  },
  minimal: {
    fontFamily: 'Helvetica, sans-serif',
    fontSize: '12.5px',
    lineHeight: '1.9',
    color: '#333',
    padding: '48px 60px',
    background: '#fff',
    letterSpacing: '0.01em',
  },
  professional: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#111',
    padding: '48px 60px',
    background: '#fff',
    borderLeft: '4px solid #2563eb',
    paddingLeft: '56px',
  },
  executive: {
    fontFamily: 'Georgia, serif',
    fontSize: '13.5px',
    lineHeight: '1.85',
    color: '#111',
    padding: '48px 60px',
    background: '#fff',
    letterSpacing: '0.01em',
  },
}

const TEMPLATES = ['classic', 'modern', 'minimal', 'professional', 'executive']

export default function ResumeOutput() {
  const { state } = useLocation()
  const nav = useNavigate()
  const [template, setTemplate] = useState('classic')
  const [copied, setCopied] = useState(false)

  if (!state?.resume) { nav('/tailor'); return null }

  const clean = cleanResume(state.resume)

  function copy() {
    navigator.clipboard.writeText(clean)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([clean], { type: 'text/plain' }))
    a.download = 'carvia_resume.txt'; a.click()
  }

  function downloadPdf() {
    const s = STYLES[template]
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Resume</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: ${s.fontFamily};
        font-size: ${s.fontSize};
        line-height: ${s.lineHeight};
        color: ${s.color};
        padding: ${s.padding};
        max-width: 820px;
        margin: 0 auto;
        ${s.borderLeft ? `border-left: ${s.borderLeft};` : ''}
        ${s.letterSpacing ? `letter-spacing: ${s.letterSpacing};` : ''}
      }
      pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
    </style></head><body><pre>${clean}</pre></body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/tailor')} className="text-sm text-gray-500 hover:text-gray-900">← Back</button>
          <h1 className="text-sm font-medium text-gray-900">Your tailored resume</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={copy}
            className={'text-sm border rounded-lg px-4 py-1.5 ' + (copied ? 'border-green-400 text-green-600' : 'border-gray-200 hover:bg-gray-50')}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={downloadTxt} className="text-sm border border-gray-200 rounded-lg px-4 py-1.5 hover:bg-gray-50">
            Download TXT
          </button>
          <button onClick={downloadPdf} className="text-sm bg-blue-600 text-white rounded-lg px-4 py-1.5 hover:bg-blue-700 font-medium">
            Save as PDF
          </button>
        </div>
      </div>

      {/* Template selector */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400 mr-2">Template</span>
        {TEMPLATES.map(t => (
          <button key={t} onClick={() => setTemplate(t)}
            className={'text-xs px-4 py-1.5 rounded-full border capitalize transition-colors ' + (template === t ? 'bg-gray-900 text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
            {t}
          </button>
        ))}
      </div>

      {/* Resume preview */}
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <pre style={{
            ...STYLES[template],
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: STYLES[template].fontFamily,
            fontSize: STYLES[template].fontSize,
            lineHeight: STYLES[template].lineHeight,
            color: STYLES[template].color,
            display: 'block',
          }}>
            {clean}
          </pre>
        </div>
      </div>
    </div>
  )
}
