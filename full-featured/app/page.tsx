import { RealtimeChat } from "@/components/realtime/RealtimeChat";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          01 · 03 · agent audio visualizer
        </p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Build a baseline Realtime audio chat with text handoff
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          This page pairs the Realtime API with a lightweight UI so you can talk
          to your agent, send text prompts, inspect transport events, and
          iterate on prompts quickly.
        </p>
      </section>
      <RealtimeChat />
    </main>
  );
}
