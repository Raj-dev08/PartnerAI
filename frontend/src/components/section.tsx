import ModelCard from "./modelCard";

const Section = ({ title, refEl, scroll, items, onLoadMore }: any) => {
  const handleScroll = () => {
    if (!refEl.current || !onLoadMore) return;

    const el = refEl.current;

    const isNearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;

    if (isNearEnd) {
      onLoadMore();
    }
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">

      {/* TITLE */}
      <h2 className="text-lg font-medium px-2">{title}</h2>

      {/* CAROUSEL */}
      <div className="relative group w-full">

        {/* LEFT */}
        <button
          onClick={() => scroll(refEl, "left")}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur-md w-10 h-10 rounded-full items-center justify-center"
        >
          ←
        </button>

        {/* RIGHT */}
        <button
          onClick={() => scroll(refEl, "right")}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur-md w-10 h-10 rounded-full items-center justify-center"
        >
          →
        </button>

        {/* SCROLL AREA */}
        <div
          ref={refEl}
          onScroll={handleScroll}   // 🔥 THIS IS THE FIX
          className="
            flex gap-4
            overflow-x-auto
            overflow-y-hidden
            scroll-smooth
            snap-x snap-mandatory
            scrollbar-hide
            w-full
          "
        >
          {items.map((model: any) => (
            <div
              key={model._id}
              className="flex-shrink-0 w-[160px] sm:w-[220px] snap-start"
            >
              <ModelCard model={model} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Section;