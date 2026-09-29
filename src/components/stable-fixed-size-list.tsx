import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { flushSync } from "react-dom";

// Experimental stand-in for react-window's FixedSizeList. Arborist's default
// container supplies its normal row, keyboard, selection, and DnD components.
// The slot key keeps the same row elements mounted as their item indices change.
export const FixedSizeList = forwardRef<any, any>(function StableFixedSizeList(props, ref) {
  const {
    children: Row,
    className,
    height,
    width,
    itemCount,
    itemSize,
    overscanCount = 2,
    outerElementType: Outer = "div",
    innerElementType: Inner = "div",
    outerRef,
    onScroll,
    onItemsRendered,
  } = props;
  const outer = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const previousOffset = useRef(0);
  const poolSize = Math.min(itemCount, Math.ceil(height / itemSize) + 2 * overscanCount);
  const start = Math.max(0, Math.min(itemCount - poolSize, Math.floor(scrollTop / itemSize) - overscanCount));
  const visibleStart = Math.min(itemCount - 1, Math.floor(scrollTop / itemSize));
  const visibleStop = Math.min(itemCount - 1, Math.floor((scrollTop + height - 1) / itemSize));

  useEffect(() => {
    if (itemCount > 0) {
      onItemsRendered?.({
        overscanStartIndex: start,
        overscanStopIndex: start + poolSize - 1,
        visibleStartIndex: visibleStart,
        visibleStopIndex: visibleStop,
      });
    }
  }, [itemCount, onItemsRendered, poolSize, start, visibleStart, visibleStop]);

  useImperativeHandle(ref, () => ({
    scrollTo(offset: number) {
      if (outer.current) outer.current.scrollTop = offset;
    },
    scrollToItem(index: number, align = "smart") {
      const element = outer.current;
      if (!element) return;
      const rowTop = index * itemSize;
      const rowBottom = rowTop + itemSize;
      if (align === "start") element.scrollTop = rowTop;
      else if (align === "end") element.scrollTop = rowBottom - height;
      else if (align === "center") element.scrollTop = rowTop - (height - itemSize) / 2;
      else if (rowTop < element.scrollTop) element.scrollTop = rowTop;
      else if (rowBottom > element.scrollTop + height) element.scrollTop = rowBottom - height;
    },
  }), [height, itemSize]);

  const setOuterRef = (element: HTMLDivElement | null) => {
    outer.current = element;
    if (typeof outerRef === "function") outerRef(element);
    else if (outerRef) outerRef.current = element;
  };

  return (
    <Outer
      ref={setOuterRef}
      className={className}
      style={{ position: "relative", height, width, overflow: "auto" }}
      onScroll={(event: React.UIEvent<HTMLDivElement>) => {
        const next = event.currentTarget.scrollTop;
        // Position recycled rows before the browser paints a scrollbar jump.
        flushSync(() => setScrollTop(next));
        onScroll?.({
          scrollDirection: next >= previousOffset.current ? "forward" : "backward",
          scrollOffset: next,
          scrollUpdateWasRequested: false,
        });
        previousOffset.current = next;
      }}
    >
      <Inner style={{ height: itemCount * itemSize, width: "100%" }}>
        {Array.from({ length: poolSize }, (_, slot) => {
          const index = start + slot;
          return <Row key={slot} index={index} style={{ position: "absolute", left: 0, top: index * itemSize, height: itemSize, width: "100%" }} />;
        })}
      </Inner>
    </Outer>
  );
});
