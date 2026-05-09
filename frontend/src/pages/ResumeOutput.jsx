import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"

const TEMPLATES = [
  { id:"classic", label:"Classic" },
  { id:"modern", label:"Modern" },
  { id:"minimal", label:"Minimal" },
  { id:"professional", label:"Professional" },
  { id:"executive", label:"Executive" },
]

const FONT = { classic:"Georgia,serif", modern:"Arial,sans-serif", minimal:"Helvetica,sans-serif", professional:"Arial,sans-serif", executive:"Georgia,serif" }
const SECTION_KEYS = ["SUMMARY","SKILLS","EXPERIENCE","EDUCATION","PROJECTS","CERTIFICATIONS","ACHIEVEMENTS","TECHNICAL SKILLS","PROFESSIONAL SUMMARY","PROFESSIONAL EXPERIENCE","WORK HISTORY"]

function isSection(line) {
  const u = line.toUpperCase().replace(/[^A-Z\s]/g,"").trim()
  return SECTION_KEYS.some(k => u === k) && line.length < 60
}

function processLine(line, linkedin, github, portfolio) {
  return line
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/LinkedIn/g, linkedin ? "<a href=\""+linkedin+"\" target=\"_blank\" style=\"color:#2563eb;text-decoration:none;font-weight:600;\">LinkedIn</a>" : "LinkedIn")
    .replace(/GitHub/g, github ? "<a href=\""+github+"\" target=\"_blank\" style=\"color:#2563eb;text-decoration:none;font-weight:600;\">GitHub</a>" : "GitHub")
    .replace(/Portfolio/g, portfolio ? "<a href=\""+portfolio+"\" target=\"_blank\" style=\"color:#2563eb;text-decoration:none;font-weight:600;\">Portfolio</a>" : "Portfolio")
}

function ResumeContent({ resume, tmpl, linkedin, github, portfolio }) {
  const lines = resume.split("\n")
  let headerLines = []
  let headerDone = false
  const elements = []

  const sectionStyle = {
    classic:      { borderBottom:"1.5px solid #111", color:"#111", marginTop:8, paddingBottom:2 },
    modern:       { borderLeft:"3px solid #2563eb", paddingLeft:8, color:"#2563eb", marginTop:8 },
    minimal:      { color:"#999", letterSpacing:3, marginTop:10 },
    professional: { borderBottom:"1px solid #e2e8f0", color:"#888", marginTop:8, paddingBottom:2 },
    executive:    { borderBottom:"2px solid #111", color:"#111", textAlign:"center", marginTop:8, paddingBottom:2 },
  }[tmpl]

  const nameStyle = {
    classic:      { textAlign:"center", fontSize:22, fontWeight:700, letterSpacing:1 },
    modern:       { fontSize:24, fontWeight:700, color:"#2563eb" },
    minimal:      { fontSize:26, fontWeight:200, letterSpacing:6, textTransform:"uppercase" },
    professional: { fontSize:22, fontWeight:300, letterSpacing:3, textTransform:"uppercase" },
    executive:    { textAlign:"center", fontSize:22, fontWeight:700, letterSpacing:3, textTransform:"uppercase", borderTop:"2px solid #111", borderBottom:"2px solid #111", padding:"8px 0" },
  }[tmpl]

  const contactStyle = {
    classic:      { textAlign:"center", fontSize:12, color:"#555", marginTop:3 },
    modern:       { fontSize:12, color:"#555", marginTop:3 },
    minimal:      { fontSize:11, color:"#aaa", letterSpacing:2, marginTop:4 },
    professional: { fontSize:12, color:"#777", marginTop:3 },
    executive:    { textAlign:"center", fontSize:12, color:"#555", marginTop:3 },
  }[tmpl]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (!headerDone && !isSection(line)) { headerLines.push(line); continue }

    if (!headerDone && isSection(line)) {
      headerDone = true
      const name = headerLines[0] || ""
      const contact = headerLines.slice(1).join(" | ")
      elements.push(
        <div key="hdr" style={{marginBottom:6}}>
          <div style={nameStyle}>{name}</div>
          <div style={contactStyle} dangerouslySetInnerHTML={{__html: processLine(contact, linkedin, github, portfolio)}} />
        </div>
      )
    }

    if (isSection(line)) {
      elements.push(<div key={i} style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6,...sectionStyle}}>{line}</div>)
      continue
    }

    if (/^[•\-\*]/.test(line)) {
      elements.push(
  <div
    key={i}
    style={{
      fontSize:11,
      fontWeight:700,
      textTransform:"uppercase",
      letterSpacing:1,
      marginBottom:6,
      ...sectionStyle
    }}
    dangerouslySetInnerHTML={{
      __html: processLine(line, linkedin, github, portfolio)
    }}
  />
)
      continue
    }

    if (line.includes(" | ") && line.length < 120) {
      const parts = line.split(" | ")
      const last = parts[parts.length-1].trim()
      const first = parts.slice(0,-1).join(" | ").trim()
      elements.push(
          <div
  key={i}
  style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"baseline",
    fontSize:12,
    lineHeight:1.4
  }}
>
          <span style={{fontWeight:700,fontSize:13}} dangerouslySetInnerHTML={{__html: processLine(first, linkedin, github, portfolio)}} />
          <span style={{fontSize:11,fontStyle:"italic",color:"#666",marginLeft:16,whiteSpace:"nowrap"}}>{last}</span>
        </div>
      )
      continue
    }

    elements.push(
  <div
    key={i}
    style={{
      fontSize:12,
      lineHeight:1.5,
      marginBottom:6,
      color:"#111"
    }}
    dangerouslySetInnerHTML={{
      __html: processLine(line, linkedin, github, portfolio)
    }}
  />
)
  }

  return <div id="resume-content" style={{fontFamily:FONT[tmpl]}}>{elements}</div>
}

export default function ResumeOutput() {
  const { state } = useLocation()
  const nav = useNavigate()
  const [tmpl, setTmpl] = useState("classic")
  const [copied, setCopied] = useState(false)

  if (!state?.resume) { nav("/tailor"); return null }

  const { resume: raw, linkedin, github, portfolio } = state
  const resume = raw.replace(/\n{3,}/g, "\n\n").trim()

  function copy() {
    navigator.clipboard.writeText(resume.replace(/\*\*([^*]+)\*\*/g,"$1"))
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  function downloadTxt() {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([resume.replace(/\*\*([^*]+)\*\*/g,"$1")],{type:"text/plain"}))
    a.download = "carvia_resume.txt"; a.click()
  }

  function downloadPdf() {
    const content = document.querySelector("#resume-content")
    if (!content) return
    const w = window.open("","_blank")
    w.document.write("<!DOCTYPE html><html><head><title>Resume</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"+FONT[tmpl]+";font-size:13px;line-height:1.6;color:#111;padding:36px 48px;max-width:800px;margin:0 auto;}a{color:#2563eb;text-decoration:none;}strong{font-weight:700;}</style></head><body>"+content.innerHTML+"</body></html>")
    w.document.close()
    setTimeout(()=>{w.focus();w.print()},500)
  }

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9"}}>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button onClick={()=>nav("/tailor")} style={{fontSize:13,color:"#64748b",background:"none",border:"none",cursor:"pointer"}}>← Back</button>
          <span style={{fontSize:13,fontWeight:500,color:"#111"}}>Your tailored resume</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={copy} style={{fontSize:13,padding:"6px 16px",border:"1px solid",borderColor:copied?"#4ade80":"#e2e8f0",borderRadius:8,background:"#fff",color:copied?"#16a34a":"#374151",cursor:"pointer"}}>{copied?"✓ Copied":"Copy"}</button>
          <button onClick={downloadTxt} style={{fontSize:13,padding:"6px 16px",border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",color:"#374151",cursor:"pointer"}}>Download TXT</button>
          <button onClick={downloadPdf} style={{fontSize:13,padding:"6px 16px",border:"none",borderRadius:8,background:"#2563eb",color:"#fff",fontWeight:500,cursor:"pointer"}}>Save as PDF</button>
        </div>
      </div>
      <div style={{background:"#fff",borderBottom:"1px solid #f1f5f9",padding:"8px 24px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:500,textTransform:"uppercase",letterSpacing:".07em",color:"#94a3b8",marginRight:8}}>Template</span>
        {TEMPLATES.map(t=>(
          <button key={t.id} onClick={()=>setTmpl(t.id)} style={{fontSize:12,padding:"4px 14px",borderRadius:20,border:"1px solid",borderColor:tmpl===t.id?"transparent":"#e2e8f0",background:tmpl===t.id?"#111":"transparent",color:tmpl===t.id?"#fff":"#64748b",cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{maxWidth:860,margin:"32px auto",padding:"0 16px"}}>
        <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,.08)",padding:"32px 44px"}}>
          <ResumeContent resume={resume} tmpl={tmpl} linkedin={linkedin} github={github} portfolio={portfolio} />
        </div>
      </div>
    </div>
  )
}