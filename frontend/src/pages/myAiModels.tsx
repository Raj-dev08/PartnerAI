import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAiBuilderStore } from "../store/useAi";
import { motion } from "framer-motion";

export default function MyAiPage() {
  const { myCreatedAi, getMyAiModels, deleteAiModel, loading } =
    useAiBuilderStore();

  const navigate = useNavigate();

  useEffect(() => {
    getMyAiModels();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Delete this AI model?");
    if (!confirm) return;
    await deleteAiModel(id);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <h1 className="text-3xl font-bold">My AI Models</h1>

        {!myCreatedAi?.length ? (
          <p className="text-neutral-500 text-sm">
            No AI models created yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCreatedAi.map((ai) => (
              <motion.div
                key={ai._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between hover:border-neutral-700 transition"
              >
                {/* HEADER */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {ai.maleName} / {ai.femaleName}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      {ai.aiType}
                    </p>
                  </div>

                  {/* VERIFIED BADGE */}
                  {ai.isVerified && (
                    <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded-md">
                      Verified
                    </span>
                  )}
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-neutral-300 mt-3 line-clamp-3">
                  {ai.description || "No description"}
                </p>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs">
                  <div>
                    <p className="text-neutral-400">Rating</p>
                    <p className="text-white font-medium">
                      ⭐ {ai.ratings.toFixed(1)}
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-400">Reviews</p>
                    <p className="text-white font-medium">
                      {ai.totalRated}
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-400">Age Difference</p>
                    <p className="text-white font-medium">
                      {ai.age}
                    </p>
                  </div>
                </div>

                {/* TRAITS */}
                <div className="mt-4 space-y-1 text-xs text-neutral-400">
                  <div>Humour: {ai.personalityTraits.humour}</div>
                  <div>Kindness: {ai.personalityTraits.kindness}</div>
                  <div>Confidence: {ai.personalityTraits.confidence}</div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => navigate(`/ai-model/update/${ai._id}`)}
                    className="flex-1 py-2 bg-white text-black rounded-lg text-sm hover:bg-neutral-200 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(ai._id)}
                    disabled={loading}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}