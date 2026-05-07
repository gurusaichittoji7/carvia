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
  const lines = text.split('\n').map(l => l.trim())
  const sectionKeywords = ['experience','education','skills','summary','objective','projects','certifications','awards','languages','interests','profile','work history','technical skills','professional summary']
  const sections = []
  let current = null
  let headerDone = false
  let headerLines = []

  for (const line of lines) {
    if (!line) continue
    const lower = line.toLowerCase()
    const isSection = sectionKeywords.some(k => lower === k || lower.startsWith(k + ' ') || lower.startsWith(k + ':'))
    if (isSection && line.length < 60) {
      if (!headerDone) { headerDone = true; sections.push({ type: 'header', lines: headerLines }) }
      if (current) sections.push(current)
      current = { type: 'section', title: line, items: [] }
    } else if (!headerDone) {
      headerLines.push(line)
    } else if (current) {
      current.items.push(line)
    }
  }
  if (current) sections.push(current)
  if (!headerDone && headerLines.length) sections.unshift({ type: 'header', lines: headerLines })
  return sections
}

function Header({ lines, style }) {
  const name = lines[0] || ''
  const rest = lines.slice(1)
  const styles = {
    classic: { wrap: 'text-center mb-6', name: 'text-2xl font-bold text-gray-900 tracking-wide', sub: 'text-sm text-gray-600 mt-1' },
    modern: { wrap: 'bg-blue-600 text-white p-6 -mx-12 -mt-12 mb-8 text-center', name: 'text-3xl font-bold', sub: 'text-sm opacity-90 mt-1' },
    professional: { wrap: 'mb-6 pb-4 border-b-2 border-gray-900', name: 'text-3xl font-light text-gray-900 tracking-widest uppercase', sub: 'text-sm text-gray-500 mt-1' },
    minimal: { wrap: 'mb-10', name: 'text-4xl font-thin text-gray-900 tracking-widest uppercase', sub: 'text-xs text-gray-400 tracking-widest uppercase mt-2' },
    executive: { wrap: 'text-center border-t-2 border-b-2 border-gray-900 py-6 mb-8', name: 'text-3xl font-bold text-gray-900 tracking-widest uppercase', sub: 'text-sm text-gray-600 mt-2' },
  }
  const s = styles[style] || styles.classic
  return (
    <div className={s.wrap}>
      <div className={s.name}>{name}</div>
      {rest.map((l, i) => <div key={i} className={s.sub}>{l}</div>)}
    </div>
  )
}

function SectionTitle({ title, style }) {
  const styles = {
    classic: <><h2 className="text-sm font-bold uppercase text-gray-900 tracking-widest mt-6 mb-1">{title}</h2><hr className="border-gray-900 mb-3" /></>,
    modern: <h2 className="text-sm font-bold uppercase text-blue-600 tracking-widest mt-6 mb-2 flex items-center gap-2"><span className="w-6 h-0.5 bg-blue-600 inline-block"></span>{title}</h2>,
    professional: <><h2 className="text-xs font-bold uppercase text-gray-400 tracking-widest mt-6 mb-2">{title}</h2></>,
    minimal: <h2 className="text-xs text-gray-300 uppercase tracking-widest mt-8 mb-3">{title}</h2>,
    executive: <><h2 className="text-sm font-bold uppercase text-gray-900 tracking-widest text-center mt-6 mb-2">{title}</h2><hr className="border-gray-400 mb-3" /></>,
  }
  return styles[style] || styles.classic
}

function SectionItems({ items, style }) {
  const textClass = {
    classic: 'text-sm text-gray-700 leading-relaxed',
    modern: 'text-sm text-gray-700 leading-relaxed',
    professional: 'text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-gray-200',
    minimal: 'text-sm text-gray-500 leading-loose',
    executive: 'text-sm text-gray-700 leading-relaxed',
  }[style] || 'text-sm text-gray-700 leading-relaxed'

  return (
    <div>
      {items.map((line, i) => {
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*')
        const isDateLine = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i.test(line) && line.length < 80 && !isBullet
        const isBold = line.endsWith(':') || (line.includes('|') && line.length < 80 && !isBullet)

        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 mb-1">
              <span className={textClass}>•</span>
              <span className={textClass}>{line.replace(/^[•\-\*]\s*/, '')}</span>
            </div>
          )
        }
        if (isDateLine && line.includes('|')) {
          const parts = line.split('|')
          const last = parts[parts.length - 1].trim()
          const first = parts.slice(0, -1).join('|').trim()
          return (
            <div key={i} className="flex justify-between items-start mt-2 mb-0.5">
              <span className={textClass + ' font-semibold'}>{first}</span>
              <span className={textClass + ' italic text-gray-500 text-xs whitespace-nowrap ml-4'}>{last}</span>
            </div>
          )
        }
        return <p key={i} className={textClass + (isBold ? ' font-semibold mt-2' : ' mb-0.5')}>{line}</p>
      })}
    </div>
  )
}

function ResumeTemplate({ text, style }) {
  const sections = parseResume(text)
  return (
    <div className="font-serif">
      {sections.map((s, i) => (
        <div key={i}>
          {s.type === 'header'
            ? <Header lines={s.lines} style={style} />
            : <>
                <SectionTitle title={s.title} style={style} />
                <SectionItems items={s.items} style={style} />
              </>
          }
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

  if (!state?.resume) { nav('/tailor'); return null }
  const { resume } = state

  function copy() { navigator.clipboard.writeText(resume); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  function downloadTxt() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([resume], { type: 'text/plain' }))
    a.download = 'carvia_resume.txt'; a.click()
  }
  function downloadPdf() {
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Carvia Resume</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Georgia,serif;font-size:12px;line-height:1.7;padding:40px 50px;max-width:800px;margin:0 auto;color:#111;}
      .name{font-size:22px;font-weight:bold;text-align:center;letter-spacing:1px;}
      .contact{font-size:11px;text-align:center;color:#555;margin-top:4px;}
      .section-title{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:2px;}
      hr{border:none;border-top:1px solid #111;margin-bottom:8px;}
      .job-header{display:flex;justify-content:space-between;font-weight:bold;margin-top:6px;}
      .date{font-style:italic;font-weight:normal;color:#555;font-size:11px;}
      li{margin-left:16px;margin-bottom:2px;}
      p{margin-bottom:2px;}
    </style></head><body><pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;">${resume}</pre></body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/tailor')} className="text-sm text-gray-500 hover:text-gray-900">← Back</button>
          <h1 className="text-sm font-medium text-gray-900">Your tailored resume</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={copy} className={'text-sm border rounded-lg px-4 py-1.5 ' + (copied ? 'border-green-400 text-green-600' : 'border-gray-200 hover:bg-gray-50')}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={downloadTxt} className="text-sm border border-gray-200 rounded-lg px-4 py-1.5 hover:bg-gray-50">Download TXT</button>
          <button onClick={downloadPdf} className="text-sm bg-blue-600 text-white rounded-lg px-4 py-1.5 hover:bg-blue-700 font-medium">Save as PDF</button>
        </div>
      </div>
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-3 shadow-sm">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400 mr-2">Template</span>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setTemplate(t.id)}
            className={'text-xs px-4 py-1.5 rounded-full border transition-colors ' + (template === t.id ? 'bg-gray-900 text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white shadow-sm rounded-2xl px-12 py-10">
          <ResumeTemplate text={resume} style={template} />
        </div>
      </div>
    </div>
  )
}
