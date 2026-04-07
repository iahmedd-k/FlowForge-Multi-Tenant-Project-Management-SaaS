import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: "9",
    desc: "Manage all your team's work in one place",
    popular: false,
    features: ["Unlimited boards", "Tasks and projects", "Team members", "Calendar view", "Core reporting"],
  },
  {
    name: "Standard",
    price: "12",
    desc: "Collaborate and optimize your team processes",
    popular: true,
    features: ["Everything in Basic", "Workspace automations", "Notifications and reminders", "Role-based access", "File attachments"],
  },
  {
    name: "Pro",
    price: "19",
    desc: "Streamline complex workflows at scale",
    popular: false,
    features: ["Everything in Standard", "Advanced reporting", "Time tracking", "Priority alerts", "Project deadline warnings"],
  },
];

const Pricing = () => (
  <section className="py-10 sm:py-16 md:py-20 lg:py-28" id="pricing">
    <div className="container px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mb-8 max-w-2xl text-center sm:mb-12 md:mb-14"
      >
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h2>
        <p className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm md:text-base">
          Start for free, upgrade when you need to.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl border p-5 shadow-card transition-shadow hover:shadow-elevated sm:p-6 lg:p-7 ${
              plan.popular
                ? "border-primary bg-card shadow-elevated"
                : "border-border bg-card"
            }`}
          >
            {plan.popular ? (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-cta px-4 py-1 text-xs font-bold text-primary-foreground">
                Most Popular
              </span>
            ) : null}

            <h3 className="text-base font-bold text-foreground sm:text-lg">{plan.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{plan.desc}</p>
            <div className="mb-6 mt-5">
              <span className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">${plan.price}</span>
              <span className="text-xs text-muted-foreground sm:text-sm"> /seat/mo</span>
            </div>
            <Link
              to="/login"
              className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-full py-3 text-center text-xs font-semibold transition-all sm:text-sm ${
                plan.popular
                  ? "gradient-cta text-primary-foreground shadow-soft hover:shadow-elevated"
                  : "border border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              Get Started
            </Link>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                  <Check size={14} strokeWidth={3} className="shrink-0 text-brand-green" />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
