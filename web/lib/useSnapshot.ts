"use client";

import { useSyncExternalStore } from "react";
import type { DashboardSnapshot } from "@/lib/types";

interface SnapshotState {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
}

const store = createSnapshotStore();

function createSnapshotStore() {
  let state: SnapshotState = { snapshot: null, loading: true, error: null };
  const listeners = new Set<() => void>();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function setState(patch: Partial<SnapshotState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  async function fetchSnapshot() {
    try {
      const res = await fetch("/api/snapshot", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Snapshot failed (${res.status}): ${text}`);
      }
      const data: DashboardSnapshot = await res.json();
      setState({ snapshot: data, error: null, loading: false });
    } catch (err) {
      setState({
        error:
          err instanceof Error ? err.message : "Could not load dashboard data.",
        loading: false,
      });
    }
  }

  function start() {
    if (intervalId !== null) return;
    fetchSnapshot();
    intervalId = setInterval(fetchSnapshot, 10000);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      start();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
    getSnapshot() {
      return state;
    },
    refetch() {
      fetchSnapshot();
    },
  };
}

export function useDashboardSnapshot(): SnapshotState & { refetch: () => void } {
  const state = useSyncExternalStore(
    (callback) => store.subscribe(callback),
    () => store.getSnapshot(),
    () => store.getSnapshot()
  );
  return { ...state, refetch: () => store.refetch() };
}
