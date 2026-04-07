import { ArrowRight, ShieldCheck, FileCheck, CheckCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const EnterpriseTrust = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Enterprise-ready AI work platform
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-medium text-gray-900 leading-tight">
              Trusted by enterprises.<br className="hidden md:block"/> Recognized by industry leaders.
            </h2>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50 whitespace-nowrap self-start md:self-auto"
          >
            Contact sales <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Security Card */}
          <div className="md:col-span-6 bg-white rounded-3xl border border-gray-200 p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
             <div>
                <h3 className="text-2xl font-bold mb-4">Enterprise-grade security</h3>
                <p className="text-gray-600 font-medium text-sm leading-relaxed max-w-sm mb-6">
                  Enterprise-grade AI infrastructure with built-in protection and security, data privacy, governance, permissions, and compliance.
                </p>
                <a href="#" className="inline-flex items-center text-xs font-bold uppercase text-gray-900 border-b border-gray-900 pb-0.5 hover:opacity-70 transition-opacity mb-10">
                  Explore our Trust Center <ArrowRight size={12} className="ml-1" />
                </a>
             </div>

             <div className="flex gap-4 md:gap-8 items-center flex-wrap">
                {/* Fake logos based on screenshot */}
                <div className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-full text-gray-800 shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-16 border-2 flex-shrink-0 border-gray-800 rounded-full text-gray-800">
                  <span className="text-[8px] font-bold">AICPA</span>
                  <span className="text-[12px] font-black leading-none">SOC 2</span>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-16 border-2 flex-shrink-0 border-gray-800 rounded-full text-gray-800">
                  <span className="text-[14px] font-black leading-none">ISO</span>
                  <span className="text-[9px] font-bold">27001</span>
                </div>
                <div className="flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-full flex-shrink-0">
                  <Activity size={28} />
                </div>
             </div>
          </div>

          {/* Gartner Card */}
          <div className="md:col-span-3 bg-white rounded-3xl border border-gray-200 p-8 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-md transition-shadow">
             <div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                   Only work management platform to be recognized as a Leader in
                </p>
                <div className="text-6xl font-display font-medium mb-4">3</div>
                <p className="text-xs font-bold text-gray-800 leading-tight mb-4 max-w-[150px] mx-auto">
                   Gartner® Magic Quadrant™ reports.
                </p>
                <a href="#" className="inline-flex items-center text-[10px] font-bold uppercase text-gray-900 border-b border-gray-900 pb-0.5 hover:opacity-70 transition-opacity">
                  Learn more <ArrowRight size={12} className="ml-1" />
                </a>
             </div>
             
             <div className="mt-8 pt-6 w-full border-t border-gray-100 flex justify-center">
                {/* Gartner text logo mock */}
                <span className="font-serif font-bold text-2xl tracking-tighter">Gartner</span>
             </div>
          </div>

          {/* Forrester Card */}
          <div className="md:col-span-3 bg-white rounded-3xl border border-gray-200 p-8 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-md transition-shadow">
             <div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                   Motorola achieved
                </p>
                <div className="text-5xl md:text-5xl lg:text-6xl font-display font-medium mb-4 tracking-tight">346%</div>
                <p className="text-xs font-medium text-gray-800 leading-tight mb-4">
                   according to research.
                </p>
                <a href="#" className="inline-flex items-center text-[10px] font-bold uppercase text-gray-900 border-b border-gray-900 pb-0.5 hover:opacity-70 transition-opacity">
                  Learn more <ArrowRight size={12} className="ml-1" />
                </a>
             </div>
             
             <div className="mt-8 pt-6 w-full border-t border-gray-100 flex justify-center">
                {/* Forrester text logo mock */}
                <span className="font-serif font-bold text-xl tracking-wide uppercase text-gray-800">FORRESTER</span>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default EnterpriseTrust;
