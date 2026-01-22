const MOCK_NEWS = [
  {
    title: "How learning works here",
    summary:
      "Create boxes, add flashcards, and activate groups to start reviews. Each correct answer promotes the card to the next level with longer intervals; wrong answers reset it for immediate practice. Visit Study to work through ready cards, and use Activity to track progress.",
    date: "Guide",
  },
];

export default function PanelPage() {
  return (
    <>
      <header className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">
          Home
        </span>
        <h1 className="mt-3 text-3xl font-semibold">
          Welcome back to your learning space.
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Here is the latest news and guidance to keep your practice on track.
        </p>
      </header>

      <section className="grid gap-4">
        {MOCK_NEWS.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              {item.date}
            </div>
            <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-white/70">{item.summary}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Next up</h2>
        <p className="mt-2 text-sm text-white/70">
          Hook this area to upcoming practice sessions or reminders from the
          backend.
        </p>
      </section>
    </>
  );
}
