import { motion } from "framer-motion";
import { useAiModelStore } from "../store/useChooseAi";

export default function ModelCard({ model }: any) {
  const { setAIModel } = useAiModelStore();

  return (
    <div className="relative p-[1px] rounded-xl group">

      {/* glow */}
      <div className="absolute inset-0 rounded-xl bg-linear-to-tr from-transparent via-white/20 to-purple-400/40 opacity-40 blur-md group-hover:opacity-80 transition" />

      {/* card */}
      <div className="relative p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-xl h-full flex flex-col justify-between">

        <div>
          <h3 className="text-lg font-semibold">
            {model.maleName || model.femaleName || model.otherName}
          </h3>

          <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
            {model.description || "No description"}
          </p>

          <div className="flex gap-2 mt-3 flex-wrap text-xs text-neutral-400">
            <span>⭐ {model.ratings.toFixed(1)}</span>
            <span>🧠 {model.aiType}</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => setAIModel(model._id)}
          className="mt-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
        >
          Select
        </motion.button>
      </div>
    </div>
  );
}