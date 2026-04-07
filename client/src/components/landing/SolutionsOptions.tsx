import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  "PMO & Ops",
  "Marketing",
  "Sales & Revenue",
  "IT & Support",
  "Product & Engineering"
];

const pillsArray = [
  "AI risk analyzer", "AI assistant", "Projects & portfolio", 
  "AI agents", "Build your own app", "AI reporting"
];

const SolutionsOptions = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container">
        {/* Header */}
        <div className="text-center mx-auto max-w-3xl mb-16">
           <h2 className="text-4xl md:text-5xl font-display font-medium leading-tight mb-4">
             Solutions for every team, powered by AI
           </h2>
           <p className="text-gray-600 font-medium">
             Keep your teams aligned and work moving with purpose-built solutions for every function, connected on one intelligent platform
           </p>
        </div>

        {/* Tabs Desktop */}
        <div className="hidden md:flex justify-center gap-8 mb-12">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`pb-4 text-[15px] font-medium relative transition-colors ${
                activeTab === idx ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTabOutline"
                  className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-gray-900"
                />
              )}
            </button>
          ))}
        </div>

        {/* Layout Box */}
        <div className="bg-[#f0f1fa] rounded-[32px] flex flex-col lg:flex-row overflow-hidden max-w-[1200px] mx-auto min-h-[500px]">
          {/* Left Side */}
          <div className="p-8 md:p-12 lg:w-[40%] flex flex-col justify-between">
            <div>
              <div className="uppercase tracking-widest text-gray-500 text-xs font-bold mb-6">
                PMO & OPERATIONS
              </div>
              <h3 className="text-3xl font-display text-gray-900 font-medium leading-tight mb-8">
                Deliver strategic initiatives on time with clarity and predictability
              </h3>
              <Link
                to="/signup"
                className="inline-flex items-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Get Started <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap gap-2 text-gray-600">
              {pillsArray.map(pill => (
                <div key={pill} className="bg-white/60 border border-gray-200/50 rounded text-[11px] px-2 py-1 font-medium shadow-sm flex items-center justify-center">
                  {pill}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Cards Area (Image 1) */}
          <div className="lg:w-[60%] bg-[#5649ff] p-6 md:p-12 relative flex items-center overflow-hidden">
             
             {/* Left Nav Button */}
             <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
               <button className="text-white hover:opacity-70 transition-opacity">
                  <ChevronLeft size={32} />
               </button>
             </div>

             {/* Overflow container for cards */}
             <div className="flex gap-4 w-full translate-x-12 relative z-10">
                {/* PMO Agent */}
                <div className="w-[200px] shrink-0 bg-white rounded-2xl shadow-xl p-3 flex flex-col h-[260px]">
                   <div className="bg-cyan-400 rounded-xl w-full h-[150px] overflow-hidden mb-3">
                     <img src="https://i.pravatar.cc/150?u=24" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-sm font-bold text-gray-900">PMO Agent</div>
                   <div className="mt-auto text-[10px] text-gray-500 font-medium flex items-center gap-1">
                     <span className="opacity-50">🔒</span> 2 bottlenecks spotted
                   </div>
                </div>

                {/* Risk Analyzer */}
                <div className="w-[200px] shrink-0 bg-white rounded-2xl shadow-xl p-3 flex flex-col h-[260px]">
                   <div className="bg-purple-500 rounded-xl w-full h-[150px] overflow-hidden mb-3">
                     <img src="https://i.pravatar.cc/150?u=25" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-sm font-bold text-gray-900">Risk Analyzer</div>
                   <div className="mt-auto text-[10px] text-gray-500 font-medium flex items-center gap-1">
                     <span className="text-orange-400">⚠️</span> 5 tasks at risk
                   </div>
                </div>

                {/* Meeting Scheduler */}
                <div className="w-[200px] shrink-0 bg-white rounded-2xl shadow-xl p-3 flex flex-col h-[260px]">
                   <div className="bg-pink-400 rounded-xl w-full h-[150px] overflow-hidden mb-3">
                     <img src="https://i.pravatar.cc/150?u=26" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-sm font-bold text-gray-900">Meeting Scheduler</div>
                   <div className="mt-auto text-[10px] text-gray-500 font-medium flex items-center gap-1">
                     <span className="opacity-50">📅</span> 7 vendors found
                   </div>
                </div>
             </div>

             {/* Carousel dots bottom */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                <div className="w-2 h-2 rounded-full bg-white opacity-40"></div>
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white opacity-40"></div>
             </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsOptions;
