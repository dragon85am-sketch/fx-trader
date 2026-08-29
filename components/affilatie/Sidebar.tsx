export function Sidebar() {
  const educationItems = ['FX Trade Academy', 'Setupy', 'Materiały bonusowe'];
  const affiliateItems = ['Dashboard', 'Kampanie', 'Prowizje', 'Wypłaty', 'Materiały'];

  return (
    <aside className="hidden w-[320px] shrink-0 bg-[#050d1f] xl:block">
      <div className="m-5 rounded-[30px] border border-white/10 bg-gradient-to-b from-[#09142a] to-[#071122] px-5 py-6 shadow-[0_0_50px_rgba(59,130,246,0.08)]">
        <div className="px-2">
          <div className="text-[30px] font-semibold tracking-wide text-white">FX TRADE</div>
          <div className="mt-1 text-sm text-white/55">Premium Panel</div>
        </div>

        <nav className="mt-8 space-y-2 text-[15px]">
          {['Dashboard', 'Journal'].map((item) => (
            <button
              key={item}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-white/78 transition hover:bg-white/5 hover:text-white"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span>{item}</span>
            </button>
          ))}

          {['Trading Room', 'Skaner rynku', 'Strategie'].map((item) => (
            <button
              key={item}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white/78 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span>{item}</span>
              </span>
              <span className="text-xs text-white/45">▾</span>
            </button>
          ))}

          <div className="rounded-[22px] bg-white/[0.04] p-2 shadow-[0_0_30px_rgba(59,130,246,0.08)] ring-1 ring-white/5">
            <button className="flex w-full items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-left text-white">
              <span className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                <span>Affiliate Hub</span>
              </span>
              <span className="text-xs text-white/55">▾</span>
            </button>

            <div className="ml-4 mt-2 border-l border-white/10 pl-4">
              {affiliateItems.map((item, idx) => (
                <button
                  key={item}
                  className={`mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    idx === 0
                      ? 'bg-gradient-to-r from-blue-500/35 to-blue-500/10 text-white shadow-[0_0_30px_rgba(59,130,246,0.18)]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 rounded-[22px] bg-white/[0.03] p-2 ring-1 ring-white/5">
            <button className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white/85">
              <span className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span>Education</span>
              </span>
              <span className="text-xs text-white/45">▾</span>
            </button>

            <div className="ml-4 mt-2 border-l border-white/10 pl-4">
              {educationItems.map((item, idx) => (
                <button
                  key={item}
                  className={`mt-2 flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm transition ${
                    idx === 0
                      ? 'bg-gradient-to-r from-blue-500/35 to-blue-500/10 text-white shadow-[0_0_30px_rgba(59,130,246,0.14)]'
                      : 'text-white/68 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {['Sesje live / Webinary', 'Ustawienia'].map((item) => (
            <button
              key={item}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-white/78 transition hover:bg-white/5 hover:text-white"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-6 text-white/72">
          <button className="flex w-full items-center rounded-2xl px-4 py-3 text-left transition hover:bg-white/5 hover:text-white">
            ← Strona główna
          </button>
          <button className="mt-2 flex w-full items-center rounded-2xl px-4 py-3 text-left font-medium transition hover:bg-white/5 hover:text-white">
            Wyloguj (demo)
          </button>
        </div>
      </div>
    </aside>
  );
}