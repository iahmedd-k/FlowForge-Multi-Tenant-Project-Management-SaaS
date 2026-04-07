import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Mic, ArrowUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const ShowcaseTabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container">
        {/* Tabs Desktop */}
        <div className="hidden md:flex justify-center gap-8 mb-12 border-b border-gray-200">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`pb-4 text-base font-medium relative transition-colors ${
                activeTab === idx ? "text-black" : "text-gray-500 hover:text-black"
              }`}
            >
              {tab}
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-black"
                />
              )}
            </button>
          ))}
        </div>

        {/* Layout Box */}
        <div className="bg-[#f3f4fa] rounded-3xl flex flex-col lg:flex-row overflow-hidden border border-gray-100 shadow-sm">
          {/* Left Side */}
          <div className="p-8 md:p-12 lg:w-1/3 flex flex-col justify-between">
            <div>
              <div className="uppercase tracking-widest text-[#3e4453] text-xs font-bold mb-6">
                PMO & Operations
              </div>
              <h2 className="text-3xl md:text-4xl font-display text-[#1f2127] font-medium leading-tight mb-8">
                Deliver strategic initiatives on time with clarity and predictability
              </h2>
              <Link
                to="/signup"
                className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Get Started <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap gap-2 text-[#3e4453]">
              {pillsArray.map(pill => (
                <div key={pill} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm">
                  {pill}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Mockup */}
          <div className="lg:w-2/3 bg-gradient-to-br from-[#7a6cf9] to-[#5d56ef] p-6 md:p-12 relative min-h-[400px] flex items-center justify-center overflow-hidden">
             
             {/* Left/Right Navigation controls inside blue box */}
             <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
               <button className="h-10 w-10 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors">
                  <ChevronLeft size={32} />
               </button>
             </div>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
               <button className="h-10 w-10 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors">
                  <ChevronRight size={32} />
               </button>
             </div>

             {/* Background floating labels */}
             <div className="absolute top-10 left-10 bg-white/20 backdrop-blur rounded px-3 py-1 text-white text-xs font-medium flex items-center gap-1">
               <Sparkles size={12} /> Create plan
             </div>
             <div className="absolute top-6 right-32 bg-white/20 backdrop-blur rounded px-3 py-1 text-white text-xs font-medium flex items-center gap-1">
               <Sparkles size={12} /> Research competitors
             </div>
             <div className="absolute bottom-10 left-10 bg-white/20 backdrop-blur rounded px-3 py-1 text-white text-xs font-medium flex items-center gap-1">
               <Sparkles size={12} /> Update timeline
             </div>

             {/* Main Table image mockup */}
             <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-white/20 flex flex-col z-10">
               <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-green-400" />
                 </div>
                 <div className="ml-4 font-bold text-gray-500 flex items-center gap-1 opacity-60">
                   ⊞ FlowForge work management
                 </div>
               </div>

               <div className="p-6">
                 <h3 className="text-2xl font-bold flex items-center gap-2">
                   <span className="bg-red-100 text-red-600 rounded text-xs px-1 py-0.5">📅 17</span>
                   Product launch
                 </h3>

                 {/* Tab row */}
                 <div className="flex gap-4 border-b border-gray-200 mt-4 text-sm font-medium text-gray-500 pb-2">
                   <span className="text-blue-600 border-b-2 border-blue-600 pb-2">Main table</span>
                   <span>Gantt</span>
                   <span>Marketing view</span>
                   <span>+</span>
                 </div>

                 {/* Table */}
                 <div className="mt-4">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="w-1 h-4 bg-red-400 rounded-full" />
                     <span className="font-bold text-red-500">Planning</span>
                   </div>

                   <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                     <div className="flex border-b border-gray-200 bg-gray-50">
                       <div className="w-[40%] p-2 font-medium">Task</div>
                       <div className="w-[20%] p-2 font-medium border-l border-gray-200">Status</div>
                       <div className="w-[40%] p-2 font-medium border-l border-gray-200">Messaging strategy</div>
                     </div>
                     <div className="flex border-b border-gray-200">
                       <div className="w-[40%] p-2">User testing</div>
                       <div className="w-[20%] p-2 border-l border-gray-200 bg-green-500 text-white text-center text-xs flex justify-center items-center">Done</div>
                       <div className="w-[40%] p-2 border-l border-gray-200 text-gray-500 truncate">Loopfy's score mess...</div>
                     </div>
                     <div className="flex border-b border-gray-200">
                       <div className="w-[40%] p-2">Messaging and positioning</div>
                       <div className="w-[20%] p-2 border-l border-gray-200 bg-purple-500 text-white text-center text-xs flex justify-center items-center">Pending approval</div>
                       <div className="w-[40%] p-2 border-l border-gray-200 text-gray-500 truncate">BaseMetric's score m...</div>
                     </div>
                     <div className="flex">
                       <div className="w-[40%] p-2">Pricing strategy</div>
                       <div className="w-[20%] p-2 border-l border-gray-200 bg-orange-500 text-white text-center text-xs flex justify-center items-center">Working on it</div>
                       <div className="w-[40%] p-2 border-l border-gray-200 text-gray-500 truncate">BrightStack's score me...</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Overhanging Sidekick Input */}
             <div className="absolute right-10 bottom-10 z-30 w-80 bg-white/70 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-white/50" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,240,250,0.9))'}}>
                <div className="flex items-center gap-1 border-b border-gray-200/50 pb-2 mb-2">
                   <div className="flex gap-0.5">
                     <div className="w-2 h-2 rounded-full bg-red-400" />
                     <div className="w-2 h-2 rounded-full bg-amber-400" />
                     <div className="w-2 h-2 rounded-full bg-green-400" />
                   </div>
                   <span className="font-bold text-sm ml-1 text-gray-700">FlowForge <span className="font-medium opacity-70">sidekick</span></span>
                </div>
                <p className="text-sm font-medium text-gray-800 leading-snug mb-4">
                  Send everyone that I'm pushing the deadline to early next week
                </p>
                <div className="flex items-center justify-between">
                   <div className="flex gap-2 text-gray-400">
                     <span className="font-bold">@</span>
                     <span>+</span>
                   </div>
                   <div className="flex gap-2 text-gray-400 items-center">
                     <Mic size={16} />
                     <button className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center"><ArrowUp size={14} /></button>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseTabs;
