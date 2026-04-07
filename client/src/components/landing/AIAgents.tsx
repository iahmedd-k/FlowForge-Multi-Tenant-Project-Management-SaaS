import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const agentCards = [
  { name: "Engineering agents", image: "https://i.pravatar.cc/150?u=a042581f4e29026704d", color: "bg-[#255b4b]" },
  { name: "Create your own", image: "", color: "bg-[#f3f4fa]", isEmpty: true },
  { name: "Operations agents", image: "https://i.pravatar.cc/150?u=a04258114e29026702d", color: "bg-[#719af3]" },
  { name: "Project agents", image: "https://i.pravatar.cc/150?u=a04258a2462d826712d", color: "bg-[#ffd1f3]" },
  { name: "Marketing agents", image: "https://i.pravatar.cc/150?u=a042581f4e29026024d", color: "bg-[#a353ff]" },
  { name: "Sales agents", image: "https://i.pravatar.cc/150?u=a042581f4e29026704e", color: "bg-[#3fc5f8]" }
];

const AIAgents = () => {
  return (
    <section className="py-24 text-center bg-white overflow-hidden">
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-400 to-blue-500" />
            <span className="font-bold text-xl tracking-tight text-gray-900">FlowForge</span>
            <span className="font-medium text-xl text-gray-900">agents</span>
          </div>
          <span className="text-[11px] font-bold tracking-wider text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">
            Early Access
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium max-w-4xl mx-auto leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mr-2">
            Unlimited workforce
          </span>
          that<br />amplifies your team's impact
        </h2>

        <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 font-medium px-4 leading-relaxed">
          Expand what you can achieve with ready-made or custom AI agents that
          act where you already work.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-full bg-[#5d5dff] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#4b4be5]"
          >
            Request Early Access <ArrowRight size={18} className="inline ml-1" />
          </Link>
          <a
            href="#learn-more"
            className="flex items-center rounded-full px-8 py-3.5 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100"
          >
            Learn more <ArrowRight size={18} className="ml-1" />
          </a>
        </div>
      </motion.div>

      {/* Avatars curve (like Image 2) */}
      <div className="mt-16 flex justify-center items-center flex-nowrap min-w-max mx-auto px-4 -space-x-4 md:-space-x-6 h-36">
         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-300 to-yellow-300 shadow-sm border border-white" />
         <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
           <img src="https://i.pravatar.cc/150?u=10" className="w-full h-full object-cover" />
         </div>
         <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden shadow-md">
           <img src="https://i.pravatar.cc/150?u=11" className="w-full h-full object-cover" />
         </div>
         <div className="w-20 h-20 rounded-full border-[3px] border-white overflow-hidden shadow-lg">
           <img src="https://i.pravatar.cc/150?u=12" className="w-full h-full object-cover" />
         </div>
         <div className="w-24 h-24 rounded-full border-[4px] border-white overflow-hidden shadow-xl">
           <img src="https://i.pravatar.cc/150?u=13" className="w-full h-full object-cover" />
         </div>
         
         {/* Center Giant Avatar */}
         <div className="w-32 h-32 rounded-full shadow-2xl border-[5px] border-white overflow-hidden z-10 relative">
           <img src="https://i.pravatar.cc/150?u=14" className="w-full h-full object-cover" />
         </div>
         
         <div className="w-24 h-24 rounded-full border-[4px] border-white overflow-hidden shadow-xl">
           <img src="https://i.pravatar.cc/150?u=15" className="w-full h-full object-cover" />
         </div>
         <div className="w-20 h-20 rounded-full border-[3px] border-white overflow-hidden shadow-lg">
           <img src="https://i.pravatar.cc/150?u=16" className="w-full h-full object-cover" />
         </div>
         <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden shadow-md">
           <img src="https://i.pravatar.cc/150?u=17" className="w-full h-full object-cover" />
         </div>
         <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
           <img src="https://i.pravatar.cc/150?u=18" className="w-full h-full object-cover" />
         </div>
         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-300 to-emerald-300 shadow-sm border border-white" />
      </div>

      {/* Cards Row (Screenshot 2 bottom part) */}
      <div className="flex gap-4 overflow-x-auto pb-8 snap-x hide-scrollbar px-4 md:px-8 max-w-[1600px] mx-auto mt-10">
         {agentCards.map((card, idx) => (
           <div 
              key={idx} 
              className={`min-w-[280px] h-[360px] rounded-3xl ${card.color} snap-start shrink-0 flex flex-col p-6 relative overflow-hidden text-left border ${card.isEmpty ? 'border-gray-200' : 'border-transparent'} shadow-sm`}
           >
              <div className={`font-medium flex items-center gap-2 ${card.isEmpty ? 'text-gray-900' : 'text-white'}`}>
                 <Sparkles size={16} /> {card.name}
              </div>
              
              {!card.isEmpty ? (
                 <div className="absolute inset-x-0 bottom-0 h-4/5 pt-10 px-4">
                    <img src={card.image} className="w-full h-full object-cover object-top filter contrast-125 saturate-125" />
                 </div>
              ) : (
                 <div className="absolute inset-x-0 bottom-0 h-3/5 flex justify-center items-center opacity-30">
                    {/* Outline wireframe of a person */}
                    <div className="w-32 h-32 rounded-full border border-gray-900 absolute top-0" />
                    <div className="w-16 h-16 rounded-full border border-gray-900 absolute top-8" />
                 </div>
              )}
           </div>
         ))}
      </div>
    </section>
  );
};

export default AIAgents;
