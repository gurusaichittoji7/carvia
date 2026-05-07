import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const TEMPLATES = [
  { id: 'classic', label: 'Classic' },
  { id: 'modern', label: 'Modern' },
  { id: 'professional', label: 'Professional' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'executive', label: 'Executive' },
]

function parseResume(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const sections = []
  let current = null
  const sectionKeywords = ['experience','education','skills','summary','objective','projects','certifications','awards','languages','interests','profile','work']
  for (const line of lines) {
    const isHeader = sectionKeywords.some(k => line.toLowerCase().startsWith(k)) && line.length < 60
    if (isHeader) {
      if (current) sections.push(current)
      current = { title: line, lines: [] }
    } else if (!current && sections.length === 0) {
      if (!sections[0]) sections.push({ title: '__HEADER__', lines: [] })
      sections[0].lines.push(line)
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) sections.push(current)
  return sections
}

function ClassicTemplate({ text }) {
  const sections = parseResume(text)
  return (
    <div className="font-serif max-w-3xl mx-auto">
      {sections.map((s, i) => (
        <div key={i} className="mb-6">
          {s.title === '__HEADER__' ? (
            <div className="text-center mb-6">
              {s.lines.map((l, j) => (
                <p key={j} className={j === 0 ? 'text-2xl font-bold text-gray-900' : 'text-sm text-gray-600'}>{l}</p>
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-1">{s.title}</h2>
              <hr className="border-gray-900 mb-3" />
              {s.lines.map((l, j) => <p key={j} className="text-sm text-gray-700 leading-relaxed mb-1">{l}</p>)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function ModernTemplate({ text }) {
  const sections = parseResume(text)
  return (
    <div className="font-sans max-w-3xl mx-auto">
      {sections.map((s, i) => (
        <div key={i} className="mb-6">
          {s.title === '__HEADER__' ? (
            <div className="bg-blue-600 text-white p-6 rounded-xl mb-6 -mx-8">
              {s.lines.map((l, j) => (
                <p key={j} className={j === 0 ? 'text-2xl font-bold' : 'text-sm opacity-80'}>{l}</p>
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-blue-600 inline-block"></span>{s.title}
              </h2>
              {s.lines.map((l, j) => <p key={j} className="text-sm text-gray-700 leading-relaxed mb-1">{l}</p>)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function ProfessionalTemplate({ text }) {
  const sections = parseResume(text)
  return (
    <div className="font-sans max-w-3xl mx-auto">
      {sections.map((s, i) => (
        <div key={i} className="mb-6">
          {s.title === '__HEADER__' ? (
            <div className="border-b-2 border-gray-900 pb-4 mb-6">
              {s.lines.map((l, j) => (
                <p key={j} className={j === 0 ? 'text-3xl font-light text-gray-900 tracking-wide' : 'text-sm text-gray-500'}>{l}</p>
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{s.title}</h2>
              <div className="border-l-2 border-gray-200 pl-4">
                {s.lines.map((l, j) => <p key={j} className="text-sm text-gray-700 leading-relaxed mb-1">{l}</p>)}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function MinimalTemplate({ text }) {
  const sections = parseResume(text)
  return (
    <div className="font-sans max-w-3xl mx-auto">
      {sections.map((s, i) => (
        <div key={i} className="mb-8">
          {s.title === '__HEADER__' ? (
            <div className="mb-8">
              {s.lines.map((l, j) => (
                <p key={j} className={j === 0 ? 'text-3xl font-thin text-gray-900 tracking-widest uppercase' : 'text-xs text-gray-400 tracking-widest uppercase mt-1'}>{l}</p>
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-3">{s.title}</h2>
              {s.lines.map((l, j) => <p key={j} className="text-sm text-gray-600 leading-loose mb-1">{l}</p>)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function ExecutiveTemplate({ text }) {
  const sections = parseResume(text)
  return (
    <div className="font-serif max-w-3xl mx-auto">
      {sections.map((s, i) => (
        <div key={i} className="mb-6">
          {s.title === '__HEADER__' ? (
            <div className="text-center border-b border-t border-gray-900 py-6 mb-8">
              {s.lines.map((l, j) => (
                <p key={j} className={j === 0 ? 'text-3xl font-bold text-gray-900 tracking-widest uppercase' : 'text-sm text-gray-600 mt-1'}>{l}</p>
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 text-center mb-3">{s.title}</h2>
              <hr className="border-gray-400 mb-3" />
              {s.lines.map((l, j) => <p key={j} className="text-sm text-gray-700 leading-relaxed mb-1">{l}</p>)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ResumeOutput() {
  const { state } = useLocation()
  const nav = useNavigate()
  const [template, setTemplate] = useState('classic')
  const [copied, setCopied] = useState(false)

  if (!state?.resume) {
    nav('/tailor')
    return null
  }

  const { resume } = state

  function copy() {
    navigator.clipboard.writeText(resume)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([resume], { type: 'text/plain' }))
    a.download = 'carvia_resume.txt'; a.click()
  }

  function downloadPdf() {
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Carvia Resume</title><style>
      body { font-family: Georgia, serif; font-size: 13px; line-height: 1.8; padding: 48px 60px; max-width: 820px; margin: 0 auto; color: #111; }
      h2 { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
      hr { border: none; border-top: 1px solid #111; margin-bottom: 12px; }
      p { margin: 0 0 4px 0; }
    </style></head><body><pre style="white-space:pre-wrap;font-family:inherit;">${resume}</pre></body></html>`)
    w.document.close(); w.print()
  }

  const renderTemplate = () => {
    switch(template) {
      case 'modern': return <ModernTemplate text={resume} />
      case 'professional': return <ProfessionalTemplate text={resume} />
      case 'minimal': return <MinimalTemplate text={resume} />
      case 'executive': return <ExecutiveTemplate text={resume} />
      default: return <ClassicTemplate text={resume} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/tailor')} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-sm font-medium text-gray-900">Your tailored resume</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={copy} className={'text-sm border rounded-lg px-4 py-1.5 ' + (copied ? 'border-green-400 text-green-600' : 'border-gray-200 hover:bg-gray-50')}>
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
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400 mr-2">Template</span>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setTemplate(t.id)}
            className={'text-xs px-4 py-1.5 rounded-full border transition-colors ' + (template === t.id ? 'bg-gray-900 text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Resume */}
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white shadow-sm rounded-2xl p-12">
          {renderTemplate()}
        </div>
      </div>
    </div>
  )
}
