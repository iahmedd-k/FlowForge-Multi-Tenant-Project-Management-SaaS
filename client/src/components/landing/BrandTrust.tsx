import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const brands = [
  {
    name: "McDonald's",
    logoColor: "text-amber-400",
    image: "https://images.unsplash.com/photo-1601596720042-882ab2ca5f6c?auto=format&fit=crop&q=80&w=400&h=200", // Fixed unsplash image
    metric1: "615%",
    metric1Label: "Return on investment",
    category: "Retail & CPG"
  },
  {
    name: "HOLT CAT",
    logoColor: "text-yellow-500",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400&h=200", // Fixed unsplash image
    metric1: "105K",
    metric1Label: "Hours saved annually",
    category: "Manufacturing"
  },
  {
    name: "Canva",
    logoColor: "text-cyan-400",
    image: "https://images.unsplash.com/photo-1561070791-2526d3098f71?auto=format&fit=crop&q=80&w=400&h=200", // Fixed unsplash image
    metric1: "300%",
    metric1Label: "Saved yearly to reinvest",
    category: "Advertising"
  },
  {
    name: "VISTRA",
    logoColor: "text-blue-800",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=200", // Works
    metric1: "28%",
    metric1Label: "Faster time to market",
    category: "Technology"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const BrandTrust = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#fbfafe]">
      <div className="container overflow-hidden px-3 sm:px-4">
        <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 md:flex-row md:items-end md:justify-between mb-8 sm:mb-10 md:mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-medium text-gray-900 leading-tight max-w-2xl"
          >
            Brands who trust FlowForge to accelerate their business outcomes
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full bg-[#5d5dff] px-4 sm:px-6 py-2 sm:py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#4b4be5] hover:shadow-lg whitespace-nowrap self-start md:self-auto"
            >
              Contact sales <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>
        </div>

        {/* Carousel / Row */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-8 sm:pb-12 snap-x shrink-0 hide-scrollbar -mx-3 sm:-mx-4 px-3 sm:px-4 md:mx-0 md:px-0"
        >
          {brands.map((brand, idx) => (
            <motion.div 
              variants={itemVariants}
              key={idx} 
              className="min-w-[85vw] sm:min-w-[300px] w-[85vw] sm:w-[300px] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] snap-start shrink-0 border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-shadow"
            >
              
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                 <div className={`font-bold text-base sm:text-xl tracking-tighter ${brand.logoColor}`}>
                    {brand.name}
                 </div>
                 <a href="#" className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-black border-b border-transparent hover:border-black transition-colors whitespace-nowrap">
                    Study
                 </a>
              </div>

              <div className="rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6 h-24 sm:h-32 bg-gray-100">
                 <img src={brand.image} alt={brand.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>

              <div className="flex items-end gap-2 sm:gap-3 mb-6 sm:mb-8">
                 <div className="text-3xl sm:text-5xl font-display font-medium tracking-tight">{brand.metric1}</div>
                 <div className="text-xs text-gray-500 leading-tight pb-0.5 sm:pb-1 w-16 sm:w-20">{brand.metric1Label}</div>
              </div>

              <div className="mt-auto">
                 <span className="inline-block bg-[#f3f4fa] text-gray-600 rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium">
                    {brand.category}
                 </span>
              </div>

            </motion.div>
          ))}

          {/* Dummy 5th card just to show scrollability */}
          <motion.div 
            variants={itemVariants}
            className="min-w-[85vw] sm:min-w-[300px] w-[85vw] sm:w-[300px] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] snap-start shrink-0 border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-shadow"
          >
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                 <div className="font-bold text-base sm:text-xl tracking-tighter text-black">
                    UNIVERSAL
                 </div>
                 <a href="#" className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-black hover:border-black border-b border-transparent transition-colors whitespace-nowrap">
                    Study
                 </a>
              </div>
              <div className="rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6 h-24 sm:h-32 bg-gray-100">
                 <img src="https://images.unsplash.com/photo-1485095329183-d0797cdc5676?auto=format&fit=crop&q=80&w=400&h=200" alt="Universal" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex items-end gap-2 sm:gap-3 mb-6 sm:mb-8">
                 <div className="text-3xl sm:text-5xl font-display font-medium tracking-tight">517%</div>
                 <div className="text-xs text-gray-500 leading-tight pb-0.5 sm:pb-1 w-16 sm:w-20">Growth acceleration</div>
              </div>
              <div className="mt-auto">
                 <span className="inline-block bg-[#f3f4fa] text-gray-600 rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium">
                    Entertainment
                 </span>
              </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandTrust;
