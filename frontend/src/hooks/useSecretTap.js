import { useCallback, useRef } from 'react';

export function useSecretTap(targetCount = 5, maxDelayMs = 650, onTrigger) {
  const tapRef = useRef({ count: 0, lastTap: 0 });

  return useCallback(() => {
    const now = Date.now();
    const diff = now - tapRef.current.lastTap;
    const nextCount = diff < maxDelayMs ? tapRef.current.count + 1 : 1;
    if (nextCount >= targetCount) {
      tapRef.current = { count: 0, lastTap: 0 };
      onTrigger?.();
    } else {
      tapRef.current = { count: nextCount, lastTap: now };
    }
  }, [targetCount, maxDelayMs, onTrigger]);
}
