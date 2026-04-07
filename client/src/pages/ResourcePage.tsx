import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Video, HelpCircle, MessagesSquare, GraduationCap, BarChart3, Clock, BookOpen, Users } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const resourceData: Record<string, { title: string; tagline: string; description: string; icon: React.ElementType; color: string; items: { title: string; desc: string; tag: string }[] }> = {
  blog: {
    title: "Blog",
    tagline: "Insights, tips, and best practices",
    description: "Explore the latest articles on productivity, project management, and team collaboration from industry experts.",
    icon: FileText,
    color: "bg-brand-blue",
    items: [
      { title: "10 Ways to Boost Team Productivity", desc: "Discover proven strategies for getting more done with your team.", tag: "Productivity" },
      { title: "The Future of Remote Work in 2025", desc: "How distributed teams are reshaping the modern workplace.", tag: "Remote Work" },
      { title: "Agile vs Waterfall: Which Is Right for You?", desc: "A comprehensive comparison of two popular methodologies.", tag: "Project Management" },
      { title: "Building a Culture of Collaboration", desc: "Why psychological safety matters and how to foster it.", tag: "Culture" },
      { title: "Automation 101: Getting Started", desc: "Save hours each week by automating repetitive workflows.", tag: "Automation" },
      { title: "OKR Best Practices for Growing Teams", desc: "How to set and track objectives that actually drive results.", tag: "Strategy" },
    ],
  },
  webinars: {
    title: "Webinars",
    tagline: "Learn from the experts, live and on-demand",
    description: "Join industry leaders and power users for deep-dive sessions on getting the most from your workflows.",
    icon: Video,
    color: "bg-brand-purple",
    items: [
      { title: "Mastering Automations", desc: "Learn to build powerful no-code automations in 30 minutes.", tag: "Live" },
      { title: "Project Management Masterclass", desc: "End-to-end project delivery with real examples.", tag: "On-Demand" },
      { title: "CRM Best Practices", desc: "How top sales teams organize their pipeline.", tag: "On-Demand" },
      { title: "Enterprise Scale Workshop", desc: "Architecture patterns for large organizations.", tag: "Live" },
      { title: "Dashboard Design Tips", desc: "Create dashboards that tell the right story.", tag: "On-Demand" },
      { title: "Getting Started in 15 Minutes", desc: "Quick setup guide for new teams.", tag: "On-Demand" },
    ],
  },
  "help-center": {
    title: "Help Center",
    tagline: "Get the answers you need",
    description: "Search our extensive knowledge base for step-by-step guides, troubleshooting tips, and feature documentation.",
    icon: HelpCircle,
    color: "bg-brand-green",
    items: [
      { title: "Getting Started Guide", desc: "Everything you need to set up your first board.", tag: "Basics" },
      { title: "Managing Users & Permissions", desc: "Control who can see and edit your data.", tag: "Admin" },
      { title: "Integrations Setup", desc: "Connect your favorite tools in minutes.", tag: "Integrations" },
      { title: "Billing & Subscriptions", desc: "Manage your plan, invoices, and payments.", tag: "Billing" },
      { title: "API Documentation", desc: "Build custom integrations with our REST API.", tag: "Developer" },
      { title: "Mobile App Guide", desc: "Stay productive on iOS and Android.", tag: "Mobile" },
    ],
  },
  community: {
    title: "Community",
    tagline: "Connect, share, and grow together",
    description: "Join thousands of users who share tips, templates, and best practices to get the most from the platform.",
    icon: MessagesSquare,
    color: "bg-brand-orange",
    items: [
      { title: "Community Forums", desc: "Ask questions and share solutions with fellow users.", tag: "Discussion" },
      { title: "User Groups", desc: "Find local and virtual meetups near you.", tag: "Events" },
      { title: "Feature Requests", desc: "Vote on and suggest new features.", tag: "Feedback" },
      { title: "Champions Program", desc: "Become a certified power user and mentor.", tag: "Program" },
      { title: "Partner Directory", desc: "Find certified implementation partners.", tag: "Partners" },
      { title: "Success Stories", desc: "See how teams transformed their workflows.", tag: "Stories" },
    ],
  },
  academy: {
    title: "Academy",
    tagline: "Master the platform with courses & certifications",
    description: "Free courses, tutorials, and certification programs to help you become a platform expert.",
    icon: GraduationCap,
    color: "bg-brand-pink",
    items: [
      { title: "Beginner Certification", desc: "Learn the fundamentals and get certified.", tag: "Course" },
      { title: "Advanced Automations", desc: "Deep dive into complex automation workflows.", tag: "Course" },
      { title: "Admin Certification", desc: "Master account administration and governance.", tag: "Certification" },
      { title: "Dashboard Mastery", desc: "Build impactful dashboards and reports.", tag: "Course" },
      { title: "Developer Course", desc: "Build apps and integrations with our SDK.", tag: "Developer" },
      { title: "Leadership Track", desc: "Strategic planning and portfolio management.", tag: "Course" },
    ],
  },
  templates: {
    title: "Templates",
    tagline: "Get started faster with ready-made templates",
    description: "Browse hundreds of templates built by our team and community. Find the perfect starting point for any project.",
    icon: BarChart3,
    color: "bg-brand-blue",
    items: [
      { title: "Project Tracker", desc: "Track tasks, timelines, and deliverables.", tag: "Project Management" },
      { title: "Content Calendar", desc: "Plan and schedule content across channels.", tag: "Marketing" },
      { title: "Sales Pipeline", desc: "Manage leads from first touch to close.", tag: "Sales" },
      { title: "Sprint Board", desc: "Agile sprint planning and tracking.", tag: "Development" },
      { title: "Employee Onboarding", desc: "Streamline the new hire experience.", tag: "HR" },
      { title: "Event Planning", desc: "Coordinate every detail of your next event.", tag: "Operations" },
    ],
  },
};

const tagColors: Record<string, string> = {
  Productivity: "bg-brand-blue", "Remote Work": "bg-brand-purple", "Project Management": "bg-brand-green",
  Culture: "bg-brand-orange", Automation: "bg-brand-pink", Strategy: "bg-brand-yellow",
  Live: "bg-brand-pink", "On-Demand": "bg-brand-blue", Basics: "bg-brand-green", Admin: "bg-brand-purple",
  Integrations: "bg-brand-orange", Billing: "bg-brand-yellow", Developer: "bg-brand-blue", Mobile: "bg-brand-green",
  Discussion: "bg-brand-blue", Events: "bg-brand-pink", Feedback: "bg-brand-orange", Program: "bg-brand-purple",
  Partners: "bg-brand-green", Stories: "bg-brand-yellow", Course: "bg-brand-blue", Certification: "bg-brand-green",
  Marketing: "bg-brand-pink", Sales: "bg-brand-green", Development: "bg-brand-purple", HR: "bg-brand-orange",
  Operations: "bg-brand-yellow",
};

const ResourcePage = () => {
  const { slug } = useParams();
  const resource = resourceData[slug || ""] || resourceData["blog"];

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-brand-blue/5 blur-3xl" />
        </div>
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${resource.color}`}>
              <resource.icon size={32} className="text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">
              <span className="gradient-text">{resource.title}</span>
            </h1>
            <p className="mt-3 text-xl text-muted-foreground">{resource.tagline}</p>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{resource.description}</p>
          </motion.div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resource.items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
              >
                <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground ${tagColors[item.tag] || "bg-brand-blue"}`}>
                  {item.tag}
                </span>
                <h3 className="mb-2 text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Read more <ArrowRight size={14} />
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResourcePage;
