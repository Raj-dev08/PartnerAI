import { useRef ,useEffect} from "react";
import ModelCard from "./modelCard";
import { useAuthStore } from "../store/useAuthStore";

const Section = ({ title, refEl, scroll, items, onLoadMore }: any) => {
  const loadingRef = useRef(false);
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  const handleScroll = () => {
    if (!refEl.current || !onLoadMore || loadingRef.current) return;

    const el = refEl.current;

    const isNearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;

    if (!isNearEnd) return;

    loadingRef.current = true;

    Promise.resolve(onLoadMore()).finally(() => {
      setTimeout(() => {
        loadingRef.current = false;
      }, 300); // small throttle
    });
  };


  return (
    <div className="space-y-4 w-full overflow-hidden">

      <h2 className="text-lg font-medium px-2">{title}</h2>

      <div className="relative group w-full">

        {/* LEFT */}
        <button
          onClick={() => scroll(refEl, "left",title)}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur-md w-10 h-10 rounded-full items-center justify-center"
        >
          ←
        </button>

        {/* RIGHT */}
        <button
          onClick={() => scroll(refEl, "right",title)}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur-md w-10 h-10 rounded-full items-center justify-center"
        >
          →
        </button>

        {/* SCROLL AREA */}
        <div
          ref={refEl}
          onScroll={handleScroll}
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
              <ModelCard model={model} user={user}/>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Section;