import { motion } from "framer-motion";

const messages = [
  { from: "user", text: "Do you remember what I said yesterday?" },
  { from: "ai", text: "Yeah. You were stressed about work. You said you feel stuck." },
  { from: "user", text: "…and now?" },
  { from: "ai", text: "You sounded normal today. Something changed?" },
  { from: "user", text: "Maybe talking helped 🙃" },
  { from: "ai", text: "I’m here for that 😁" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden">

      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border border-white/10" />
          ))}
        </div>

        {/* floating dots */}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="absolute w-2 h-2 bg-purple-400/60 rounded-full"
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
            }}
          />
        ))}
      </div>

      {/* LIGHT GLOW */}
      <motion.div
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-0 right-0 w-[140vw] h-[140vh] bg-linear-to-bl from-white/30 via-purple-500/20 to-transparent blur-[140px]" />
      </motion.div>

      {/* HERO / STATUS */}
      <section className="relative text-center px-6 pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold font-heading leading-tight"
        >
          Starting Partner AI...
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-neutral-400 max-w-xl mx-auto text-sm font-body"
        >
          This app uses a backend that may take a few seconds to wake up.
          <br />
          Please wait — you’ll be automatically redirected once it's ready.
        </motion.p>

        {/* LOADING BAR */}
        <div className="mt-10 max-w-md mx-auto">
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
              className="h-full w-1/2 bg-gradient-to-r from-purple-400 to-white"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Waking up servers...
          </p>
        </div>
      </section>

      {/* CHAT DEMO */}
      <section className="relative mt-16 px-4 flex justify-center">
        <div className="relative w-full max-w-xl">

          <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-transparent via-white/20 to-purple-400/40 blur-md opacity-50" />

          <div className="relative p-6 rounded-2xl bg-neutral-900/70 backdrop-blur-xl border border-neutral-800 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4 }}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                    msg.from === "user"
                      ? "bg-white text-black"
                      : "bg-neutral-800 border border-neutral-700"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER / INFO */}
      <section className="relative mt-20 px-6 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-neutral-900/70 border border-neutral-800"
        >
          <h3 className="text-lg font-semibold font-body mb-2">
            What is Partner AI?
          </h3>

          <p className="text-sm text-neutral-400 leading-relaxed font-body">
            Partner AI is not a typical chatbot.
            <br />
            It is designed to build memory over time, develop a consistent personality, and adapt based on your interactions to create a more personalized experience.
            <br />
            Its behavior is intentionally human-like, aiming to simulate natural conversation and emotional continuity.
            <br />
            However, it is important to understand that this is still an AI system, not a real person. Any emotional attachment should be approached with awareness.
            <br /><br />
            Each AI instance is unique per user — meaning conversations evolve over time rather than reset between sessions.
          </p>

          <p className="mt-4 text-xs text-neutral-500">
            Note: Initial startup may take a few seconds due to server cold starts.
          </p>
        </motion.div>
      </section>

      {/* FOOT NOTE */}
      <section className="relative text-center mt-16 pb-16 px-6">
        <p className="text-xs text-neutral-600">
          You will be redirected automatically once everything is ready.
        </p>
      </section>

    </div>
  );
}