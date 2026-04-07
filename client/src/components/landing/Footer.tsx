import { Link } from "react-router-dom";
import { Twitter, Linkedin, Facebook, Github, Youtube } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Projects", href: "/products/projects" },
      { name: "Work Management", href: "/products/work-management" },
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Features", href: "/features" },
      { name: "Contact Sales", href: "/contact" },
    ]
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ]
  }
];

const socialIcons = [
  { Icon: Twitter, href: "#" },
  { Icon: Linkedin, href: "#" },
  { Icon: Facebook, href: "#" },
  { Icon: Github, href: "#" },
  { Icon: Youtube, href: "#" },
];

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="container max-w-[1200px]">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2 md:col-span-3 lg:col-span-1 flex flex-col items-start lg:mb-0 mb-8">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg leading-none">
                F
              </div>
              <span className="font-display text-xl font-bold text-gray-900 tracking-tight">FlowForge</span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed max-w-xs">
              The work management platform for projects, tasks, reporting, and practical team automations.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="flex flex-col">
              <h4 className="font-bold text-gray-900 mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-[15px] font-medium text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap text-sm text-gray-500 font-medium gap-4 md:gap-8 justify-center md:justify-start">
            <span>© 2026 FlowForge</span>
            <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            {socialIcons.map((social, idx) => (
              <a 
                key={idx} 
                href={social.href} 
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <social.Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
