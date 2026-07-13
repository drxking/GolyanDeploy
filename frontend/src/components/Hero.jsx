import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative bg-white overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-red-50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full -translate-x-32 translate-y-16 opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="lg:grid lg:grid-cols-12 lg:min-h-[90vh] items-center">

          {/* Text content */}
          <div className="lg:col-span-6 px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-pg-gold/30 text-pg-gold rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide mb-8">
              <span className="w-2 h-2 bg-pg-gold rounded-full animate-pulse"></span>
              Applications Now Open — 2026 Cycle
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Empowering<br />
              <span className="text-pg-maroon">Nepal's</span> Next<br />
              Generation
            </h1>

            <div className="mt-2 h-1 w-20 bg-pg-gold rounded-full"></div>

            <p className="mt-8 text-lg text-gray-500 leading-relaxed max-w-lg">
              The Pawan Golyan Scholarship Program provides full financial support, mentorship, and opportunity to students from <strong className="text-gray-700">+2 through PhD</strong> — across all 77 districts of Nepal.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/apply"
                className="btn-primary text-base px-8 py-4 shadow-lg hover:shadow-xl"
              >
                Apply Now
              </Link>
              <Link
                to="/eligibility"
                className="btn-secondary text-base px-8 py-4"
              >
                Check Eligibility
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 divide-x divide-gray-200">
              <div>
                <div className="text-2xl font-bold text-pg-maroon">2,500+</div>
                <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">Active Scholars</div>
              </div>
              <div className="pl-8">
                <div className="text-2xl font-bold text-pg-maroon">77</div>
                <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">Districts</div>
              </div>
              <div className="pl-8">
                <div className="text-2xl font-bold text-pg-maroon">94%</div>
                <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">Graduation Rate</div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="lg:col-span-6 relative">
            <div className="relative h-72 lg:h-full lg:min-h-[90vh]">
              <img
                src="https://marvel-b1-cdn.bc0a.com/f00000000290162/images.ctfassets.net/2htm8llflwdx/4RPjtd7hjnY1vlHygqkfqX/3c656d6c55009dedf8e72459b203faff/Shorelight_Nepal_Student_Visa.jpg?fit=thumb"
                alt="Students celebrating their scholarship"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent lg:block hidden"></div>
              {/* Gold border accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-pg-gold lg:top-0 lg:left-0 lg:bottom-0 lg:right-auto lg:h-full lg:w-1"></div>

              {/* Floating card */}
              <div className="absolute bottom-8 left-8 bg-white rounded-xl shadow-xl p-4 border border-gray-100 lg:bottom-12 lg:left-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Free to Apply</div>
                    <div className="text-xs text-gray-400">No application fee required</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
