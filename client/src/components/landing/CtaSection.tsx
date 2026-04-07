export default function CTASection() {
  const floatingCards = [
    { id: 1, side: "left", top: "8%", label: "monday", color: "#A358DF", icon: "⚡" },
    { id: 2, side: "left", top: "38%", label: "Gmail", color: "#EA4335", icon: "M" },
    { id: 3, side: "left", top: "62%", label: "James", initials: "JD" },
    { id: 4, side: "right", top: "8%", label: "⚡", color: "#A358DF", icon: "⚡" },
    { id: 5, side: "right", top: "38%", label: "monday", color: "#A358DF", icon: "✦" },
    { id: 6, side: "right", top: "62%", label: "Gmail", color: "#EA4335", icon: "M" },
  ];

  const agentCards = [
    { name: "Competitor Research Agent", color: "#7C3AED", initials: "CR" },
    { name: "Translator Agent", color: "#DB2777", initials: "TA" },
    { name: "Create a project plan", isTask: true },
  ];

  return (
    <section className="relative min-h-screen bg-white flex items-center justify-center overflow-hidden px-4 py-24 font-sans">

      {/* Background grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Left floating workflow nodes */}
      <div className="absolute left-4 md:left-12 top-0 h-full w-56 hidden lg:block">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 600" fill="none">
          <line x1="80" y1="80" x2="80" y2="170" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1="80" y1="220" x2="80" y2="300" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" />
          <circle cx="80" cy="175" r="10" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
          <text x="80" y="180" textAnchor="middle" fontSize="10" fill="#9ca3af">↕</text>
        </svg>

        {/* Node: monday */}
        <div className="absolute top-12 left-6 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-44">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "#A358DF20" }}>
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" fill="#F6C244" />
              <rect x="15" y="1" width="12" height="12" rx="2" fill="#FF3D57" />
              <rect x="1" y="15" width="12" height="12" rx="2" fill="#00CA72" />
              <rect x="15" y="15" width="12" height="12" rx="2" fill="#A358DF" />
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-purple-200 rounded-full w-16" />
            <div className="h-1.5 bg-gray-100 rounded-full w-12" />
          </div>
        </div>

        {/* Node: Gmail */}
        <div className="absolute top-52 left-6 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-44">
          <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center text-red-500 font-bold text-xs">M</div>
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-yellow-200 rounded-full w-16" />
            <div className="h-1.5 bg-teal-100 rounded-full w-10" />
          </div>
        </div>

        {/* Person card */}
        <div className="absolute top-80 left-0 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-36">
          <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-gray-500 text-xs font-bold">JD</div>
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-gray-200 rounded-full w-14" />
          </div>
        </div>
      </div>

      {/* Right floating workflow nodes */}
      <div className="absolute right-4 md:right-12 top-0 h-full w-56 hidden lg:block">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 600" fill="none">
          <line x1="100" y1="80" x2="100" y2="170" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1="100" y1="220" x2="100" y2="300" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" />
          <circle cx="100" cy="175" r="10" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
          <text x="100" y="180" textAnchor="middle" fontSize="10" fill="#9ca3af">↕</text>
        </svg>

        {/* Competitor Research Agent */}
        <div className="absolute top-8 right-0 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-48">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">CR</div>
          <div>
            <p className="text-xs font-medium text-gray-700 leading-tight">Competitor Research Agent</p>
            <div className="h-1.5 bg-purple-100 rounded-full w-16 mt-1" />
          </div>
        </div>

        {/* Lightning node */}
        <div className="absolute top-36 right-8 w-9 h-9 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center">
          <span className="text-purple-500 text-sm">⚡</span>
        </div>

        {/* monday node */}
        <div className="absolute top-56 right-4 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-40">
          <div className="w-5 h-5 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" fill="#F6C244" />
              <rect x="15" y="1" width="12" height="12" rx="2" fill="#FF3D57" />
              <rect x="1" y="15" width="12" height="12" rx="2" fill="#00CA72" />
              <rect x="15" y="15" width="12" height="12" rx="2" fill="#A358DF" />
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-teal-200 rounded-full w-14" />
            <div className="h-1.5 bg-gray-100 rounded-full w-10" />
          </div>
        </div>

        {/* Create project plan */}
        <div className="absolute top-80 right-2 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-44">
          <svg width="14" height="14" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
            <rect x="1" y="1" width="12" height="12" rx="2" fill="#F6C244" />
            <rect x="15" y="1" width="12" height="12" rx="2" fill="#FF3D57" />
            <rect x="1" y="15" width="12" height="12" rx="2" fill="#00CA72" />
            <rect x="15" y="15" width="12" height="12" rx="2" fill="#A358DF" />
          </svg>
          <p className="text-xs text-gray-600 font-medium">Create a project plan</p>
        </div>

        {/* Translator Agent */}
        <div className="absolute bottom-20 right-10 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-2 w-44">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs flex-shrink-0">TA</div>
          <div>
            <p className="text-xs font-medium text-gray-700 leading-tight">Translator Agent</p>
            <div className="h-1.5 bg-pink-100 rounded-full w-14 mt-1" />
          </div>
        </div>
      </div>

      {/* Center CTA */}
      <div className="relative z-10 text-center max-w-xl">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Ready to outpace everyone with the{" "}
          <span className="text-pink-500">best AI work platform?</span>
        </h2>
        <div className="flex items-center justify-center gap-4 mt-8">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition-colors text-sm shadow-sm">
            Get Started <span>→</span>
          </button>
          <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-full text-sm transition-colors">
            Contact sales
          </button>
        </div>
      </div>
    </section>
  );
}