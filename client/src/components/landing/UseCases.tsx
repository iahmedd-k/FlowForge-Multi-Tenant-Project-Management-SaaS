import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Code2, Users, TrendingUp, CheckCircle2 } from "lucide-react";

const tabs = [
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    color: "bg-brand-pink",
    title: "Plan and execute campaigns",
    points: ["Campaign planning & tracking", "Content calendar management", "Performance analytics", "Team collaboration"],
  },
  {
    id: "dev",
    label: "Development",
    icon: Code2,
    color: "bg-brand-blue",
    title: "Ship products faster",
    points: ["Sprint planning & tracking", "Bug tracking & resolution", "Release management", "CI/CD integration"],
  },
  {
    id: "hr",
    label: "HR",
    icon: Users,
    color: "bg-brand-purple",
    title: "Streamline people ops",
    points: ["Recruitment pipeline", "Onboarding workflows", "Employee engagement", "Performance reviews"],
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    color: "bg-brand-green",
    title: "Close more deals",
    points: ["Pipeline management", "Lead tracking & scoring", "Activity logging", "Revenue forecasting"],
  },
];

const UseCases = () => {
  const [active, setActive] = useState(0);
  const current = tabs[active];

  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">
            Built for every <span className="gradient-text">team</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tailored solutions for marketing, development, HR, sales, and more.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mx-auto mb-10 flex max-w-xl flex-wrap justify-center gap-3">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                active === i
                  ? "gradient-cta text-primary-foreground shadow-soft"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-card md:p-12"
          >
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${current.color}`}>
              <current.icon size={20} className="text-primary-foreground" />
            </div>
            <h3 className="mb-6 font-display text-2xl font-bold text-foreground">{current.title}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {current.points.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="shrink-0 text-brand-green" />
                  <span className="text-sm text-muted-foreground">{p}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default UseCases;
