import React from 'react';

const Footer = () => {
  return (
    // <footer className="bg-gray-900 border-t-4 border-pg-gold">
    //   <div className="max-w-[80%] mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
    //     <div className="xl:grid xl:grid-cols-3 xl:gap-8">
    //       <div className="space-y-8 xl:col-span-1">
    //         <span className="text-2xl font-bold text-white tracking-tight">Golyan<span className="text-pg-gold">Scholars</span></span>
    //         <p className="text-gray-400 text-base">
    //           Empowering the youth of Nepal through accessible education, research, and opportunity.
    //         </p>
    //         <div className="flex space-x-6">
    //           {/* Social Links would go here */}
    //         </div>
    //       </div>
    //       <div className="mt-12 grid md:grid-cols-2 gap-8 xl:mt-0 xl:col-span-1">
    //         <div className="md:grid md:grid-cols-1 md:gap-8">
    //           <div>
    //             <h3 className="text-sm font-semibold text-gray-400 tracking-wider text-uppercase">Scholarships</h3>
    //             <ul className="mt-4 space-y-4">
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">School Level</a></li>
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">+2 Level</a></li>
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">Bachelor Level</a></li>
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">Master & PhD</a></li>
    //             </ul>
    //           </div>

    //         </div>
    //       </div>
    //       <div className="mt-12 md:mt-0">
    //             <h3 className="text-sm font-semibold text-gray-400 tracking-wider text-uppercase">Support</h3>
    //             <ul className="mt-4 space-y-4">
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">Eligibility Criteria</a></li>
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">FAQ</a></li>
    //               <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact Us</a></li>
    //             </ul>
    //           </div>

    //     </div>


    //   </div>
    // </footer>
    <footer className='bg-gray-900 ' >
      <div className="grid md:grid-cols-4  py-20 lg:px-40 md:px-20 px-5 md:gap-3 gap-10">

        <div className='flex-1 space-y-3 md:col-span-2 '>
          {/* <span className="text-2xl font-bold text-white tracking-tight">Seven<span className="text-pg-gold">Petal</span></span> */}
              <img src="logo.png" alt="SevenPetal" className='h-20' />

          <p className="text-gray-400 text-base sm:w-2/3">
            Empowering the youth of Nepal through accessible education, research, and opportunity.
          </p>
        </div>
        <div className='md:col-span-1'>
          <h3 className="text-base font-semibold text-white tracking-wider uppercase">Scholarships</h3>
          <ul className="mt-4 space-y-4">
            <li><a href="#" className="text-base text-gray-300 hover:text-white">+2 Level</a></li>
            <li><a href="#" className="text-base text-gray-300 hover:text-white">Bachelor Level</a></li>
            <li><a href="#" className="text-base text-gray-300 hover:text-white">Master & PhD</a></li>
          </ul>
        </div>
        <div className='md:col-span-1'>
          <h3 className="text-base font-semibold text-white tracking-wider uppercase">Support</h3>
          <ul className="mt-4 space-y-4">
            <li><a href="/eligibility" className="text-base text-gray-300 hover:text-white">Eligibility Criteria</a></li>
            <li><a href="/#faq" className="text-base text-gray-300 hover:text-white">FAQ</a></li>
            <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className=" border-t border-gray-700 p-4">
        <p className="text-base text-gray-400 xl:text-center">
          &copy; {new Date().getFullYear()} SevenPetal Scholarship Program. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
