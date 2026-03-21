import ModelCard from "./modelCard";

const Section = ({ title, refEl, scroll, items }: any) => {
  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>

        <div className="flex gap-2">
          <button
            onClick={() => scroll(refEl, "left")}
            className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded"
          >
            ←
          </button>
          <button
            onClick={() => scroll(refEl, "right")}
            className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={refEl}
        className="flex gap-4 overflow-x-hidden scroll-smooth"
      >
        {items.map((model: any) => (
          <div key={model._id} className="min-w-[260px]">
            <ModelCard model={model} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Section;