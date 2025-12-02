import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from "react";
import type {
  RealtimeItem,
  RealtimeSessionEventTypes,
  TransportEvent,
} from "@openai/agents/realtime";
import type { RealtimeAppConfig } from "@/config/realtime.config";

export type SessionEventHandler = {
  [K in keyof RealtimeSessionEventTypes]: (
    ...args: RealtimeSessionEventTypes[K]
  ) => void;
};

type EventHandlerFactoryArgs = {
  config: Pick<RealtimeAppConfig, "eventLogSize">;
  setHistory: Dispatch<SetStateAction<RealtimeItem[]>>;
  setEvents: Dispatch<SetStateAction<TransportEvent[]>>;
  setIsListening: Dispatch<SetStateAction<boolean>>;
  suppressedItemIdsRef: MutableRefObject<Set<string>>;
  historyIndexRef: MutableRefObject<Map<string, number>>;
};

export function createRealtimeEventHandlers({
  config,
  setHistory,
  setEvents,
  setIsListening,
  suppressedItemIdsRef,
  historyIndexRef,
}: EventHandlerFactoryArgs) {
  const handleHistoryUpdated: SessionEventHandler["history_updated"] = (
    updatedHistory
  ) => {
    const filtered = updatedHistory.filter((h) => {
      const id = (h as { itemId?: string }).itemId;
      return !id || !suppressedItemIdsRef.current.has(id);
    });
    setHistory(filtered);
    const idx = new Map<string, number>();
    filtered.forEach((h, i) => {
      const id = (h as { itemId?: string }).itemId;
      if (id) idx.set(id, i);
    });
    historyIndexRef.current = idx;
  };

  const handleTransportEvent: SessionEventHandler["transport_event"] = (
    event
  ) => {
    setEvents((prev) => {
      const next = [...prev, event];
      if (next.length > config.eventLogSize) {
        return next.slice(next.length - config.eventLogSize);
      }
      return next;
    });

    try {
      const e: TransportEvent = event;
      if (e.type === "input_audio_buffer.speech_started") {
        setIsListening(true);
      }
      if (e.type === "input_audio_buffer.speech_stopped") {
        setIsListening(false);
      }
      if (e.type === "conversation.item.created" && e.item) {
        const item = e.item as RealtimeItem;
        const id = (item as { itemId?: string }).itemId;
        if (id && suppressedItemIdsRef.current.has(id)) return;
        setHistory((prev) => {
          const idxMap = new Map(historyIndexRef.current);
          const next = [...prev, item];
          const newIndex = next.length - 1;
          if (id) idxMap.set(id, newIndex);
          historyIndexRef.current = idxMap;
          return next;
        });
        return;
      }
      if (
        (e.type === "conversation.item.updated" ||
          e.type === "conversation.item.completed") &&
        e.item
      ) {
        const item = e.item as RealtimeItem;
        const id = (item as { itemId?: string }).itemId;
        if (id && suppressedItemIdsRef.current.has(id)) return;
        const idx = id ? historyIndexRef.current.get(id) : undefined;
        if (typeof idx === "number") {
          setHistory((prev) => {
            const next = [...prev];
            next[idx] = item;
            return next;
          });
        } else {
          setHistory((prev) => {
            const idxMap = new Map(historyIndexRef.current);
            const next = [...prev, item];
            const newIndex = next.length - 1;
            if (id) idxMap.set(id, newIndex);
            historyIndexRef.current = idxMap;
            return next;
          });
        }
        return;
      }
      if (e.type === "conversation.item.deleted" && e.item) {
        const item = e.item as RealtimeItem;
        const id = (item as { itemId?: string }).itemId;
        if (!id) return;
        const idx = historyIndexRef.current.get(id);
        if (typeof idx === "number") {
          setHistory((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            const idxMap = new Map(historyIndexRef.current);
            idxMap.delete(id);
            next.forEach((h, i) => {
              const hid = (h as { itemId?: string }).itemId;
              if (hid) idxMap.set(hid, i);
            });
            historyIndexRef.current = idxMap;
            return next;
          });
        }
        return;
      }
    } catch (err) {
      console.warn("Incremental history update failed; ignoring", err);
    }
  };

  return {
    handleHistoryUpdated,
    handleTransportEvent,
  };
}
