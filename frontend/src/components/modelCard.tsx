import { motion } from "framer-motion";
import { useAiModelStore } from "../store/useChooseAi";

export default function ModelCard({ model , user}: any) {
  const { setAIModel, rateAIModel } = useAiModelStore();

  const isEligible =
    model.eligibleRater?.includes(user?._id) ; //anyone can rate for now as its not the top priority

  const handleRate = async () => {
    if (!isEligible) return;
    const rating = prompt("Rate this AI (1–5)");
    if (!rating) return;

    const num = Number(rating);
    if (num < 1 || num > 5) return;

    await rateAIModel(model._id, num);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative group rounded-xl overflow-hidden cursor-pointer"
    >
      <div className="h-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col justify-between transition">

        <div>
          {/* TITLE */}
          <h3 className="text-base font-semibold">
            {model.maleName} / {model.femaleName} / {model.otherName}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            {model.description || "No description"}
          </p>

          {/* OWNER */}
          {model.madeBy && (
            <p className="text-[10px] text-neutral-500 mt-1">
              Made by {model.madeBy?.name || "Unknown"}
            </p>
          )}

          {/* METRICS */}
          <div className="flex justify-between text-xs text-neutral-400 mt-3">
            <span>⭐ {model.ratings?.toFixed(1) || 0}</span>
            <span>🔥 {model.totalRated}+ reviews</span>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div className="mt-4 flex gap-2 justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              let suc = setAIModel(model._id)
              if(!suc) return
              setTimeout(() => {
                window.location.reload();
              }, 500); // delay in ms
            }}
            className="flex-1 py-2 text-sm bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition"
          >
            Select
          </motion.button>

          {isEligible && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRate}
              className="flex-1 px-3 py-2 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
            >
              Rate
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}