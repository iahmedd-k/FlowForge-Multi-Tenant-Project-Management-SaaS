import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Box, Layers, Database, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    id: 1,
    title: "Open ecosystem",
    subtitle: "Connect, extend, and adapt through powerful APIs, 200+ integrations, and MCP.",
    icon: Box,
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: 2,
    title: "Unified data",
    subtitle: "A single source of truth for all your organizational data.",
    icon: Database,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "Infinite knowledge",
    subtitle: "Leverage AI to easily discover insights across your entire workspace.",
    icon: Layers,
    color: "from-orange-500 to-amber-400",
  },
  {
    id: 4,
    title: "Any AI model",
    subtitle: "Bring your own models or use our powerful built-in AI agents.",
    icon: Sparkles,
    color: "from-emerald-400 to-teal-400",
  },
];

const Foundation = () => {
  const [hoveredId, setHoveredId] = useState(1);

  return (
    <section className="bg-[#1f2127] py-24 text-white">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-medium leading-tight">
              One open, connected, and context-aware foundation
            </h2>
          </div>
          <div className="max-w-sm">
            <p className="text-[#a0a4b0] text-lg mb-6 leading-relaxed">
              A shared data layer that gives AI full context across people, data, and workflows.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105"
            >
              Get Started <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Hover expanding cards */}
        <div className="flex flex-col md:flex-row gap-3 h-[450px]">
          {cards.map((card) => {
            const isHovered = hoveredId === card.id;

            return (
              <motion.div
                key={card.id}
                onMouseEnter={() => setHoveredId(card.id)}
                animate={{
                  flex: isHovered ? "3" : "1",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative rounded-2xl bg-black overflow-hidden border border-white/10 cursor-pointer group flex flex-col justify-between p-6 md:p-8"
              >
                {/* Background gradient hint */}
                <div 
                  className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${card.color} opacity-0 blur-3xl transition-opacity duration-500 ${isHovered ? 'opacity-20' : 'group-hover:opacity-10'}`} 
                />

                <motion.div
                  animate={{ y: isHovered ? 0 : 20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="z-10 h-full flex flex-col justify-start md:justify-center"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className={`text-2xl font-display font-medium whitespace-nowrap transition-colors ${isHovered ? 'text-white' : 'text-white/70'}`}>
                        {card.title}
                      </h3>
                      
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ 
                          opacity: isHovered ? 1 : 0,
                          height: isHovered ? "auto" : 0,
                          marginTop: isHovered ? 16 : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-white/60 text-base md:text-lg whitespace-normal leading-relaxed max-w-sm">
                          {card.subtitle}
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      animate={{ opacity: isHovered ? 1 : 0.4, scale: isHovered ? 1.1 : 1 }}
                      className="mt-6 md:mt-0 self-start md:self-end"
                    >
                      <card.icon size={32} className={isHovered ? "text-white" : "text-white/50"} />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Foundation;
