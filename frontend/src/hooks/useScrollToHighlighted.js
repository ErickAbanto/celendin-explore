import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollToHighlighted(deps = [], offsetY = 12) {
  const scrollRef = useRef(null);
  const yMapRef = useRef({});
  const [pendingTargetId, setPendingTargetId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    if (!highlightedId) return undefined;
    const timer = setTimeout(() => setHighlightedId(null), 2800);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  useEffect(() => {
    if (!pendingTargetId) return undefined;
    const y = yMapRef.current[pendingTargetId];
    if (typeof y !== 'number') return undefined;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - offsetY),
        animated: true,
      });
      setPendingTargetId(null);
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTargetId, offsetY, ...deps]);

  const registerItemY = useCallback(
    (id, y) => {
      yMapRef.current[id] = y;
      if (pendingTargetId === id) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - offsetY),
            animated: true,
          });
          setPendingTargetId(null);
        }, 80);
      }
    },
    [pendingTargetId, offsetY]
  );

  const resetYMap = useCallback(() => {
    yMapRef.current = {};
  }, []);

  const clearHighlight = useCallback(() => {
    setPendingTargetId(null);
    setHighlightedId(null);
  }, []);

  return {
    scrollRef,
    pendingTargetId,
    setPendingTargetId,
    highlightedId,
    setHighlightedId,
    registerItemY,
    resetYMap,
    clearHighlight,
  };
}
