const MOCK_NEWS = [
  {
    title: "New daily review streaks are live",
    summary:
      "Track how many days in a row you practiced and aim for a consistent rhythm.",
    date: "Today",
  },
  {
    title: "Create richer flashcards",
    summary:
      "Mix definition, cloze, and image cards in one box for better recall.",
    date: "2 days ago",
  },
  {
    title: "Learning tips",
    summary:
      "Short sessions beat long cramming. Try 10 minutes a day this week.",
    date: "Last week",
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

      <section className="grid gap-4 md:grid-cols-2">
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
