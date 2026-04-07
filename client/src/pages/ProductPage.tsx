import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LayoutDashboard, TrendingUp, Code2, Megaphone, Kanban, HeartPulse } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const productData: Record<string, { title: string; tagline: string; description: string; icon: React.ElementType; color: string; features: string[] }> = {
  "work-management": {
    title: "Work Management",
    tagline: "Manage all your work in one place",
    description: "Plan, track, and deliver every project with a flexible platform that adapts to how your team works. From simple tasks to complex workflows, manage it all.",
    icon: LayoutDashboard,
    color: "bg-brand-blue",
    features: ["Task boards and status tracking", "Assignees, priorities, and due dates", "Calendar planning", "Workspace automations", "Comments and file attachments", "Reporting and visibility"],
  },
  crm: {
    title: "Reporting",
    tagline: "See where work stands",
    description: "Track team progress, overdue work, workload, and completion trends with reporting built directly on top of your workspace.",
    icon: TrendingUp,
    color: "bg-brand-green",
    features: ["Completion insights", "Overdue task visibility", "Workload tracking", "Project summaries", "Status breakdowns", "Team-level reporting"],
  },
  dev: {
    title: "Team Collaboration",
    tagline: "Keep everyone aligned",
    description: "Assign work, collaborate on tasks, share files, and keep project members updated from one shared board.",
    icon: Code2,
    color: "bg-brand-purple",
    features: ["Task comments", "Workspace invites", "Role management", "Project membership", "Notifications", "Mention alerts"],
  },
  marketer: {
    title: "Calendar",
    tagline: "Plan work around real deadlines",
    description: "Use calendar-based planning to stay on top of due dates, upcoming work, and overdue tasks across projects.",
    icon: Megaphone,
    color: "bg-brand-pink",
    features: ["Due date visibility", "Task schedule view", "Deadline reminders", "Overdue tracking", "Monthly planning", "Task drill-down"],
  },
  projects: {
    title: "Projects",
    tagline: "Deliver every project on time",
    description: "A powerful project management tool for teams of all sizes. Plan resources, set milestones, and keep every stakeholder aligned.",
    icon: Kanban,
    color: "bg-brand-orange",
    features: ["Project boards", "Members and ownership", "Deadlines", "Task grouping", "Progress tracking", "Reporting and insights"],
  },
  service: {
    title: "Automations",
    tagline: "Reduce manual follow-up work",
    description: "Turn on practical task and project automations that help teams stay informed and keep work moving.",
    icon: HeartPulse,
    color: "bg-brand-blue",
    features: ["Assignment notifications", "Due date reminders", "Comment mentions", "Priority alerts", "Review alerts", "Project deadline warnings"],
  },
};

const ProductPage = () => {
  const { slug } = useParams();
  const product = productData[slug || ""] || productData["work-management"];

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-blue/5 blur-3xl" />
          <div className="absolute -left-40 top-40 h-[300px] w-[300px] rounded-full bg-brand-purple/5 blur-3xl" />
        </div>
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${product.color}`}>
              <product.icon size={32} className="text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">
              FlowForge <span className="gradient-text">{product.title}</span>
            </h1>
            <p className="mt-3 text-xl text-muted-foreground">{product.tagline}</p>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">{product.description}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="gradient-cta group inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-semibold text-primary-foreground shadow-soft hover:shadow-elevated">
                Get Started <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/#pricing" className="inline-flex items-center rounded-full border border-border px-8 py-3.5 font-semibold text-foreground hover:bg-muted">
                See Pricing
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mt-20 max-w-2xl">
            <h2 className="mb-8 text-center font-display text-2xl font-bold">Key Features</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {product.features.map((f, i) => (
                <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <CheckCircle2 size={20} className="shrink-0 text-brand-green" />
                  <span className="text-sm font-medium text-foreground">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ProductPage;
