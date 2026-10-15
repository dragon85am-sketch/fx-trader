import { cookies } from "next/headers";

import { redirect } from "next/navigation";

import Image from "next/image";

import Link from "next/link";

import LanguageSwitcher from "@/components/LanguageSwitcher";



import {

  ArrowRight,

  BarChart3,

  BookOpen,

  BrainCircuit,

  Crown,

  GraduationCap,

  Headphones,

  LockKeyhole,

  Radar,

  ShieldCheck,

  Target,

  TrendingUp,

  User,

  Users,

  Zap,

} from "lucide-react";





type HomeLang = "pl" | "en" | "de" | "nl" | "es";



const HOME_COPY: Record<HomeLang, Record<string, string>> = {

  pl: {

    features: "Funkcje", scannerNav: "Skaner Rynku", scannerShort: "Skaner", strategies: "Strategie", education: "Edukacja", pricing: "Cennik", about: "O nas", login: "Zaloguj się",

    buyShort: "Kup dostęp", buyRest: " do platformy", buyFull: "Kup dostęp do platformy", badge: "Profesjonalna platforma tradingowa",

    hero1: "Analizuj rynek.", hero2: "Znajduj setupy.", hero3: "Handluj według planu.", heroDesc: "Zaawansowane narzędzia do analizy rynku, wyszukiwania potencjalnych strategii i ustrukturyzowanej edukacji handlowej w jednym profesjonalnym środowisku.",

    f1t:"Skanuj rynek", f1d:"Wyszukuj potencjalne setupy na wielu instrumentach i interwałach.", f2t:"Analizuj dokładnie", f2d:"Profesjonalne wykresy, wskaźniki i analiza wielu interwałów.", f3t:"Zarządzaj ryzykiem", f3d:"Planuj transakcję, poziomy SL/TP i kontroluj ryzyko.", f4t:"Rozwijaj się", f4d:"Edukacja, strategie i materiały wspierające rozwój.",

    fullAccess:"Pełny dostęp do wszystkich narzędzi", register:"Zarejestruj się", registerSub:"Utwórz konto i wybierz dostęp", trust1:"Profesjonalne narzędzia", trust2:"Skanery i wykresy", trust3:"Strategie i edukacja",

    stat1:"Skanerów rynku", stat2:"Instrumentów", stat3:"Dostęp do platformy", stat4:"Strategii i narzędzi", community:"Społeczność", traders:"Traderów",

    cardScannerDesc:"Skanuj wiele instrumentów w czasie rzeczywistym i filtruj potencjalne setupy.", openScanner:"Otwórz skaner", cardChartsDesc:"Profesjonalne wykresy, wskaźniki, rysowanie i analiza wielu interwałów.", openCharts:"Otwórz wykresy", harmonicDesc:"Automatyczne wykrywanie Gartley, Bat, Butterfly, Crab i Shark.", openHarmonic:"Otwórz harmonic", strategyDesc:"Sprawdzone modele z zasadami, checklistami i przykładami transakcji.", seeStrategies:"Zobacz strategie", educationDesc:"Rozwijaj umiejętności dzięki kursom, webinarom i poradnikom.", openEducation:"Otwórz edukację",

    security:"Bezpieczeństwo", securityDesc:"Bezpieczny dostęp do platformy i Twoich danych.", speed:"Szybkość", speedDesc:"Dostęp do narzędzi i danych w jednym miejscu.", reliability:"Niezawodność", reliabilityDesc:"Stabilne środowisko stworzone dla traderów.", support:"Wsparcie 24/7", supportDesc:"Jesteśmy tu dla Ciebie przez całą dobę.",

    ctaTitle:"Gotowy na kolejny poziom tradingu?", ctaDesc:"Dołącz do traderów korzystających z profesjonalnych narzędzi, strategii i wiedzy, aby podejmować bardziej świadome decyzje każdego dnia.",

    disclaimer:"Dostęp do Platformy Edukacyjnej FX Trade Professional Trading obejmuje kurs tradingu, strategie rynkowe, dashboard analityczny oraz narzędzia wspierające proces analizy i podejmowania samodzielnych decyzji tradingowych. Produkt ma charakter wyłącznie edukacyjny i informacyjny. Nie stanowi porady inwestycyjnej ani rekomendacji finansowej. Trading na rynkach finansowych wiąże się z ryzykiem utraty kapitału.", terms:"Regulamin", privacy:"Polityka prywatności", contact:"Kontakt"

  },

  en: {

    features:"Features", scannerNav:"Market Scanner", scannerShort:"Scanner", strategies:"Strategies", education:"Education", pricing:"Pricing", about:"About us", login:"Log in", buyShort:"Get access", buyRest:" to the platform", buyFull:"Get platform access", badge:"Professional trading platform",

    hero1:"Analyze the market.", hero2:"Find setups.", hero3:"Trade with a plan.", heroDesc:"Advanced tools for market analysis, finding potential strategies and structured trading education in one professional environment.",

    f1t:"Scan the market", f1d:"Find potential setups across multiple instruments and timeframes.", f2t:"Analyze precisely", f2d:"Professional charts, indicators and multi-timeframe analysis.", f3t:"Manage risk", f3d:"Plan trades, SL/TP levels and keep risk under control.", f4t:"Keep developing", f4d:"Education, strategies and materials that support your development.",

    fullAccess:"Full access to all tools", register:"Register", registerSub:"Create an account and choose access", trust1:"Professional tools", trust2:"Scanners and charts", trust3:"Strategies and education",

    stat1:"Market scanners", stat2:"Instruments", stat3:"Platform access", stat4:"Strategies and tools", community:"Community", traders:"Traders",

    cardScannerDesc:"Scan multiple instruments in real time and filter potential setups.", openScanner:"Open scanner", cardChartsDesc:"Professional charts, indicators, drawing tools and multi-timeframe analysis.", openCharts:"Open charts", harmonicDesc:"Automatic detection of Gartley, Bat, Butterfly, Crab and Shark patterns.", openHarmonic:"Open harmonic", strategyDesc:"Proven models with rules, checklists and trade examples.", seeStrategies:"View strategies", educationDesc:"Develop your skills with courses, webinars and guides.", openEducation:"Open education",

    security:"Security", securityDesc:"Secure access to the platform and your data.", speed:"Speed", speedDesc:"Tools and market data available in one place.", reliability:"Reliability", reliabilityDesc:"A stable environment built for traders.", support:"24/7 Support", supportDesc:"We are here for you around the clock.",

    ctaTitle:"Ready to take your trading further?", ctaDesc:"Join traders using professional tools, strategies and knowledge to make more informed decisions every day.",

    disclaimer:"Access to the FX Trade Professional Trading Educational Platform includes a trading course, market strategies, an analytical dashboard and tools supporting independent market analysis and trading decisions. The product is for educational and informational purposes only. It does not constitute investment advice or a financial recommendation. Trading financial markets involves risk of capital loss.", terms:"Terms", privacy:"Privacy Policy", contact:"Contact"

  },

  de: {

    features:"Funktionen", scannerNav:"Marktscanner", scannerShort:"Scanner", strategies:"Strategien", education:"Bildung", pricing:"Preise", about:"Über uns", login:"Anmelden", buyShort:"Zugang kaufen", buyRest:"", buyFull:"Plattformzugang kaufen", badge:"Professionelle Trading-Plattform",

    hero1:"Markt analysieren.", hero2:"Setups finden.", hero3:"Nach Plan handeln.", heroDesc:"Fortschrittliche Werkzeuge für Marktanalyse, das Finden potenzieller Strategien und strukturierte Trading-Ausbildung in einer professionellen Umgebung.",

    f1t:"Markt scannen", f1d:"Potenzielle Setups auf mehreren Instrumenten und Zeitrahmen finden.", f2t:"Präzise analysieren", f2d:"Professionelle Charts, Indikatoren und Multi-Timeframe-Analyse.", f3t:"Risiko steuern", f3d:"Trades, SL/TP-Niveaus planen und das Risiko kontrollieren.", f4t:"Weiterentwickeln", f4d:"Ausbildung, Strategien und Materialien für deine Entwicklung.",

    fullAccess:"Voller Zugriff auf alle Werkzeuge", register:"Registrieren", registerSub:"Konto erstellen und Zugang wählen", trust1:"Professionelle Werkzeuge", trust2:"Scanner und Charts", trust3:"Strategien und Bildung",

    stat1:"Marktscanner", stat2:"Instrumente", stat3:"Plattformzugang", stat4:"Strategien und Werkzeuge", community:"Community", traders:"Trader",

    cardScannerDesc:"Mehrere Instrumente in Echtzeit scannen und potenzielle Setups filtern.", openScanner:"Scanner öffnen", cardChartsDesc:"Professionelle Charts, Indikatoren, Zeichenwerkzeuge und Multi-Timeframe-Analyse.", openCharts:"Charts öffnen", harmonicDesc:"Automatische Erkennung von Gartley-, Bat-, Butterfly-, Crab- und Shark-Mustern.", openHarmonic:"Harmonic öffnen", strategyDesc:"Erprobte Modelle mit Regeln, Checklisten und Trade-Beispielen.", seeStrategies:"Strategien ansehen", educationDesc:"Fähigkeiten mit Kursen, Webinaren und Leitfäden entwickeln.", openEducation:"Bildung öffnen",

    security:"Sicherheit", securityDesc:"Sicherer Zugriff auf die Plattform und deine Daten.", speed:"Geschwindigkeit", speedDesc:"Werkzeuge und Marktdaten an einem Ort.", reliability:"Zuverlässigkeit", reliabilityDesc:"Stabile Umgebung für Trader.", support:"24/7 Support", supportDesc:"Wir sind rund um die Uhr für dich da.",

    ctaTitle:"Bereit für das nächste Trading-Level?", ctaDesc:"Nutze professionelle Werkzeuge, Strategien und Wissen, um jeden Tag fundiertere Entscheidungen zu treffen.",

    disclaimer:"Der Zugang zur FX Trade Professional Trading Bildungsplattform umfasst einen Trading-Kurs, Marktstrategien, ein Analyse-Dashboard und Werkzeuge zur Unterstützung eigenständiger Marktanalysen und Trading-Entscheidungen. Das Produkt dient ausschließlich Bildungs- und Informationszwecken und stellt keine Anlageberatung oder Finanzempfehlung dar. Der Handel an Finanzmärkten birgt das Risiko eines Kapitalverlusts.", terms:"Bedingungen", privacy:"Datenschutz", contact:"Kontakt"

  },

  nl: {

    features:"Functies", scannerNav:"Marktscanner", scannerShort:"Scanner", strategies:"Strategieën", education:"Educatie", pricing:"Prijzen", about:"Over ons", login:"Inloggen", buyShort:"Toegang kopen", buyRest:"", buyFull:"Koop platformtoegang", badge:"Professioneel tradingplatform",

    hero1:"Analyseer de markt.", hero2:"Vind setups.", hero3:"Trade volgens een plan.", heroDesc:"Geavanceerde tools voor marktanalyse, het vinden van potentiële strategieën en gestructureerde tradingeducatie in één professionele omgeving.",

    f1t:"Scan de markt", f1d:"Vind potentiële setups op meerdere instrumenten en timeframes.", f2t:"Analyseer nauwkeurig", f2d:"Professionele grafieken, indicatoren en multi-timeframe analyse.", f3t:"Beheer risico", f3d:"Plan trades, SL/TP-niveaus en houd risico onder controle.", f4t:"Blijf groeien", f4d:"Educatie, strategieën en materiaal dat je ontwikkeling ondersteunt.",

    fullAccess:"Volledige toegang tot alle tools", register:"Registreren", registerSub:"Maak een account en kies toegang", trust1:"Professionele tools", trust2:"Scanners en grafieken", trust3:"Strategieën en educatie",

    stat1:"Marktscanners", stat2:"Instrumenten", stat3:"Platformtoegang", stat4:"Strategieën en tools", community:"Community", traders:"Traders",

    cardScannerDesc:"Scan meerdere instrumenten realtime en filter potentiële setups.", openScanner:"Open scanner", cardChartsDesc:"Professionele grafieken, indicatoren, tekentools en multi-timeframe analyse.", openCharts:"Open grafieken", harmonicDesc:"Automatische detectie van Gartley, Bat, Butterfly, Crab en Shark patronen.", openHarmonic:"Open harmonic", strategyDesc:"Bewezen modellen met regels, checklists en tradevoorbeelden.", seeStrategies:"Bekijk strategieën", educationDesc:"Ontwikkel je vaardigheden met cursussen, webinars en handleidingen.", openEducation:"Open educatie",

    security:"Beveiliging", securityDesc:"Veilige toegang tot het platform en je gegevens.", speed:"Snelheid", speedDesc:"Tools en marktdata op één plek.", reliability:"Betrouwbaarheid", reliabilityDesc:"Een stabiele omgeving voor traders.", support:"24/7 Support", supportDesc:"We zijn dag en nacht voor je beschikbaar.",

    ctaTitle:"Klaar voor het volgende tradingniveau?", ctaDesc:"Sluit je aan bij traders die professionele tools, strategieën en kennis gebruiken om dagelijks beter onderbouwde beslissingen te nemen.",

    disclaimer:"Toegang tot het FX Trade Professional Trading Educatieplatform omvat een tradingcursus, marktstrategieën, een analytisch dashboard en tools ter ondersteuning van zelfstandige marktanalyse en tradingbeslissingen. Het product is uitsluitend bedoeld voor educatieve en informatieve doeleinden en vormt geen beleggingsadvies of financiële aanbeveling. Handelen op financiële markten brengt risico op kapitaalverlies met zich mee.", terms:"Voorwaarden", privacy:"Privacybeleid", contact:"Contact"

  },

  es: {

    features:"Funciones", scannerNav:"Escáner de mercado", scannerShort:"Escáner", strategies:"Estrategias", education:"Educación", pricing:"Precios", about:"Sobre nosotros", login:"Iniciar sesión", buyShort:"Comprar acceso", buyRest:"", buyFull:"Comprar acceso a la plataforma", badge:"Plataforma profesional de trading",

    hero1:"Analiza el mercado.", hero2:"Encuentra setups.", hero3:"Opera con un plan.", heroDesc:"Herramientas avanzadas para análisis de mercado, búsqueda de estrategias potenciales y educación estructurada de trading en un entorno profesional.",

    f1t:"Escanea el mercado", f1d:"Encuentra setups potenciales en múltiples instrumentos y temporalidades.", f2t:"Analiza con precisión", f2d:"Gráficos profesionales, indicadores y análisis multitemporal.", f3t:"Gestiona el riesgo", f3d:"Planifica operaciones, niveles SL/TP y controla el riesgo.", f4t:"Sigue mejorando", f4d:"Educación, estrategias y materiales para apoyar tu progreso.",

    fullAccess:"Acceso completo a todas las herramientas", register:"Registrarse", registerSub:"Crea una cuenta y elige el acceso", trust1:"Herramientas profesionales", trust2:"Escáneres y gráficos", trust3:"Estrategias y educación",

    stat1:"Escáneres de mercado", stat2:"Instrumentos", stat3:"Acceso a la plataforma", stat4:"Estrategias y herramientas", community:"Comunidad", traders:"Traders",

    cardScannerDesc:"Escanea múltiples instrumentos en tiempo real y filtra setups potenciales.", openScanner:"Abrir escáner", cardChartsDesc:"Gráficos profesionales, indicadores, herramientas de dibujo y análisis multitemporal.", openCharts:"Abrir gráficos", harmonicDesc:"Detección automática de patrones Gartley, Bat, Butterfly, Crab y Shark.", openHarmonic:"Abrir harmonic", strategyDesc:"Modelos probados con reglas, checklists y ejemplos de operaciones.", seeStrategies:"Ver estrategias", educationDesc:"Desarrolla tus habilidades con cursos, webinars y guías.", openEducation:"Abrir educación",

    security:"Seguridad", securityDesc:"Acceso seguro a la plataforma y a tus datos.", speed:"Velocidad", speedDesc:"Herramientas y datos de mercado en un solo lugar.", reliability:"Fiabilidad", reliabilityDesc:"Un entorno estable creado para traders.", support:"Soporte 24/7", supportDesc:"Estamos aquí para ayudarte a cualquier hora.",

    ctaTitle:"¿Listo para llevar tu trading al siguiente nivel?", ctaDesc:"Únete a traders que utilizan herramientas profesionales, estrategias y conocimiento para tomar decisiones más informadas cada día.",

    disclaimer:"El acceso a la Plataforma Educativa FX Trade Professional Trading incluye un curso de trading, estrategias de mercado, un panel analítico y herramientas que apoyan el análisis independiente y la toma de decisiones de trading. El producto tiene fines exclusivamente educativos e informativos y no constituye asesoramiento de inversión ni recomendación financiera. Operar en los mercados financieros implica riesgo de pérdida de capital.", terms:"Términos", privacy:"Política de privacidad", contact:"Contacto"

  }

};



export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const rawLang = cookieStore.get("fxtrade-language")?.value;
  const lang: HomeLang = rawLang === "en" || rawLang === "de" || rawLang === "nl" || rawLang === "es" ? rawLang : "pl";
  const t = HOME_COPY[lang];
  if (token) redirect("/dashboard");
  const cards = [
    {icon: <Radar />, title: t.f1t, desc: t.f1d},
    {icon: <Target />, title: t.f2t, desc: t.f2d},
    {icon: <BrainCircuit />, title: t.strategies, desc: "Scalping · Day Trading · Swing Trading"},
    {icon: <ShieldCheck />, title: t.f3t, desc: t.f3d},
    {icon: <GraduationCap />, title: t.education, desc: t.f4d},
  ];
  const quotes = [
    {symbol:"EURUSD",price:"1.0874",change:"+0.21%",up:true},
    {symbol:"GBPUSD",price:"1.2603",change:"+0.18%",up:true},
    {symbol:"XAUUSD",price:"2,355.80",change:"+0.92%",up:true},
    {symbol:"US30",price:"42,155",change:"-0.61%",up:false},
    {symbol:"NAS100",price:"19,842",change:"+0.36%",up:true},
    {symbol:"BTCUSDT",price:"87,422",change:"+1.94%",up:true},
  ];
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#03172b] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,rgba(12,82,130,.30),transparent_48%),linear-gradient(180deg,#061b30_0%,#031326_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(90deg,transparent 49%,rgba(56,189,248,.12) 50%,transparent 51%)",backgroundSize:"88px 100%"}} />
      <header className="relative z-30 border-b border-cyan-300/15 bg-[#041a2e]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[80px] max-w-[1390px] items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="FX TRADE">
            <span className="text-[40px] font-black italic leading-none tracking-[-.12em] text-white">F<span className="bg-gradient-to-br from-cyan-300 to-blue-600 bg-clip-text text-transparent">X</span></span>
            <span className="pl-2"><span className="block text-[17px] font-semibold tracking-[.22em]">TRADE</span><span className="block text-[7px] tracking-[.12em] text-slate-400">PROFESSIONAL TRADING</span></span>
          </Link>
          <nav className="hidden items-center gap-6 text-[12px] text-slate-200 lg:flex">
            <a href="#scanner" className="hover:text-cyan-300">{t.scannerShort}</a>
            <a href="#strategie" className="hover:text-cyan-300">{t.strategies}</a>
            <a href="#edukacja" className="hover:text-cyan-300">{t.education}</a>
            <Link href="/trading-room" className="hover:text-cyan-300">Trading Room</Link>
          </nav>
          <div className="flex items-center gap-2"><LanguageSwitcher /><Link href="/login" className="rounded-lg border border-cyan-300/25 px-3 py-2.5 text-[11px] hover:bg-cyan-400/10 sm:px-4">{t.login}</Link><Link href="/register" className="rounded-lg border border-cyan-300/60 bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-2.5 text-[11px] font-semibold shadow-[0_0_24px_rgba(14,165,233,.45)] sm:px-5">{t.buyShort} <span className="hidden sm:inline">→</span></Link></div>
        </div>
        <nav className="flex justify-center gap-5 overflow-x-auto border-t border-white/5 px-4 py-2 text-[11px] text-slate-300 lg:hidden"><a href="#scanner">{t.scannerShort}</a><a href="#strategie">{t.strategies}</a><a href="#edukacja">{t.education}</a><Link href="/trading-room">Trading Room</Link></nav>
      </header>
      <div className="relative z-10 mx-auto max-w-[1390px] px-4 pb-8 md:px-8">
        <section className="relative grid min-h-[450px] items-center gap-8 py-10 lg:grid-cols-[1.04fr_.96fr] lg:py-14">
          <div className="relative z-10">
            <div className="mb-5 inline-flex rounded-full border border-sky-300/25 bg-sky-200/5 px-4 py-2 text-[10px] uppercase tracking-[.16em] text-slate-300">{t.badge}</div>
            <h1 className="max-w-[700px] text-[clamp(38px,4.6vw,68px)] font-extrabold leading-[1.06] tracking-[-.045em] text-slate-100"><span className="block">{t.hero1}</span><span className="block">{t.hero2}</span><span className="block whitespace-normal lg:whitespace-nowrap">{t.hero3}</span></h1>
            <p className="mt-6 max-w-[570px] text-[13px] leading-6 text-slate-400 sm:text-[14px]">{t.heroDesc}</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/register" className="inline-flex min-w-[175px] items-center justify-center gap-3 rounded-xl border border-cyan-300/60 bg-gradient-to-r from-sky-500/95 to-blue-600 px-6 py-3.5 text-sm shadow-[0_0_28px_rgba(14,165,233,.42)] hover:brightness-110">{t.buyShort} <ArrowRight size={16}/></Link><Link href="/register" className="inline-flex min-w-[175px] items-center justify-center gap-3 rounded-xl border border-cyan-300/50 bg-sky-500/15 px-6 py-3.5 text-sm shadow-[0_0_18px_rgba(14,165,233,.18)] hover:bg-sky-500/25"><User size={16}/>{t.register}<ArrowRight size={15}/></Link></div>
          </div>
          <div className="relative h-[300px] overflow-hidden rounded-[18px] border border-sky-300/35 bg-[#05182b] shadow-[0_0_30px_rgba(14,165,233,.13)] sm:h-[380px] lg:h-[410px]"><Image src="/home/pro-trading-hero.png" alt="FX TRADE - profesjonalne stanowisko tradingowe" fill priority sizes="(max-width:1024px) 100vw, 48vw" className="object-cover object-center"/><div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"/></div>
        </section>
        <section id="funkcje" className="grid grid-cols-2 gap-3 pb-4 md:grid-cols-5">
          {cards.map((c,i)=><div key={i} className="flex min-h-[175px] flex-col items-center justify-center rounded-[14px] border border-sky-300/30 bg-gradient-to-b from-[#123c61]/90 to-[#08233e]/95 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_0_20px_rgba(14,165,233,.08)]"><div className="mb-4 text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,.8)] [&_svg]:h-11 [&_svg]:w-11 [&_svg]:stroke-[1.3]">{c.icon}</div><h3 className="text-[13px] font-semibold">{c.title}</h3><p className="mt-1 max-w-[190px] text-[11px] leading-4 text-slate-300">{c.desc}</p></div>)}
        </section>
        <section className="grid grid-cols-2 gap-2 py-2 md:grid-cols-3">
          {quotes.map((q,i)=><div key={q.symbol} className="flex min-h-[64px] items-center justify-between gap-2 rounded-lg border border-sky-300/25 bg-[#0b2b49]/80 px-3"><div className="min-w-[68px]"><div className="text-[11px] font-semibold">{q.symbol}</div><div className="text-[10px] text-slate-300">{q.price}</div></div><div className="h-[38px] flex-1"><Sparkline seed={i} up={q.up}/></div><div className={'text-[10px] '+(q.up?'text-emerald-400':'text-rose-400')}>{q.change}</div></div>)}
        </section>
        <p className="mb-2 text-right text-[10px] text-slate-500">{lang === 'pl' ? 'Notowania poglądowe · dane demonstracyjne' : 'Illustrative quotes · demo data'}</p>
        <section id="scanner" className="grid gap-3 lg:grid-cols-2">
          <article className="overflow-hidden rounded-xl border border-sky-300/35 bg-[#09243f]/95"><div className="flex items-center justify-between border-b border-cyan-300/20 bg-sky-400/10 px-4 py-3"><div><h2 className="text-xl font-semibold text-cyan-200">{t.scannerNav}</h2><p className="text-[10px] text-slate-400">{t.cardScannerDesc}</p></div><Link href="/skaner" className="rounded-md border border-cyan-300/40 bg-sky-500/20 px-3 py-2 text-[10px]">{t.openScanner} →</Link></div><div className="grid grid-cols-[1.1fr_.45fr_.55fr_.65fr_.75fr] border-b border-white/10 px-3 py-2 text-[9px] uppercase text-slate-400"><span>Instrument</span><span>TF</span><span>Trend</span><span>{lang==='pl'?'Sygnał':'Signal'}</span><span>Status</span></div>{[['EURUSD','M5','↑','BUY'],['GBPUSD','M5','↑','BUY'],['XAUUSD','M5','↓','SELL'],['US30','M1','↑','BUY'],['XAGUSD','M5','↑','BUY'],['NAS100','M15','↓','SELL'],['BTCUSDT','M15','↑','BUY']].map((r,i)=><div key={i} className="grid grid-cols-[1.1fr_.45fr_.55fr_.65fr_.75fr] items-center border-b border-white/5 px-3 py-3 text-[11px]"><span>{r[0]}</span><span className="text-slate-400">{r[1]}</span><span className={r[2]==='↑'?'text-emerald-400':'text-rose-400'}>{r[2]}</span><span><span className={'inline-block min-w-[48px] rounded border px-2 py-1 text-center text-[10px] '+(r[3]==='BUY'?'border-emerald-400/50 bg-emerald-500/20 text-emerald-300':'border-rose-400/50 bg-rose-500/20 text-rose-300')}>{r[3]}</span></span><span className="text-[10px] text-slate-400">DEMO</span></div>)}</article>
          <article className="overflow-hidden rounded-xl border border-sky-300/35 bg-[#09243f]/95"><div className="flex items-center justify-between border-b border-cyan-300/20 bg-sky-400/10 px-4 py-3"><div><h2 className="text-xl font-semibold">{lang==='pl'?'Podgląd wykresu':'Chart preview'}</h2><p className="text-[10px] text-slate-400">{t.cardChartsDesc}</p></div><Link href="/dashboard" className="rounded-md border border-cyan-300/40 bg-sky-500/20 px-3 py-2 text-[10px]">{t.openCharts} →</Link></div><div className="flex gap-2 border-b border-white/10 px-3 py-2 text-[10px] text-slate-400"><span className="mr-auto font-semibold text-white">EURUSD · DEMO</span>{['M1','M5','M15','H1','H4','D1'].map(x=><span key={x} className="rounded bg-sky-400/10 px-2 py-1">{x}</span>)}</div><div className="relative h-[350px] sm:h-[410px]"><Image src="/home/hero-chart.png" alt="Demonstracyjny podgląd wykresu FX TRADE" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-center"/><span className="absolute bottom-3 left-3 rounded bg-[#03172b]/85 px-2 py-1 text-[10px] text-slate-300">DEMO</span></div></article>
        </section>
        <section className="grid grid-cols-2 gap-3 py-3 lg:grid-cols-4">{['GBPUSD','EURJPY','XAUUSD','NAS100'].map((x,i)=><div key={x} className="rounded-xl border border-sky-300/30 bg-[#071d34] p-3"><div className="mb-2 text-[11px] font-semibold">{x} <span className="float-right text-[9px] text-slate-500">DEMO</span></div><div className="h-[85px]"><Sparkline seed={i+5} up={i!==3}/></div></div>)}</section>
        <section className="grid gap-3 py-4 md:grid-cols-3"><Link id="strategie" href="/strategie" className="rounded-xl border border-sky-300/25 bg-[#0a2946] p-5"><TrendingUp className="mb-3 text-cyan-300"/><h3 className="font-semibold">{t.strategies}</h3><p className="mt-2 text-xs text-slate-400">{t.strategyDesc}</p></Link><Link id="edukacja" href="/edukacja" className="rounded-xl border border-sky-300/25 bg-[#0a2946] p-5"><GraduationCap className="mb-3 text-cyan-300"/><h3 className="font-semibold">{t.education}</h3><p className="mt-2 text-xs text-slate-400">{t.educationDesc}</p></Link><Link href="/trading-room" className="rounded-xl border border-sky-300/25 bg-[#0a2946] p-5"><Users className="mb-3 text-cyan-300"/><h3 className="font-semibold">Trading Room</h3><p className="mt-2 text-xs text-slate-400">FX TRADE community</p></Link></section>
        <section id="onas" className="py-3 text-[10px] leading-5 text-slate-500">{t.disclaimer}</section>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-cyan-300/15 py-5 text-xs text-slate-400"><span>FX TRADE © 2026</span><div className="flex flex-wrap gap-5"><Link href="/regulamin">{t.terms}</Link><Link href="/polityka-prywatnosci">{t.privacy}</Link><Link href="/kontakt">{t.contact}</Link></div></footer>
      </div>
    </main>
  );
}
function Sparkline({seed,up}:{seed:number;up:boolean}){
 const pts=Array.from({length:28},(_,i)=>{const v=30+Math.sin(i*.8+seed)*8+Math.sin(i*2.2+seed)*4+(up?-i*.5:i*.5);return `${i*4},${Math.max(5,Math.min(56,v)).toFixed(1)}`}).join(' ');
 return <svg viewBox="0 0 108 62" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true"><polyline points={pts} fill="none" stroke={up?'#38bdf8':'#fb7185'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}
