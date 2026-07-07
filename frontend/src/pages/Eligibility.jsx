import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LEVELS = [
  { key: 'school', label: 'School (Class 1–10)', icon: '📚', scholarships: ['School Scholarship', 'Remote District Support'] },
  { key: 'plus2', label: '+2 / Higher Secondary', icon: '📖', scholarships: ['+2 Scholarship', 'Women in STEM', 'Remote District Support'] },
  { key: 'bachelor', label: 'Bachelor', icon: '🎓', scholarships: ['Bachelor Scholarship', 'Women in STEM', 'Remote District Support'] },
  { key: 'master', label: 'Master', icon: '🔬', scholarships: ['Master Scholarship', 'Women in STEM'] },
  { key: 'phd', label: 'PhD / Research', icon: '🧪', scholarships: ['PhD & Research Scholarship'] },
];

const DISTRICTS_REMOTE = ['Humla','Jumla','Dolpa','Mugu','Kalikot','Bajhang','Bajura','Achham','Darchula'];

const Eligibility = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ level: '', district: '', gender: '', gpa: '', income: '', disability: false });
  const [results, setResults] = useState(null);

  const set = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const check = () => {
    const levelData = LEVELS.find(l => l.key === answers.level);
    if (!levelData) return;
    let scholarships = [...levelData.scholarships];
    if (DISTRICTS_REMOTE.includes(answers.district)) scholarships.push('Remote District Support');
    scholarships = [...new Set(scholarships)];
    const eligible = parseFloat(answers.gpa) >= 2.8 || answers.level === 'school';
    setResults({ eligible, scholarships: eligible ? scholarships : [] });
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-pg-gold font-semibold text-xs uppercase tracking-widest">2-Minute Check</p>
          <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Eligibility Wizard</h1>
          <p className="mt-3 text-gray-500">Answer a few quick questions to find out which scholarships you qualify for.</p>
        </div>

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Step 1: Your Profile</h2>

            <div>
              <label className="form-label">Current Education Level <span className="text-red-500">*</span></label>
              <div className="mt-3 grid grid-cols-1 gap-3">
                {LEVELS.map(l => (
                  <button
                    key={l.key}
                    onClick={() => set('level', l.key)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      answers.level === l.key
                        ? 'border-pg-maroon bg-red-50'
                        : 'border-gray-100 hover:border-pg-gold bg-white'
                    }`}
                  >
                    <span className="text-3xl">{l.icon}</span>
                    <span className={`font-semibold ${answers.level === l.key ? 'text-pg-maroon' : 'text-gray-700'}`}>{l.label}</span>
                    {answers.level === l.key && <span className="ml-auto text-pg-maroon">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Gender</label>
                <select value={answers.gender} onChange={e => set('gender', e.target.value)} className="form-input">
                  <option value="">Select...</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">District</label>
                <select value={answers.district} onChange={e => set('district', e.target.value)} className="form-input">
                  <option value="">Select...</option>
                  {['Kathmandu','Lalitpur','Bhaktapur','Morang','Kaski','Humla','Jumla','Dolpa','Solukhumbu','Sindhupalchok','Dang','Kailali','Bardiya'].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => answers.level && setStep(2)}
              disabled={!answers.level}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${answers.level ? 'btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Academic details */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Step 2: Academic & Financial</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">GPA (most recent)</label>
                <input type="number" step="0.1" min="0" max="4" value={answers.gpa} onChange={e => set('gpa', e.target.value)} placeholder="e.g. 3.2" className="form-input" />
                <p className="text-xs text-gray-400 mt-1">Use a 0.0 to 4.0 scale.</p>
              </div>
              <div>
                <label className="form-label">Annual Family Income (NRs)</label>
                <select value={answers.income} onChange={e => set('income', e.target.value)} className="form-input">
                  <option value="">Select range...</option>
                  <option value="below1">Below 1 Lakh</option>
                  <option value="1to3">1 – 3 Lakh</option>
                  <option value="3to5">3 – 5 Lakh</option>
                  <option value="5to10">5 – 10 Lakh</option>
                  <option value="above10">Above 10 Lakh</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl hover:bg-gray-50">
              <input type="checkbox" checked={answers.disability} onChange={e => set('disability', e.target.checked)} className="h-4 w-4 text-pg-maroon" />
              <div>
                <p className="font-semibold text-gray-700 text-sm">Person with Disability</p>
                <p className="text-xs text-gray-400">Additional support may be available</p>
              </div>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:border-pg-maroon hover:text-pg-maroon transition-colors">
                ← Back
              </button>
              <button onClick={check} className="flex-1 btn-primary py-3 rounded-xl font-bold">
                Check Eligibility →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div className="space-y-4">
            {results.eligible ? (
              <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-extrabold text-green-700">You're Eligible!</h2>
                  <p className="text-green-600 mt-2">Based on your profile, you qualify for the following scholarships:</p>
                </div>
                <div className="mt-6 space-y-3">
                  {results.scholarships.map(s => (
                    <div key={s} className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                      <span className="text-green-500 font-bold text-lg">✓</span>
                      <span className="font-semibold text-gray-800">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/apply" className="btn-primary flex-1 text-center py-3 text-base font-bold">
                    Start Application Now →
                  </Link>
                  <button onClick={() => { setStep(1); setAnswers({ level:'',district:'',gender:'',gpa:'',income:'',disability:false }); setResults(null); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:border-pg-maroon hover:text-pg-maroon transition-colors">
                    Check Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-amber-700">Not Eligible at This Time</h2>
                <p className="text-amber-600 mt-2">Your current GPA may not meet the minimum threshold. Please continue to improve your academic performance.</p>
                <button onClick={() => setStep(1)} className="mt-6 btn-secondary">Check Again</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Eligibility;
