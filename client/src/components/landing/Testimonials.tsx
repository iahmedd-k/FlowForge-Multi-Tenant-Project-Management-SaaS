import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "FlowForge gave our team one place to manage projects, owners, and deadlines. We spend less time chasing updates and more time shipping work.",
    name: "Sarah Chen",
    role: "VP of Engineering",
    company: "TechFlow",
    initials: "SC",
    gradient: "from-blue-600 to-blue-400",
    bg: "from-blue-50 to-blue-100/50",
  },
  {
    quote: "The built-in reminders and assignment alerts saved us hours of follow-up every week. The team always knows what needs attention next.",
    name: "Marcus Johnson",
    role: "Head of Marketing",
    company: "GrowthLab",
    initials: "MJ",
    gradient: "from-purple-600 to-purple-400",
    bg: "from-purple-50 to-purple-100/50",
  },
  {
    quote: "We went from spreadsheet chaos to a single source of truth. Onboarding new team members is now effortless.",
    name: "Aisha Patel",
    role: "COO",
    company: "ScaleUp Inc",
    initials: "AP",
    gradient: "from-emerald-600 to-emerald-400",
    bg: "from-emerald-50 to-emerald-100/50",
  },
];

const Testimonials = () => (
  <section className="py-12 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
    {/* Background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl" />
    </div>

    <div className="container px-3 sm:px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mb-12 sm:mb-16 md:mb-20 max-w-3xl text-center"
      >
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
          Loved by teams <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">everywhere</span>
        </h2>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
          See what customers are building with FlowForge
        </p>
      </motion.div>

      <div className="grid gap-6 sm:gap-7 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${t.bg}`} />
            
            {/* Border gradient */}
            <div className="absolute inset-0 rounded-2xl border border-white/50 group-hover:border-white/80 transition-colors" />
            
            {/* Glassmorphism */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl" />

            {/* Content */}
            <div className="relative p-6 sm:p-7 md:p-8 flex flex-col h-full">
              {/* Stars */}
              <div className="flex gap-1.5 mb-5">
                {[...Array(5)].map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 + j * 0.05 }}
                  >
                    <Star size={18} strokeWidth={1.5} className="fill-yellow-400 text-yellow-400" />
                  </motion.div>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90 mb-6 flex-grow italic">
                "{t.quote}"
              </p>

              {/* Divider */}
              <div className="w-8 h-0.5 bg-gradient-to-r from-current to-transparent mb-5 opacity-40 group-hover:opacity-60 transition-opacity" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white bg-gradient-to-br ${t.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.role}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{t.company}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
