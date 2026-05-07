import { Link } from 'react-router-dom'

export default function Landing({ session }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-6xl font-bold leading-tight mb-6">
          Your Dream Job —<br />
          <span className="text-blue-500">Carvia</span> Gets You There
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Paste any job description and get a tailored, ATS-ready resume and cover letter in seconds.
        </p>
        <div className="flex items-center justify-center gap-4 mb-16">
          <Link to={session ? '/tailor' : '/auth'}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700">
            Get started free →
          </Link>
          <Link to={session ? '/dashboard' : '/auth'}
            className="border border-gray-700 text-gray-300 px-8 py-3.5 rounded-xl text-base font-semibold hover:border-gray-500">
            View dashboard
          </Link>
        </div>
        {/* Stats */}
        <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
          <span>✓ No Credit Card</span>
          <span>✓ Free Forever</span>
          <span>✓ Instant Results</span>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to land the job</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: '🎯', title: 'ATS Optimized Resume', desc: 'Keywords from the job description woven naturally into your resume. Beat the bots, get to humans.' },
            { icon: '✉️', title: 'Cover Letters', desc: 'Personalized cover letters matched to the role, company, and your tone preference.' },
            { icon: '📁', title: 'Save & Manage', desc: 'All your tailored resumes saved to your dashboard. Access them anytime.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload your resume', desc: 'Upload your existing resume as PDF, DOCX, or paste the text directly.' },
              { step: '02', title: 'Paste the job description', desc: 'Copy the full job description from any job board and paste it in.' },
              { step: '03', title: 'Get your tailored resume', desc: 'Carvia rewrites your resume to match the role and saves it to your dashboard.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-bold text-gray-800 mb-4">{s.step}</div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to land your next role?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join thousands of job seekers using Carvia to get more interviews.</p>
          <Link to={session ? '/tailor' : '/auth'}
            className="bg-blue-600 text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-blue-700 inline-block">
            Start tailoring for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
    </div>
  )
}