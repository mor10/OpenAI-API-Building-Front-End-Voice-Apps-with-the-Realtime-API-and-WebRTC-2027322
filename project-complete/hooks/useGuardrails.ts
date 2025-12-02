import { useCallback, useMemo } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { RealtimeItem, RealtimeSession } from "@openai/agents/realtime";

import { defaultGuardrails } from "@/lib/realtime/guardrails";
import type { SessionEventHandler } from "@/lib/realtime/event-handlers";

type UseGuardrailsOptions = {
  sessionRef: MutableRefObject<RealtimeSession | null>;
  setHistory: Dispatch<SetStateAction<RealtimeItem[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  suppressedItemIdsRef: MutableRefObject<Set<string>>;
  historyIndexRef: MutableRefObject<Map<string, number>>;
};

export function useGuardrails({
  sessionRef,
  setHistory,
  setError,
  setIsMuted,
  suppressedItemIdsRef,
  historyIndexRef,
}: UseGuardrailsOptions) {
  const guardrails = useMemo(() => defaultGuardrails, []);

  const handleGuardrailTripped = useCallback<
    SessionEventHandler["guardrail_tripped"]
  >(
    (details) => {
      if (guardrails.length === 0) {
        return;
      }

      const session = sessionRef.current;
      if (!session) return;

      try {
        session.interrupt();
        setIsMuted(true);
      } catch {
        // ignore interruption failures
      }

      try {
        const d = details as { itemId?: string } | undefined;
        const offendingId = d?.itemId;
        if (offendingId) {
          suppressedItemIdsRef.current.add(offendingId);
          setHistory((prev) =>
            prev.filter((h) => {
              const id = (h as { itemId?: string }).itemId;
              return id !== offendingId;
            })
          );
          const idxMap = new Map(historyIndexRef.current);
          idxMap.delete(offendingId);
          const rebuilt: Map<string, number> = new Map();
          const nextHistory = (session.history ?? []).filter((h) => {
            const id = (h as { itemId?: string }).itemId;
            return id !== offendingId;
          });
          nextHistory.forEach((h, i) => {
            const id = (h as { itemId?: string }).itemId;
            if (id) rebuilt.set(id, i);
          });
          historyIndexRef.current = rebuilt;
          const filtered = (session.history ?? []).filter((h) => {
            const id = (h as { itemId?: string }).itemId;
            return id !== offendingId;
          });
          session.updateHistory(filtered as RealtimeItem[]);
        }
      } catch (err) {
        console.warn(
          "Failed to remove offending item after guardrail trip",
          err
        );
      }

      setError("Response blocked by guardrails.");
    },
    [
      guardrails.length,
      historyIndexRef,
      sessionRef,
      setError,
      setHistory,
      setIsMuted,
      suppressedItemIdsRef,
    ]
  );

  return {
    guardrails,
    handleGuardrailTripped,
  };
}
