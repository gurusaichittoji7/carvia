import { useEffect, useState } from 'react'
import { getDashboard, deleteResume } from '../lib/api'
export default function Dashboard() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    getDashboard().then(d => { setResumes(d.resumes); setLoading(false) })
  }, [])
  async function handleDelete(id) {
    await deleteResume(id)
    setResumes(r => r.filter(x => x.id !== id))
    if (selected && selected.id === id) setSelected(null)
  }
  function copy() {
    navigator.clipboard.writeText(selected.tailored_resume)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  function downloadTxt() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([selected.tailored_resume], { type: 'text/plain' }))
    a.download = 'carvia_resume.txt'; a.click()
  }
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>
  )
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Your saved resumes</h1>
      {resumes.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
          No saved resumes yet. Tailor your first resume to see it here.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 space-y-2">
            {resumes.map(r => (
              <div key={r.id} onClick={() => setSelected(r)}
                className={'border rounded-xl p-4 cursor-pointer transition-colors ' + (selected && selected.id === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}>
                <p className="text-sm font-medium text-gray-900 truncate">{r.job_title}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          <div className="col-span-2">
            {selected ? (
              <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-medium text-gray-900">{selected.job_title}</h2>
                  <div className="flex gap-2">
                    <button onClick={copy}
                      className={'text-xs border rounded-lg px-3 py-1.5 ' + (copied ? 'border-green-300 text-green-600' : 'border-gray-200 hover:bg-gray-50')}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button onClick={downloadTxt} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">Download</button>
                    <button onClick={() => handleDelete(selected.id)} className="text-xs border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50">Delete</button>
                  </div>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {selected.tailored_resume}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl min-h-48">
                Select a resume to preview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}