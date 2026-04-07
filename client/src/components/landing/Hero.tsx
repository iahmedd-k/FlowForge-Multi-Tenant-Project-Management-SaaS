import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, CalendarDays, BarChart3, Users, BellRing, CheckSquare, FolderKanban, Clock } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-8 sm:pt-12 md:pt-20 pb-8 sm:pb-16 md:pb-24 text-center bg-white font-sans">
      <div className="container relative z-10 max-w-5xl px-3 sm:px-4">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-medium leading-tight tracking-tight max-w-4xl mx-auto">
            Run projects with the{" "}
            <span className="bg-gradient-to-r from-pink-500 via-red-400 to-orange-400 bg-clip-text text-transparent block md:inline">
              clarity your team needs
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-gray-500 font-medium leading-relaxed">
            Plan work, assign owners, track due dates, manage projects, and follow reporting from one shared workspace.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2">
            <Link
              to="/signup"
              className="rounded-full bg-gradient-to-r from-teal-400 to-rose-400 px-6 sm:px-8 py-2.5 sm:py-3.5 min-h-[44px] text-xs sm:text-sm md:text-base font-semibold text-white shadow-soft transition-transform hover:scale-105 inline-flex items-center justify-center"
            >
              Get Started <ArrowRight size={18} className="inline ml-1" />
            </Link>
            <p className="mt-2 text-xs text-gray-400 font-medium">
              No credit card needed • Unlimited time on Free plan
            </p>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="mt-8 sm:mt-12 md:mt-16 mx-auto relative px-2 sm:px-4 hidden sm:block"
        >
          {/* Dashboard illustration container - hidden on mobile */}
          <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] rounded-lg sm:rounded-xl md:rounded-2xl bg-[#fafafa] border border-gray-100 shadow-lg sm:shadow-xl md:shadow-2xl overflow-hidden shadow-pink-500/5">
            {/* Fake dashboard header */}
            <div className="h-8 sm:h-10 md:h-12 border-b border-gray-100 flex items-center px-3 sm:px-4 gap-3 sm:gap-4 bg-white">
              <span className="font-bold text-red-500 text-sm sm:text-base md:text-lg">■</span>
              <span className="font-bold text-gray-700 text-xs sm:text-sm">FlowForge</span>
              <span className="text-gray-400 text-xs">service</span>
            </div>

            {/* Fake dashboard content */}
            <div className="p-3 sm:p-4 md:p-6 text-left absolute inset-0 top-8 sm:top-10 md:top-12 bg-white/50 backdrop-blur-[2px]">
               <h2 className="text-base sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">Requests & issues</h2>
               <div className="flex gap-2 sm:gap-3 md:gap-4 border-b border-gray-100 pb-1 sm:pb-2 mb-3 sm:mb-4 md:mb-6">
                 <span className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1 text-xs sm:text-sm">Main table</span>
                 <span className="text-gray-500 text-xs sm:text-sm">My tickets</span>
                 <span className="text-gray-500 text-xs sm:text-sm">Form</span>
               </div>

               {/* Table Header - hidden on small screens */}
               <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 border-b border-gray-100 pb-2">
                 <div className="col-span-1 border-l-4 border-red-400 pl-2">New Tickets</div>
                 <div className="col-span-3"></div>
                 <div className="col-span-2 text-center">Agent</div>
                 <div className="col-span-2 text-center">Status</div>
                 <div className="col-span-2 text-center">Type</div>
                 <div className="col-span-2 text-center">Priority</div>
               </div>

               {/* Rows - simplified on mobile */}
               <div className="grid grid-cols-12 gap-1 sm:gap-2 text-xs sm:text-sm border-b border-gray-100 py-1 sm:py-2 items-center">
                 <div className="col-span-6 sm:col-span-4 pl-1 sm:pl-3">Benefits enrollment help</div>
                 <div className="hidden sm:flex col-span-2 justify-center"><div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200" /></div>
                 <div className="col-span-3 sm:col-span-2"><div className="bg-orange-100 text-orange-600 rounded text-center text-xs py-0.5 sm:py-1 font-medium">New</div></div>
                 <div className="col-span-3 sm:col-span-2"><div className="bg-pink-100 text-pink-600 rounded text-center text-xs py-0.5 sm:py-1 font-medium">HR</div></div>
               </div>

               <div className="grid grid-cols-12 gap-1 sm:gap-2 text-xs sm:text-sm border-b border-gray-100 py-1 sm:py-2 items-center">
                 <div className="col-span-6 sm:col-span-4 pl-1 sm:pl-3">Travel reimbursement</div>
                 <div className="hidden sm:flex col-span-2 justify-center"><div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200" /></div>
                 <div className="col-span-3 sm:col-span-2"><div className="bg-orange-100 text-orange-600 rounded text-center text-xs py-0.5 sm:py-1 font-medium">New</div></div>
                 <div className="col-span-3 sm:col-span-2"><div className="bg-pink-100 text-pink-600 rounded text-center text-xs py-0.5 sm:py-1 font-medium">HR</div></div>
               </div>
            </div>

            {/* Overlaid Grid Menu - scaled down on tablet */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.6 }}
               className="absolute right-4 sm:right-6 md:right-10 top-12 sm:top-16 md:top-20 w-[260px] sm:w-[300px] md:w-[320px] bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-100 p-4 sm:p-5 md:p-6 z-20"
            >
               <h3 className="text-xs sm:text-sm md:text-base font-bold text-center mb-3 sm:mb-4 md:mb-6 text-gray-800">
                 What would you like to <span className="text-blue-500">manage?</span>
               </h3>

               <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:gap-3">
                 {[
                   { icon: LayoutDashboard, label: "Tasks", color: "text-green-500" },
                   { icon: FolderKanban, label: "Projects", color: "text-gray-500" },
                   { icon: CalendarDays, label: "Calendar", color: "text-gray-500" },
                   { icon: Users, label: "Team", color: "text-green-500", highlight: true },
                   { icon: CheckSquare, label: "Status", color: "text-red-500", active: true },
                   { icon: BellRing, label: "Alerts", color: "text-gray-500" },
                   { icon: BarChart3, label: "Reporting", color: "text-teal-500", highlight: true },
                   { icon: Clock, label: "Deadlines", color: "text-gray-500" },
                   { icon: CalendarDays, label: "Planning", color: "text-gray-500" },
                 ].map((item, idx) => (
                   <div 
                     key={idx} 
                     className={`flex flex-col items-center justify-center p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl border ${item.active ? 'border-red-400 bg-red-50/30' : 'border-gray-100 hover:border-gray-300'} transition-colors cursor-pointer relative`}
                   >
                     {item.highlight && (
                       <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-50">
                         <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-sm bg-green-400" />
                       </div>
                     )}
                     <item.icon size={16} strokeWidth={1.5} className={`mb-1 sm:mb-1.5 md:mb-2 ${item.color}`} />
                     <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center text-gray-600 leading-tight">
                       {item.label}
                     </span>
                   </div>
                 ))}
               </div>

               <button className="w-full mt-3 sm:mt-4 md:mt-6 rounded-full bg-gradient-to-r from-teal-400 to-rose-400 px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 min-h-[40px] sm:min-h-[44px] text-xs sm:text-xs md:text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105 inline-flex items-center justify-center w-full">
                  Get Started <ArrowRight size={14} className="ml-1" />
               </button>
            </motion.div>

            {/* Floating avatars and tooltips - hidden on mobile */}
            <div className="absolute left-[-20px] top-1/4 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 flex items-center gap-1 sm:gap-2 z-30 hidden sm:flex">
               <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-200">
                  <img src="https://i.pravatar.cc/150?u=cx" className="rounded-full" />
               </div>
               <div className="text-left leading-tight hidden sm:block">
                 <div className="text-xs font-bold whitespace-nowrap">SLA Monitoring</div>
               </div>
            </div>

            <div className="absolute left-4 sm:left-10 bottom-12 sm:bottom-20 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 flex items-center gap-1 sm:gap-2 z-30 hidden sm:flex">
               <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white shadow-sm overflow-hidden rounded-lg sm:rounded-xl bg-pink-500 flex justify-center pt-1.5 sm:pt-2">
                 <img src="https://i.pravatar.cc/150?u=ab" className="w-full object-cover" />
               </div>
               <div className="text-left leading-tight hidden sm:block">
                 <div className="text-xs font-bold whitespace-nowrap text-gray-800">Customer Support</div>
                 <div className="text-[8px] sm:text-xs font-bold whitespace-nowrap">Monitoring</div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative background blur shapes - scaled down on mobile */}
      <div className="absolute top-1/4 left-0 w-[250px] sm:w-[350px] md:w-[500px] h-[250px] sm:h-[350px] md:h-[500px] bg-red-100/50 rounded-full blur-[80px] sm:blur-[100px] -z-10 mix-blend-multiply" />
      <div className="absolute top-0 right-0 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] bg-cyan-100/40 rounded-full blur-[80px] sm:blur-[100px] -z-10 mix-blend-multiply" />
    </section>
  );
};

export default Hero;
