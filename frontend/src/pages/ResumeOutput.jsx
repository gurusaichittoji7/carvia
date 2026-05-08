import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const TEMPLATES = [
  { id:'classic', label:'Classic' },
  { id:'modern', label:'Modern' },
  { id:'minimal', label:'Minimal' },
  { id:'professional', label:'Professional' },
  { id:'executive', label:'Executive' },
]

export default function ResumeOutput() {
  const { state } = useLocation()
  const nav = useNavigate()
  const [tmpl, setTmpl] = useState('classic')
  const [copied, setCopied] = useState(false)

  if (!state?.resume) { nav('/tailor'); return null }

  const { resume: raw, linkedin, github, portfolio } = state
  const resume = raw.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\n{3,}/g, '\n\n').trim()

  const font = { classic:'Georgia,serif', modern:'Arial,sans-serif', minimal:'Helvetica,sans-serif', professional:'Arial,sans-serif', executive:'Georgia,serif' }

  function makeHtml(text) {
    const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    return esc
      .replace(/LinkedIn/g, linkedin ? '<a href="'+linkedin+'" target="_blank" style="color:#2563eb;text-decoration:none;">LinkedIn</a>' : 'LinkedIn')
      .replace(/GitHub/g, github ? '<a href="'+github+'" target="_blank" style="color:#2563eb;text-decoration:none;">GitHub</a>' : 'GitHub')
      .replace(/Portfolio/g, portfolio ? '<a href="'+portfolio+'" target="_blank" style="color:#2563eb;text-decoration:none;">Portfolio</a>' : 'Portfolio')
  }

  function copy() { navigator.clipboard.writeText(resume); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  function downloadTxt() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([resume],{type:'text/plain'}))
    a.download = 'carvia_resume.txt'; a.click()
  }

  function downloadPdf() {
    const w = window.open('','_blank')
    w.document.write('<!DOCTYPE html><html><head><title>Resume</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'+font[tmpl]+';font-size:13px;line-height:1.75;color:#111;padding:40px 52px;max-width:800px;margin:0 auto;}a{color:#2563eb;text-decoration:none;}pre{white-space:pre-wrap;font-family:inherit;}</style></head><body><pre>'+makeHtml(resume)+'</pre></body></html>')
    w.document.close()
    setTimeout(()=>{w.focus();w.print()},500)
  }

  const borderStyle = {
    classic: 'none',
    modern: 'none',
    minimal: 'none',
    professional: '4px solid #2563eb',
    executive: 'none',
  }

  return (
    <div style={{minHeight:'100vh',background:'#f1f5f9'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={()=>nav('/tailor')} style={{fontSize:13,color:'#64748b',background:'none',border:'none',cursor:'pointer'}}>← Back</button>
          <span style={{fontSize:13,fontWeight:500,color:'#111'}}>Your tailored resume</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={copy} style={{fontSize:13,padding:'6px 16px',border:'1px solid',borderColor:copied?'#4ade80':'#e2e8f0',borderRadius:8,background:'#fff',color:copied?'#16a34a':'#374151',cursor:'pointer'}}>{copied?'✓ Copied':'Copy'}</button>
          <button onClick={downloadTxt} style={{fontSize:13,padding:'6px 16px',border:'1px solid #e2e8f0',borderRadius:8,background:'#fff',color:'#374151',cursor:'pointer'}}>Download TXT</button>
          <button onClick={downloadPdf} style={{fontSize:13,padding:'6px 16px',border:'none',borderRadius:8,background:'#2563eb',color:'#fff',fontWeight:500,cursor:'pointer'}}>Save as PDF</button>
        </div>
      </div>

      <div style={{background:'#fff',borderBottom:'1px solid #f1f5f9',padding:'8px 24px',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'.07em',color:'#94a3b8',marginRight:8}}>Template</span>
        {TEMPLATES.map(t=>(
          <button key={t.id} onClick={()=>setTmpl(t.id)} style={{fontSize:12,padding:'4px 14px',borderRadius:20,border:'1px solid',borderColor:tmpl===t.id?'transparent':'#e2e8f0',background:tmpl===t.id?'#111':'transparent',color:tmpl===t.id?'#fff':'#64748b',cursor:'pointer'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:860,margin:'32px auto',padding:'0 16px'}}>
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.08)',padding:'48px 60px',borderLeft:borderStyle[tmpl]}}>
          <pre style={{whiteSpace:'pre-wrap',wordWrap:'break-word',fontFamily:font[tmpl],fontSize:13,lineHeight:1.75,color:'#111',margin:0}}
            dangerouslySetInnerHTML={{__html:makeHtml(resume)}}
          />
        </div>
      </div>
    </div>
  )
}
