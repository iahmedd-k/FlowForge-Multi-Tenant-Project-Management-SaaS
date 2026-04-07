import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Megaphone, CalendarDays, TrendingUp, Code2, Users, Building2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const solutionData: Record<string, { title: string; tagline: string; description: string; icon: React.ElementType; color: string; benefits: string[]; stats: { value: string; label: string }[] }> = {
  marketing: {
    title: "Operations",
    tagline: "Coordinate recurring work with less follow-up",
    description: "Keep operational work moving with clear ownership, deadlines, reminders, and reporting across the whole team.",
    icon: Megaphone,
    color: "bg-brand-pink",
    benefits: ["Shared task ownership", "Deadline reminders", "Status visibility", "Team notifications", "Reporting dashboards", "Less manual chasing"],
    stats: [{ value: "1", label: "shared workspace" }, { value: "24h", label: "default due reminders" }, { value: "100%", label: "live task visibility" }],
  },
  "project-management": {
    title: "Project Management",
    tagline: "Deliver projects with clear ownership and progress",
    description: "From planning to execution, manage tasks, projects, deadlines, reporting, and team collaboration in one place.",
    icon: CalendarDays,
    color: "bg-brand-blue",
    benefits: ["Project boards", "Task assignments", "Due dates and priorities", "Calendar planning", "Comments and files", "Reporting and automations"],
    stats: [{ value: "1", label: "workspace for delivery" }, { value: "6", label: "core automation rules" }, { value: "100%", label: "shared progress visibility" }],
  },
  sales: {
    title: "Team Reporting",
    tagline: "Understand how work is moving",
    description: "Use reporting views to see completion trends, overdue work, and team workload without leaving the workspace.",
    icon: TrendingUp,
    color: "bg-brand-green",
    benefits: ["Completion rate", "Overdue tasks", "Workload graph", "Active projects", "Task summaries", "Team visibility"],
    stats: [{ value: "4", label: "main reporting blocks" }, { value: "1", label: "shared source of truth" }, { value: "0", label: "extra tools needed" }],
  },
  it: {
    title: "Task Tracking",
    tagline: "Keep work moving across the team",
    description: "Track status, ownership, deadlines, and updates from a board that makes day-to-day execution easier.",
    icon: Code2,
    color: "bg-brand-purple",
    benefits: ["Status updates", "Assignees", "Priority setting", "Task notes", "File uploads", "Inline editing"],
    stats: [{ value: "1", label: "board to manage work" }, { value: "4", label: "task states" }, { value: "100%", label: "live updates" }],
  },
  hr: {
    title: "Team Collaboration",
    tagline: "Keep everyone aligned on the same work",
    description: "Invite teammates, manage access, collaborate in tasks, and notify the right people when action is needed.",
    icon: Users,
    color: "bg-brand-orange",
    benefits: ["Workspace invites", "Role-based access", "Task comments", "Mentions", "Assignment alerts", "Shared project membership"],
    stats: [{ value: "3", label: "main workspace roles" }, { value: "1", label: "shared team space" }, { value: "100%", label: "member visibility" }],
  },
  enterprise: {
    title: "Automated Execution",
    tagline: "Let the workspace handle routine follow-up",
    description: "Use built-in project automations to reduce manual reminders and keep teams informed automatically.",
    icon: Building2,
    color: "bg-brand-blue",
    benefits: ["Assignment notifications", "Review alerts", "Due reminders", "Comment mentions", "Priority alerts", "Project deadline warnings"],
    stats: [{ value: "8", label: "functional MVP rules" }, { value: "24h", label: "default due reminder window" }, { value: "48h", label: "project warning window" }],
  },
};

const SolutionPage = () => {
  const { slug } = useParams();
  const solution = solutionData[slug || ""] || solutionData["marketing"];

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-purple/5 blur-3xl" />
        </div>
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${solution.color}`}>
              <solution.icon size={32} className="text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">
              <span className="gradient-text">{solution.title}</span> Solutions
            </h1>
            <p className="mt-3 text-xl text-muted-foreground">{solution.tagline}</p>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">{solution.description}</p>
            <Link to="/signup" className="gradient-cta group mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-semibold text-primary-foreground shadow-soft hover:shadow-elevated">
              Get Started <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6">
            {solution.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <div className="font-display text-3xl font-extrabold gradient-text">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Benefits */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-8 text-center font-display text-2xl font-bold">Why teams choose us</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {solution.benefits.map((b, i) => (
                <motion.div key={b} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <CheckCircle2 size={20} className="shrink-0 text-brand-green" />
                  <span className="text-sm font-medium text-foreground">{b}</span>
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

export default SolutionPage;
