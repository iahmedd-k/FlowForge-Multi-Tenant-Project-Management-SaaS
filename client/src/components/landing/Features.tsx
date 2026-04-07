import { motion } from "framer-motion";
import { LayoutDashboard, Users, Zap, BarChart3, Clock, CalendarDays, ArrowRight } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Task Management",
    description: "Organize, track, and manage all your team's tasks with customizable boards and views.",
    color: "from-blue-600 to-blue-400",
    bgGradient: "from-blue-50 to-blue-100/50",
    accent: "text-blue-600",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Communicate seamlessly with your team through updates, mentions, and file sharing.",
    color: "from-purple-600 to-purple-400",
    bgGradient: "from-purple-50 to-purple-100/50",
    accent: "text-purple-600",
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Turn on practical workspace automations for assignments, reminders, mentions, and deadline alerts.",
    color: "from-orange-600 to-orange-400",
    bgGradient: "from-orange-50 to-orange-100/50",
    accent: "text-orange-600",
  },
  {
    icon: BarChart3,
    title: "Dashboards",
    description: "Review completion, overdue work, workload, and reporting from live workspace data.",
    color: "from-emerald-600 to-emerald-400",
    bgGradient: "from-emerald-50 to-emerald-100/50",
    accent: "text-emerald-600",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Track time spent on tasks and projects to optimize team productivity.",
    color: "from-pink-600 to-pink-400",
    bgGradient: "from-pink-50 to-pink-100/50",
    accent: "text-pink-600",
  },
  {
    icon: CalendarDays,
    title: "Calendar Planning",
    description: "See work by due date and keep projects moving with shared scheduling visibility.",
    color: "from-cyan-600 to-cyan-400",
    bgGradient: "from-cyan-50 to-cyan-100/50",
    accent: "text-cyan-600",
  },
];

const Features = () => (
  <section className="py-12 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden" id="features">
    {/* Background gradient orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
    </div>

    <div className="container px-3 sm:px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mb-12 sm:mb-16 md:mb-20 max-w-3xl text-center"
      >
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
          Everything you need to <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">work smarter</span>
        </h2>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          The core tools teams need to manage tasks, projects, collaboration, and reporting in one place.
        </p>
      </motion.div>

      <div className="grid gap-5 sm:gap-6 md:gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            {/* Card background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${f.bgGradient}`} />
            
            {/* Border gradient */}
            <div className="absolute inset-0 rounded-2xl border border-white/50 group-hover:border-white/80 transition-colors" />
            
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl" />
            
            {/* Gradient shine effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.bgGradient}`} />

            {/* Content */}
            <div className="relative p-6 sm:p-7 md:p-8 flex flex-col h-full">
              {/* Icon container */}
              <div className={`inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${f.color} shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={28} strokeWidth={1.5} className="text-white" />
              </div>

              {/* Text */}
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-foreground transition-colors">{f.title}</h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4 flex-grow">
                {f.description}
              </p>

              {/* Learn more link */}
              <div className={`inline-flex items-center gap-2 text-sm font-semibold ${f.accent} opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300`}>
                Learn more
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
