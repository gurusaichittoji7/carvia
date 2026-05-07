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
  const sectionKeywords = ['experience','education','skills','summary','objective','projects','certifications','awards','languages','technical skills','professional summary','work history']
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

function getTemplateCSS(style) {
  const base = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-size: 11px; line-height: 1.5; padding: 32px 44px; max-width: 780px; margin: 0 auto; color: #111; }
    .header { margin-bottom: 14px; }
    .name { font-size: 20px; font-weight: bold; }
    .contact { font-size: 10px; color: #444; margin-top: 3px; }
    .contact a { color: #444; text-decoration: none; }
    .section { margin-bottom: 10px; }
    .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; margin-top: 10px; }
    .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-top: 5px; margin-bottom: 1px; }
    .job-title { font-weight: bold; font-size: 11px; }
    .job-date { font-style: italic; font-size: 10px; color: #666; }
    ul { padding-left: 14px; margin-top: 2px; }
    li { margin-bottom: 1px; }
    p { margin-bottom: 2px; }
  `
  const variants = {
    classic: `body { font-family: Georgia, serif; } .name { text-align: center; letter-spacing: 1px; } .contact { text-align: center; } .section-title { border-bottom: 1px solid #111; padding-bottom: 2px; }`,
    modern: `body { font-family: Arial, sans-serif; } .name { color: #2563eb; } .section-title { color: #2563eb; border-left: 3px solid #2563eb; padding-left: 6px; }`,
    professional: `body { font-family: Arial, sans-serif; } .name { font-weight: 300; letter-spacing: 3px; text-transform: uppercase; font-size: 22px; } .section-title { color: #888; } ul { border-left: 2px solid #ddd; padding-left: 12px; list-style: none; }`,
    minimal: `body { font-family: Helvetica, sans-serif; color: #333; } .name { font-weight: 200; letter-spacing: 6px; text-transform: uppercase; font-size: 22px; } .contact { color: #aaa; letter-spacing: 2px; } .section-title { color: #bbb; letter-spacing: 3px; }`,
    executive: `body { font-family: Georgia, serif; } .name { text-align: center; letter-spacing: 3px; text-transform: uppercase; border-top: 2px solid #111; border-bottom: 2px solid #111; padding: 8px 0; } .contact { text-align: center; } .section-title { text-align: center; border-bottom: 1px solid #999; padding-bottom: 2px; }`,
  }
  return base + (variants[style] || variants.classic)
}

function buildPdfHtml(text, style) {
  const sections = parseResume(text)
  let body = ''
  for (const s of sections) {
    if (s.type === 'header') {
      const name = s.lines[0] || ''
      const contactParts = s.lines.slice(1).join(' | ')
      body += `<div class="header"><div class="name">${name}</div><div class="contact">${contactParts}</div></div>`
    } else {
      let inner = ''
      let inList = false
      for (const line of s.items) {
        const isBullet = /^[•\-\*]/.test(line)
        if (isBullet) {
          if (!inList) { inner += '<ul>'; inList = true }
          inner += `<li>${line.replace(/^[•\-\*]\s*/, '')}</li>`
        } else {
          if (inList) { inner += '</ul>'; inList = false }
          if (line.includes('|') && line.length < 100) {
            const parts = line.split('|')
            const last = parts[parts.length - 1].trim()
            const first = parts.slice(0, -1).join('|').trim()
            inner += `<div class="job-header"><span class="job-title">${first}</span><span class="job-date">${last}</span></div>`
          } else {
            inner += `<p>${line}</p>`
          }
        }
      }
      if (inList) inner += '</ul>'
      body += `<div class="section"><div class="section-title">${s.title}</div>${inner}</div>`
    }
  }
  return `<!DOCTYPE html><html><head><title>Resume</title><style>${getTemplateCSS(style)}</style></head><body>${body}</body></html>`
}

function Header({ lines, style }) {
  const name = lines[0] || ''
  const contact = lines.slice(1).join(' | ')
  const styles = {
    classic: { wrap: 'text-center mb-6', name: 'text-2xl font-bold text-gray-900 tracking-wide', sub: 'text-sm text-gray-500 mt-1' },
    modern: { wrap: 'mb-6', name: 'text-3xl font-bold text-blue-600', sub: 'text-sm text-gray-500 mt-1' },
    professional: { wrap: 'mb-6 pb-4 border-b-2 border-gray-900', name: 'text-3xl font-light text-gray-900 tracking-widest uppercase', sub: 'text-sm text-gray-500 mt-1' },
    minimal: { wrap: 'mb-10', name: 'text-4xl font-thin text-gray-900 tracking-widest uppercase', sub: 'text-xs text-gray-400 tracking-widest uppercase mt-2' },
    executive: { wrap: 'text-center border-t-2 border-b-2 border-gray-900 py-6 mb-8', name: 'text-3xl font-bold text-gray-900 tracking-widest uppercase', sub: 'text-sm text-gray-600 mt-2' },
  }
  const s = styles[style] || styles.classic
  return (
    <div className={s.wrap}>
      <div className={s.name}>{name}</div>
      {contact && <div className={s.sub}>{contact}</div>}
    </div>
  )
}

function SectionTitle({ title, style }) {
  const map = {
    classic: <><h2 className="text-xs font-bold uppercase text-gray-900 tracking-widest mt-6 mb-1">{title}</h2><hr className="border-gray-900 mb-3" /></>,
    modern: <h2 className="text-xs font-bold uppercase text-blue-600 tracking-widest mt-6 mb-2 border-l-4 border-blue-600 pl-2">{title}</h2>,
    professional: <h2 className="text-xs font-bold uppercase text-gray-400 tracking-widest mt-6 mb-2">{title}</h2>,
    minimal: <h2 className="text-xs text-gray-300 uppercase tracking-widest mt-8 mb-3">{title}</h2>,
    executive: <><h2 className="text-xs font-bold uppercase text-gray-900 tracking-widest text-center mt-6 mb-2">{title}</h2><hr className="border-gray-400 mb-3" /></>,
  }
  return map[style] || map.classic
}

function SectionItems({ items, style }) {
  const tc = {
    classic: 'text-sm text-gray-700 leading-relaxed',
    modern: 'text-sm text-gray-700 leading-relaxed',
    professional: 'text-sm text-gray-600 leading-relaxed',
    minimal: 'text-sm text-gray-500 leading-loose',
    executive: 'text-sm text-gray-700 leading-relaxed',
  }[style] || 'text-sm text-gray-700 leading-relaxed'
  const wrap = style === 'professional' ? 'border-l-2 border-gray-200 pl-4' : ''
  return (
    <div className={wrap}>
      {items.map((line, i) => {
        const isBullet = /^[•\-\*]/.test(line)
        if (isBullet) return (
          <div key={i} className="flex gap-2 mb-0.5">
            <span className={tc}>•</span>
            <span className={tc}>{line.replace(/^[•\-\*]\s*/, '')}</span>
          </div>
        )
        if (line.includes('|') && line.length < 100) {
          const parts = line.split('|')
          const last = parts[parts.length - 1].trim()
          const first = parts.slice(0, -1).join('|').trim()
          return (
            <div key={i} className="flex justify-between items-baseline mt-2 mb-0.5">
              <span className={tc + ' font-semibold'}>{first}</span>
              <span className="text-xs text-gray-500 italic ml-4 whitespace-nowrap">{last}</span>
            </div>
          )
        }
        return <p key={i} className={tc + ' mb-0.5'}>{line}</p>
      })}
    </div>
  )
}

function ResumeTemplate({ text, style }) {
  const sections = parseResume(text)
  return (
    <div>
      {sections.map((s, i) => (
        <div key={i}>
          {s.type === 'header'
            ? <Header lines={s.lines} style={style} />
            : <><SectionTitle title={s.title} style={style} /><SectionItems items={s.items} style={style} /></>
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
    w.document.write(buildPdfHtml(resume, template))
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 600)
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
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-3">
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
