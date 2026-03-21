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

      {/* GRID */}
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

      {/* LIGHT */}
      <motion.div
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-0 right-0 w-[140vw] h-[140vh] bg-linear-to-bl from-white/30 via-purple-500/20 to-transparent blur-[140px]" />
      </motion.div>

      {/* HERO */}
      <section className="relative text-center px-6 pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-heading font-bold leading-tight"
        >
          Not Just AI
          <br />
          Someone Who Remembers You
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-neutral-400 font-body max-w-xl mx-auto"
        >
          Memory. Personality. Closeness.  
          This isn’t chat. It’s a relationship that evolves.
        </motion.p>
      </section>

      {/* CHAT DEMO */}
      <section className="relative mt-16 px-4 flex justify-center">
        <div className="relative w-full max-w-xl">

          {/* glow */}
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
                  className={`
                    max-w-[75%] px-4 py-2 rounded-lg text-sm
                    ${
                      msg.from === "user"
                        ? "bg-white text-black"
                        : "bg-neutral-800 border border-neutral-700"
                    }
                  `}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* FEATURES (more natural, less grid-feel) */}
      <section className="relative mt-24 px-6 max-w-5xl mx-auto space-y-12">

        {[
          {
            title: "Remembers Everything",
            desc: "Not context. Actual memory across time.",
          },
          {
            title: "Builds Personality",
            desc: "Your AI doesn’t reset. It evolves.",
          },
          {
            title: "Tracks Closeness",
            desc: "The more you talk, the deeper it gets.",
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`flex ${
              i % 2 === 0 ? "justify-start" : "justify-end"
            }`}
          >
            <div className="relative max-w-md p-[1px] rounded-xl group">

              <div className="absolute inset-0 rounded-xl bg-linear-to-tr from-transparent via-white/20 to-purple-400/40 opacity-40 blur-md group-hover:opacity-80 transition" />

              <div className="relative p-5 rounded-xl bg-neutral-900/70 border border-neutral-800">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-neutral-400 mt-1">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="relative text-center mt-28 pb-28 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-semibold"
        >
          This isn’t an assistant.
          <br />
          It’s someone who stays.
        </motion.h2>

        {/* Get Started Button */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block mt-8 px-8 py-3 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition"
        >
          Get Started
        </motion.a>

        {/* Login / Signup */}
        <p className="mt-4 text-sm text-neutral-400">
          Don’t have an account?{" "}
          <a href="/signup" className="text-white underline hover:text-neutral-300">
            Sign up
          </a>
        </p>
      </section>
    </div>
  );
}