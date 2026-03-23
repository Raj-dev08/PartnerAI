import { motion } from "framer-motion";
import { useAiModelStore } from "../store/useChooseAi";

export default function ModelCard({ model }: any) {
  const { setAIModel } = useAiModelStore();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative group rounded-xl overflow-hidden cursor-pointer"
    >
      {/* CARD */}
      <div className="h-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col justify-between transition">

        <div>
          {/* TITLE */}
          <h3 className="text-base font-semibold">
            {model.maleName} /{ model.femaleName }/ { model.otherName}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            {model.description || "No description"}
          </p>

          {/* METRICS */}
          <div className="flex justify-between text-xs text-neutral-400 mt-3">
            <span>⭐ {model.ratings?.toFixed(1) || 0}</span>
            <span>🔥{model.totalRated}+ reviews </span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setAIModel(model._id)}
          className="mt-4 py-2 text-sm bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition"
        >
          Select
        </motion.button>
      </div>
    </motion.div>
  );
}