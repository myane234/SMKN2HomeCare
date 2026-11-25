"use client";

import { Children, useState } from "react";

export default function LoadMore({
  children,
  initialCount = 9,
  increment = 9,
  buttonLabel = "Muat Lainnya",
  itemLabel = "data",
  containerClassName = "",
}) {
  const items = Children.toArray(children);

  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleItems = items.slice(0, visibleCount);
  const remaining = items.length - visibleItems.length;

  function handleLoadMore() {
    setVisibleCount((current) =>
      Math.min(current + increment, items.length)
    );
  }

  return (
    <>
      <div className={containerClassName}>
        {visibleItems}
      </div>

      {remaining > 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <p className="mb-4 text-sm text-slate-500">
            Masih ada{" "}
            <span className="font-semibold text-slate-800">
              {remaining} {itemLabel}
            </span>{" "}
            lainnya.
          </p>

          <button
            type="button"
            onClick={handleLoadMore}
            className="inline-flex min-w-56 items-center justify-center rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            {buttonLabel}
          </button>

          <p className="mt-3 text-xs text-slate-400">
            Menampilkan {visibleItems.length} dari {items.length} {itemLabel}
          </p>
        </div>
      )}
    </>
  );
}