import React, { useEffect, useRef, useState } from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import NewsletterSection from '../components/NewsletterSection';

// --- Animated Counter ---
const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 2000;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// --- FAQ Item ---
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-5 text-left font-semibold text-gray-800 hover:text-pg-maroon transition-colors"
      >
        <span>{q}</span>
        <svg className={`w-5 h-5 text-pg-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}>
        <p className="text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

// --- Data ---
const scholarships = [
  { icon: '📚', title: 'School Scholarship', level: 'Class 1–10', desc: 'Full coverage of tuition, books, and school supplies for meritorious students across Nepal.', eligibility: 'GPA ≥ 3.0, family income below NRs 3 Lakh/year' },
  { icon: '🎓', title: '+2 Scholarship', level: 'Higher Secondary', desc: 'Supporting students in science, management, and humanities streams at the +2 level.', eligibility: 'SEE GPA ≥ 3.2, any province' },
  { icon: '🏛️', title: 'Bachelor Scholarship', level: 'Undergraduate', desc: 'Complete tuition and stipend for bachelor\'s degree programs in any discipline.', eligibility: 'GPA ≥ 3.0 in +2, entrance exam score' },
  { icon: '🔬', title: 'Master Scholarship', level: 'Postgraduate', desc: 'Specialized financial support for postgraduate studies with mentorship access.', eligibility: 'Bachelor\'s GPA ≥ 3.2, SOP required' },
  { icon: '🧪', title: 'PhD & Research', level: 'Doctoral', desc: 'Full funding for advanced research with international collaboration opportunities.', eligibility: 'Master\'s degree, research proposal, publications' },
  { icon: '👩‍💻', title: 'Women in STEM', level: 'All Levels', desc: 'Dedicated scholarships empowering women to pursue careers in science, technology, engineering and math.', eligibility: 'Female applicants in STEM fields' },
  { icon: '🏔️', title: 'Remote District Support', level: 'All Levels', desc: 'Special provisions for students from Karnali, Sudurpaschim, and other remote districts.', eligibility: 'Applicants from 20 priority districts' },
];

const stats = [
  { value: 2500, suffix: '+', label: 'Scholars Supported' },
  { value: 77, suffix: '', label: 'Districts Covered' },
  { value: 42, suffix: '%', label: 'Female Scholars' },
  { value: 94, suffix: '%', label: 'Graduation Rate' },
];

const testimonials = [
  { name: 'Sita Rai', district: 'Solukhumbu', level: 'Bachelor\'s in Engineering', quote: 'Coming from a remote village, I never imagined studying at Pulchowk Engineering College. The Pawan Golyan Scholarship changed my life forever.', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Bikash Thapa', district: 'Humla', level: 'Master\'s in Public Health', quote: 'This scholarship didn\'t just pay my fees — it gave me mentors, a community, and the confidence to become a change-maker for my people.', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Anita Tamang', district: 'Sindhupalchok', level: 'PhD in Agricultural Science', quote: 'I am the first PhD holder in my entire village. The Golyan Foundation believed in me when no one else did.', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const faqs = [
  { q: 'Who is eligible to apply for the Pawan Golyan Scholarship?', a: 'Students from Class 1 to PhD level enrolled in recognized Nepali institutions are eligible. Priority is given to students from low-income families, remote districts, and marginalized communities.' },
  { q: 'What documents are required for the application?', a: 'Required documents vary by education level. Generally, you will need academic transcripts, a character certificate, citizenship or guardian\'s citizenship for minors, and a recent photograph. The application system guides you through exactly what is needed.' },
  { q: 'Is this scholarship open for students studying abroad?', a: 'Currently, the scholarship is focused on students enrolled in Nepal. However, PhD candidates with international research collaborations may be considered on a case-by-case basis.' },
  { q: 'How long does the review process take?', a: 'After submission, applications are reviewed within 4–6 weeks. Shortlisted candidates are contacted for an interview. Final awardees are announced within 3 months of the application deadline.' },
  { q: 'Can I apply for multiple scholarship categories?', a: 'You can apply for the category that matches your current education level. The eligibility wizard will automatically recommend the most suitable scholarships for your profile.' },
  { q: 'Is the scholarship renewable each year?', a: 'Yes. Scholarships are renewable annually based on academic performance. Scholars must maintain the minimum GPA requirement and attend the annual Golyan Scholars summit.' },
];

// --- Main Page ---
const Home = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <Hero />

      {/* Stats */}
      <section className="bg-pg-maroon py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map((s, i) => (
              <div key={i} className="text-white">
                <div className="text-4xl font-extrabold text-pg-gold">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-sm font-medium uppercase tracking-wide text-red-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <img
                src="/Pawan-Golyan.jpg"
                alt="Pawan Golyan"
                className="rounded-2xl shadow-2xl w-full object-cover max-h-[500px] border-4 border-pg-gold"
              />
            </div>
            <div className="mt-12 lg:mt-0">
              <p className="text-pg-gold font-semibold text-sm uppercase tracking-widest">About the Founder</p>
              <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Pawan Golyan</h2>
              <p className="mt-1 text-lg text-pg-maroon font-medium">Visionary Industrialist & Philanthropist</p>
              <p className="mt-6 text-gray-600 leading-relaxed">
                Born and raised in Nepal, Pawan Golyan built the Golyan Group into one of the region's most respected conglomerates. His vision has always been that <em>education is the greatest equalizer</em> — particularly for students in Nepal's remote hills and plains.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                This scholarship program is his commitment to give back: ensuring that no brilliant young mind is denied the future they deserve simply because of geography or financial circumstance.
              </p>
              <div className="mt-8 flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pg-maroon">15+</div>
                  <div className="text-sm text-gray-500">Years of Giving</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pg-maroon">NRs 50Cr+</div>
                  <div className="text-sm text-gray-500">Total Disbursed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pg-maroon">77</div>
                  <div className="text-sm text-gray-500">Districts Reached</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scholarship Categories */}
      <section id="scholarships" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-pg-gold font-semibold text-sm uppercase tracking-widest">What We Offer</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Scholarship Categories</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Comprehensive support at every stage of your academic journey.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scholarships.map((s, i) => (
              <div key={i} className="group bg-white rounded-2xl  border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col  border border-gray-300">
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-xs font-semibold text-pg-gold uppercase tracking-wider mb-1">{s.level}</div>
                <h3 className="text-lg font-bold text-pg-maroon mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm flex-grow leading-relaxed">{s.desc}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">Eligibility: </span>{s.eligibility}</p>
                </div>
                <Link to="/apply" className="mt-4 text-sm font-semibold text-pg-maroon hover:text-pg-gold transition-colors group-hover:underline">
                  Apply Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scholar Stories / Testimonials */}
      <section id="scholars" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-pg-gold font-semibold text-sm uppercase tracking-widest">Scholar Stories</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Voices of Our Scholars</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <svg className="h-8 w-8 text-pg-gold mb-4" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="text-gray-600 italic leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-pg-gold" />
                  <div>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.level}</div>
                    <div className="text-xs text-pg-maroon">{t.district}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-pg-gold font-semibold text-sm uppercase tracking-widest">Got Questions?</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-2">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
      <NewsletterSection />


      {/* CTA Banner */}
      {/* <section className="bg-pg-maroon py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold text-white">Ready to Apply?</h2>
          <p className="mt-4 text-lg text-red-200">
            Join thousands of Nepali students who have transformed their futures through the Pawan Golyan Scholarship.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apply" className="btn-secondary text-pg-maroon font-bold px-10 py-4 text-base">
              Start Application
            </Link>
            <Link to="/eligibility" className="border-2 border-red-300 text-red-100 hover:text-white hover:border-white px-10 py-4 rounded-md font-semibold text-base transition-colors">
              Check Eligibility First
            </Link>
          </div>
        </div>
      </section> */}

    </div>
  );
};

export default Home;
