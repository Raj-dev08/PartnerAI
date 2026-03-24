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
    searchHasMore,
    forYouHasMore,
    getAIModels,
    getAIModelsForMe,
    searchAIModels,
  } = useAiModelStore();

  const { user } = useAuthStore();

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [forYouPage, setForYouPage] = useState(1);

  const [loadingMore, setLoadingMore] = useState(false);

  const exploreRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);

  const isSearching = search.trim().length > 0;

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    getAIModels({ page: 1, limit: 10 });
    getAIModelsForMe({ page: 1, limit: 10 });
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchPage(1);
      searchAIModels({ query: search, page: 1, limit: 10 });
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  /* ================= SCROLL HANDLER ================= */
  const handleLoadMore = async (type: "explore" | "search" | "forYou") => {
    if (loadingMore) return;

    setLoadingMore(true);

    try {
      if (type === "search") {
        if (!searchHasMore) return;

        const next = searchPage + 1;
        setSearchPage(next);
        await searchAIModels({ query: search, page: next, limit: 10 });
      }

      if (type === "explore") {
        if (!hasMore) return;

        const next = page + 1;
        setPage(next);
        await getAIModels({ page: next, limit: 10 });
      }

      if (type === "forYou") {
        if (!forYouHasMore) return;

        const next = forYouPage + 1;
        setForYouPage(next);
        await getAIModelsForMe({ page: next, limit: 10 });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  /* ================= SCROLL BUTTON ================= */
  const scroll = (ref: any, dir: "left" | "right", title: string) => {
    if (!ref.current) return;

    if(dir === 'right'){
      if(title === 'For You'){
        console.log("hit",forYouHasMore,forYouPage)
        if(!loadingMore && forYouHasMore){
          const next = forYouPage + 1;
          setForYouPage(next);
          console.log(forYouPage)
          getAIModelsForMe({ page: next, limit: 10 });
          console.log(forYouModels)
        }
      }
      if(title ==='Explore'){
        if(!loadingMore && hasMore){
          const next = page + 1;
          setPage(next);
          getAIModels({ page: next, limit: 10 });
        }
      }

      if(title ==='Search'){
        if(!loadingMore && searchHasMore){
          const next = searchPage + 1;
          setSearchPage(next);
          searchAIModels({ query: search,page: next, limit: 10 });
        }
      }
    }
    ref.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

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
          searchResults.length > 0 ? (
            <Section
              title="Search"
              refEl={exploreRef}
              scroll={scroll}
              items={searchResults}
              onLoadMore={() => handleLoadMore("search")}
            />
          ) : (
            <p className="text-neutral-500 text-sm text-center py-10">
              No models found
            </p>
          )
        ) : (
          <>
            {!user?.AiModel && <EmptyState />}
            {/* FOR YOU */}
            {forYouModels.length > 0 && (
              <Section
                title="For You"
                refEl={forYouRef}
                scroll={scroll}
                items={forYouModels}
                onLoadMore={() => handleLoadMore("forYou")}
              />
            )} 

            {/* EXPLORE */}
            {aiModels.length > 0 ? (
              <Section
                title="Explore"
                refEl={exploreRef}
                scroll={scroll}
                items={aiModels}
                onLoadMore={() => handleLoadMore("explore")}
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