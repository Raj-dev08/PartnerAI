import { useEffect, useRef, useState } from "react";
import { useAiModelStore } from "../store/useChooseAi";
import { useAuthStore } from "../store/useAuthStore";
import Section from "../components/section";

export default function HomePage() {
  const {
    aiModels,
    forYouModels,
    searchResults,
    hasMore,
    searchAIModels,
    getAIModels,
    getAIModelsForMe,
  } = useAiModelStore();

  const { user } = useAuthStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const forYouRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    getAIModels({ page: 0, limit: 3 });
    getAIModelsForMe({ limit: 10 });
  }, []);

  // Search debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      searchAIModels(search);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  // 🔥 Button scroll (desktop only)
  const scroll = (ref: any, dir: "left" | "right") => {
    if (!ref.current) return;

    if (dir === "right") {
      if ( !loadingMore && hasMore) {
        setLoadingMore(true);

        setPage((prev) => {
          const next = prev + 1;
          getAIModels({ page: next, limit: 3 });
          return next;
        });

        setLoadingMore(false);
      }
    }

    ref.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  // 🔥 Mobile + trackpad scroll detection
  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current || loadingMore  || !hasMore) return;

    const el = ref.current;

    const isNearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;

    if (isNearEnd) {
      setLoadingMore(true);

      setPage((prev) => {
        const next = prev + 1;
        getAIModels({ page: next, limit: 3 });
        return next;
      });

      setLoadingMore(false);
    }
  };

  const isSearching = search.trim().length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 sm:px-6 py-10 max-w-screen mx-auto">

      <div className="max-w-6xl mx-auto space-y-12">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-neutral-500">
              Welcome back {user?.name}
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold">
              Your AI Space
            </h1>
          </div>

          <input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 bg-neutral-900 px-4 py-2 rounded-lg text-sm outline-none border border-neutral-800 focus:border-neutral-600 transition"
          />
        </div>

        {/* SEARCH MODE */}
        {isSearching ? (
          <>
            {searchResults.length > 0 ? (
              <Section
                title="Search"
                refEl={exploreRef}
                scroll={scroll}
                items={searchResults}
                onLoadMore={() => handleScroll(exploreRef)}
              />
            ) : (
              <p className="text-neutral-500 text-sm text-center py-10">
                No models found
              </p>
            )}
          </>
        ) : (
          <>
            {/* FOR YOU */}
            {forYouModels.length > 0 ? (
              <Section
                title="For You"
                refEl={forYouRef}
                scroll={scroll}
                items={forYouModels}
                onLoadMore={() => handleScroll(forYouRef)}
              />
            ) : (
              <EmptyState />
            )}

            {/* EXPLORE */}
            {aiModels.length > 0 ? (
              <Section
                title="Explore"
                refEl={exploreRef}
                scroll={scroll}
                items={aiModels}
                onLoadMore={() => handleScroll(exploreRef)}
              />
            ) : (
              <p className="text-neutral-500 text-sm text-center py-10">
                No models available
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================= EMPTY STATE ================= */

function EmptyState() {
  const { firstAIModel, loadingForSettingAi } = useAiModelStore();

  return (
    <div className="text-center py-14 border border-neutral-900 rounded-xl bg-neutral-900/40 space-y-4">
      <p className="text-neutral-400 text-sm">
        Don’t choose. Let it happen.
      </p>

      <p className="text-neutral-600 text-xs">
        Click below for ease of use
      </p>

      <button
        onClick={firstAIModel}
        disabled={loadingForSettingAi}
        className="px-5 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-95 disabled:opacity-60"
      >
        {loadingForSettingAi ? "Pairing..." : "Get Random AI"}
      </button>
    </div>
  );
}