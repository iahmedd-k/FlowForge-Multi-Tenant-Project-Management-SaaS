import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";

const suggestions = [
  "Create a project plan",
  "Research venues for conference",
  "Analyze sales pipeline",
];

// Typing animation component
const TypingIndicator = () => (
  <div className="flex items-center gap-1">
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 0.6, repeat: Infinity }}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
  </div>
);

export default function AICapabilities() {
  const [messages, setMessages] = useState<{ type: "user" | "ai"; text: string; isTyping?: boolean }[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const handleSuggestion = (suggestion: string) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setDisplayedText("");

    // Add user message
    const userMsg = suggestion;
    setMessages((prev) => [...prev, { type: "user", text: userMsg, isTyping: true }]);

    // Simulate typing the user message
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m, idx) =>
          idx === prev.length - 1 ? { ...m, isTyping: false } : m
        )
      );

      // Add AI response with typing animation
      setTimeout(() => {
        const aiResponse =
          "I'll help you with that right away. Let me gather the necessary information and create a plan for you.";
        setMessages((prev) => [...prev, { type: "ai", text: aiResponse, isTyping: true }]);

        // Animate AI typing
        let charIndex = 0;
        const typingInterval = setInterval(() => {
          if (charIndex <= aiResponse.length) {
            setDisplayedText(aiResponse.substring(0, charIndex));
            charIndex++;
          } else {
            clearInterval(typingInterval);
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === prev.length - 1 ? { ...m, isTyping: false } : m
              )
            );
            setIsAnimating(false);
          }
        }, 20);
      }, 600);
    }, 1200);
  };

  return (
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-white">
      <div className="container px-3 sm:px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Logo and Branding */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-sm leading-none">
                F
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                FlowForge <span className="font-normal text-gray-600 ml-1">AI</span>
              </span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
              Move work forward with<br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">a built-in AI assistant</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Accelerate your execution with an intelligent, context-aware AI assistant who thinks, recommends, and runs work for you at scale.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <button className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-shadow">
              Get Started
            </button>
            <button className="text-gray-700 font-semibold hover:text-gray-900 flex items-center gap-1 transition-colors">
              Learn more <span>→</span>
            </button>
          </motion.div>

          {/* Chat Interface Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto"
          >
            {/* Decorative orb */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="absolute -top-6 right-6 w-20 h-20 rounded-full overflow-hidden z-20 pointer-events-none"
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, #ff6b9d, #ffd700, #00e5ff, #a855f7, #ff6b9d)",
                  filter: "blur(2px)",
                  transform: "scale(1.1)",
                }}
              />
            </motion.div>

            {/* Card background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-2xl" />

            {/* Main card */}
            <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-2xl">
              <div className="p-6 sm:p-8">
                {/* Input area at top */}
                <div className="mb-6">
                  <p className="text-gray-500 text-sm mb-4">Hey James, how can I help you today?</p>
                  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3 text-gray-400">
                      <button className="hover:text-gray-600 transition-colors text-lg">@</button>
                      <button className="hover:text-gray-600 transition-colors text-lg">+</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                        </svg>
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50"
                        disabled={isAnimating}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="mb-6 h-48 sm:h-56 overflow-y-auto space-y-4 rounded-2xl bg-gray-50 p-4 border border-gray-100">
                  <AnimatePresence mode="wait">
                    {messages.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        {messages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                                msg.type === "user"
                                  ? "bg-blue-50 text-blue-800 border border-blue-100 rounded-br-none"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                              }`}
                            >
                              {msg.isTyping && msg.type === "ai" ? (
                                <TypingIndicator />
                              ) : msg.type === "ai" && idx === messages.length - 1 ? (
                                <span>
                                  {displayedText}
                                  {isAnimating && <span className="animate-pulse">▍</span>}
                                </span>
                              ) : (
                                <span>{msg.text}</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  {suggestions.map((s, idx) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleSuggestion(s)}
                      disabled={isAnimating}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>

                {/* User message at bottom */}
                <AnimatePresence>
                  {messages.length > 0 && messages[0].type === "user" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex items-center justify-between gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-100"
                    >
                      <span className="text-sm font-medium text-blue-800">{messages[0].text}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                        JD
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}