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

  if (token) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#031A31] text-white">
      {/* BACKGROUND - STATIC, NO ANIMATION */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#03152B_0%,#06284A_48%,#03182F_100%)]" />

        {/* soft static blue light */}
        <div className="absolute left-[8%] top-[6%] h-[560px] w-[560px] rounded-full bg-blue-600/[0.10] blur-[150px]" />
        <div className="absolute right-[8%] top-[10%] h-[620px] w-[620px] rounded-full bg-sky-500/[0.08] blur-[170px]" />

        {/* REAL SIDE WALLPAPERS FROM REFERENCE IMAGE */}
        <div className="absolute inset-y-0 left-0 hidden w-[calc((100vw-1380px)/2+170px)] min-w-[250px] overflow-hidden xl:block">
          <Image
            src="/home/side-left.png"
            alt=""
            fill
            priority
            sizes="28vw"
            className="object-cover object-right opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#03182F]" />
        </div>

        <div className="absolute inset-y-0 right-0 hidden w-[calc((100vw-1380px)/2+170px)] min-w-[250px] overflow-hidden xl:block">
          <Image
            src="/home/side-right.png"
            alt=""
            fill
            priority
            sizes="28vw"
            className="object-cover object-left opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#03182F]" />
        </div>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 overflow-visible border-b border-sky-200/25 bg-[#031A31]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[86px] w-full max-w-[1380px] items-center gap-4 px-4 py-3 sm:min-h-[92px] sm:gap-5 sm:px-6 md:px-8 lg:min-h-[82px] lg:py-2">
          <Link href="/" className="shrink-0 pr-3 sm:pr-5 lg:pr-4">
            <FxLogo compact />
          </Link>

          <nav className="hidden items-center gap-7 text-[12px] font-semibold text-slate-300 lg:flex">
            <a href="#funkcje" className="transition hover:text-sky-400">
              {t.features}
            </a>
            <a href="#scanner" className="transition hover:text-sky-400">
              {t.scannerNav}
            </a>
            <a href="#strategie" className="transition hover:text-sky-400">
              {t.strategies}
            </a>
            <a href="#edukacja" className="transition hover:text-sky-400">
              {t.education}
            </a>
            <Link href="/trading-room" className="transition hover:text-sky-400">
              Trading Room
            </Link>
            <Link href="/cennik" className="transition hover:text-sky-400">
              {t.pricing}
            </Link>
            <a href="#onas" className="transition hover:text-sky-400">
              {t.about}
            </a>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <div className="relative z-[140] shrink-0 overflow-visible">
              <LanguageSwitcher />
            </div>

            <Link
              href="/login"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/40 bg-[linear-gradient(180deg,rgba(8,57,97,.96),rgba(4,35,66,.98))] text-[0px] font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,.03)_inset,0_8px_24px_rgba(2,132,199,.16),0_0_18px_rgba(34,211,238,.10)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:shadow-[0_0_0_1px_rgba(255,255,255,.05)_inset,0_12px_30px_rgba(2,132,199,.24),0_0_28px_rgba(34,211,238,.20)] sm:h-11 sm:w-auto sm:gap-2.5 sm:px-4 sm:text-[12px]"
            >
              <User className="h-4 w-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,.45)]" />
              {t.login}
            </Link>

            <Link
              href="/checkout"
              className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-200/55 bg-[linear-gradient(135deg,#22d3ee_0%,#0ea5e9_28%,#2563eb_65%,#4f46e5_100%)] text-[10px] font-black text-white shadow-[0_0_0_1px_rgba(255,255,255,.08)_inset,0_10px_30px_rgba(37,99,235,.34),0_0_28px_rgba(34,211,238,.24)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,.10)_inset,0_14px_38px_rgba(37,99,235,.42),0_0_38px_rgba(34,211,238,.34)] active:translate-y-0 min-[430px]:w-auto min-[430px]:gap-2 min-[430px]:px-3.5 sm:h-11 sm:gap-2.5 sm:px-4 sm:text-[12px]"
              aria-label={t.buyFull}
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
              <Crown className="h-4 w-4 shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,.35)]" />
              <span className="hidden min-[430px]:inline">{t.buyShort}</span>
              <span className="hidden sm:inline">{t.buyRest}</span>
              <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 sm:block" />
            </Link>
          </div>
        </div>

        <nav className="mx-auto flex w-full max-w-[1380px] gap-1 overflow-x-auto px-2 pb-2 text-[9px] font-semibold text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[390px]:gap-1.5 min-[390px]:text-[10px] lg:hidden sm:px-4">
          <a href="#funkcje" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">{t.features}</a>
          <a href="#scanner" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">{t.scannerShort}</a>
          <a href="#strategie" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">{t.strategies}</a>
          <a href="#edukacja" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">{t.education}</a>
          <Link href="/trading-room" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Trading Room</Link>
          <Link href="/cennik" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">{t.pricing}</Link>
          <a href="#onas" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">{t.about}</a>
        </nav>
      </header>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1380px] px-2 pb-6 sm:px-4 md:px-6">
        {/* HERO — PRO GLOW / reference layout */}
        <section className="relative min-w-0 overflow-hidden rounded-[22px] border border-cyan-300/15 bg-[#03182f] shadow-[0_28px_90px_rgba(0,0,0,.28),0_0_55px_rgba(14,165,233,.08)]">
          <div className="absolute inset-0">
            <Image
              src="/home/pro-trading-hero.png"
              alt="Profesjonalne stanowisko tradingowe FX Trade"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[68%_center] opacity-95"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#03182f_0%,rgba(3,24,47,.98)_29%,rgba(3,24,47,.78)_43%,rgba(3,24,47,.18)_67%,rgba(3,24,47,.12)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,24,47,.08),rgba(3,24,47,.05)_60%,#03182f_100%)]" />
          </div>

          <div className="relative z-10 min-h-[520px] px-5 pb-7 pt-7 sm:px-8 sm:pt-9 lg:min-h-[610px] lg:px-10 lg:pb-9 lg:pt-10 xl:px-12">
            <div className="max-w-[610px]">
              <div className="mb-5 inline-flex items-center rounded-full border border-cyan-300/55 bg-[#06253f]/75 px-4 py-2 text-[9px] font-black uppercase tracking-[.20em] text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,.08)]">
                {t.badge}
              </div>

              <h1 className="max-w-[600px] text-[42px] font-black leading-[.98] tracking-[-.05em] min-[390px]:text-[48px] sm:text-[58px] lg:text-[64px] xl:text-[68px]">
                <span className="block text-white">{t.hero1}</span>
                <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(34,211,238,.20)]">{t.hero2}</span>
                <span className="mt-1 block text-white">{t.hero3}</span>
              </h1>

              <p className="mt-6 max-w-[560px] text-[12px] leading-6 text-slate-200/80 sm:text-[13px]">{t.heroDesc}</p>

              <div className="mt-7 flex flex-col gap-3 min-[460px]:flex-row">
                <Link href="/checkout" className="group relative flex min-h-[58px] min-w-[205px] items-center justify-center gap-3 overflow-hidden rounded-xl border border-cyan-200/55 bg-[linear-gradient(135deg,#16d9f4_0%,#0ea5e9_32%,#2563eb_68%,#4f46e5_100%)] px-6 text-[13px] font-black text-white shadow-[0_0_32px_rgba(34,211,238,.32),0_14px_38px_rgba(37,99,235,.28)] transition hover:-translate-y-1 hover:brightness-110">
                  <span className="absolute inset-x-0 top-0 h-px bg-white/80" />
                  {t.buyShort}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <Link href="/register" className="group flex min-h-[58px] min-w-[190px] items-center justify-center gap-3 rounded-xl border border-cyan-300/35 bg-[#041d35]/88 px-6 text-[13px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_28px_rgba(0,0,0,.20)] backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-200/65 hover:bg-[#062945]">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/35 text-cyan-300"><User className="h-4 w-4" /></span>
                  {t.register}<ArrowRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES — one row like reference */}
        <section id="funkcje" className="relative z-20 -mt-1 grid grid-cols-2 overflow-hidden rounded-[16px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(4,31,57,.96),rgba(2,23,44,.98))] shadow-[0_18px_50px_rgba(0,0,0,.18),0_0_28px_rgba(14,165,233,.06)] md:grid-cols-5">
          <FeatureCard icon={<Radar />} title={t.f1t} text={t.f1d} />
          <FeatureCard icon={<TrendingUp />} title={t.f2t} text={t.f2d} />
          <FeatureCard icon={<BrainCircuit />} title={t.strategies} text="Scalping, Day Trading, Swing Trading." />
          <FeatureCard icon={<ShieldCheck />} title={t.f3t} text={t.f3d} />
          <FeatureCard icon={<GraduationCap />} title={t.education} text={t.f4d} />
        </section>

        {/* MARKET TICKERS */}
        <section className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-3 xl:grid-cols-6">
          <Ticker symbol="EURUSD" price="1.0874" change="+0.21%" up />
          <Ticker symbol="GBPUSD" price="1.2653" change="+0.18%" up />
          <Ticker symbol="XAUUSD" price="2,365.40" change="+0.32%" up />
          <Ticker symbol="US30" price="42,156" change="-0.12%" />
          <Ticker symbol="NAS100" price="19,842" change="+0.36%" up />
          <Ticker symbol="BTCUSDT" price="67,432" change="+1.24%" up />
        </section>

        {/* STATS */}
        <section className="grid grid-cols-2 overflow-hidden rounded-[16px] border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(5,35,66,.94),rgba(2,23,44,.97))] shadow-[0_0_34px_rgba(14,165,233,.08)] lg:grid-cols-5">
          <BigStat icon={<Radar />} value="5" text={t.stat1} />
          <BigStat icon={<TrendingUp />} value="50+" text={t.stat2} />
          <BigStat icon={<Zap />} value="24/7" text={t.stat3} />
          <BigStat icon={<BarChart3 />} value="100+" text={t.stat4} />
          <BigStat icon={<Users />} value={t.community} text={t.traders} />
        </section>

        {/* SCANNER + LIVE CHART */}
        <section id="scanner" className="grid min-w-0 gap-4 py-4 lg:grid-cols-[.98fr_1.02fr]">
          <article className="min-w-0 overflow-hidden rounded-[18px] border border-cyan-300/30 bg-[linear-gradient(180deg,rgba(5,35,66,.97),rgba(2,23,44,.99))] p-3.5 shadow-[0_18px_50px_rgba(0,8,24,.26),0_0_34px_rgba(14,165,233,.08)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/[0.06] text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.12)]"><Radar className="h-5 w-5" /></span>
                <div className="min-w-0"><h2 className="text-[18px] font-black text-white">{t.scannerNav}</h2><p className="mt-0.5 text-[9px] text-slate-400">{t.cardScannerDesc}</p></div>
              </div>
              <Link href="/skaner" className="hidden shrink-0 items-center gap-2 rounded-lg border border-blue-400/50 bg-blue-500/10 px-3 py-2 text-[9px] font-bold text-sky-300 transition hover:bg-blue-500/20 sm:flex">{t.openScanner}<ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-sky-300/20 bg-[#02172c]">
              <div className="grid grid-cols-[1.15fr_.55fr_.65fr_.75fr_.7fr] border-b border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-[7px] font-bold uppercase tracking-[.08em] text-slate-500 sm:text-[8px]"><span>Instrument</span><span>TF</span><span>Trend</span><span>Sygnał</span><span>Status</span></div>
              <ScannerRow symbol="EURUSD" tf="M5" signal="BUY" status="READY" up />
              <ScannerRow symbol="GBPUSD" tf="M5" signal="BUY" status="READY" up />
              <ScannerRow symbol="XAUUSD" tf="M5" signal="SELL" status="READY" />
              <ScannerRow symbol="US30" tf="M1" signal="BUY" status="READY" up />
              <ScannerRow symbol="NAS100" tf="M5" signal="SELL" status="CLOSE" />
              <ScannerRow symbol="BTCUSDT" tf="M15" signal="BUY" status="READY" up />
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-[18px] border border-cyan-300/30 bg-[linear-gradient(180deg,rgba(5,35,66,.97),rgba(2,23,44,.99))] p-3.5 shadow-[0_18px_50px_rgba(0,8,24,.26),0_0_34px_rgba(14,165,233,.08)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-[18px] font-black text-white">Wykres na żywo</h2><p className="mt-0.5 text-[9px] text-slate-400">{t.cardChartsDesc}</p></div>
              <Link href="/dashboard" className="hidden shrink-0 items-center gap-2 rounded-lg border border-blue-400/50 bg-blue-500/10 px-3 py-2 text-[9px] font-bold text-sky-300 transition hover:bg-blue-500/20 sm:flex">{t.openCharts}<ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-sky-300/20 bg-[#02172c]">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2.5">
                <div className="flex items-center gap-3 text-[10px] font-bold"><span>EURUSD</span><span className="text-sky-400">1.08742</span><span className="text-emerald-400">+0.21%</span></div>
                <div className="flex gap-1 text-[8px] text-slate-400"><span className="rounded bg-white/[0.04] px-2 py-1">M1</span><span className="rounded bg-blue-600 px-2 py-1 font-bold text-white shadow-[0_0_12px_rgba(37,99,235,.45)]">M5</span><span className="rounded bg-white/[0.04] px-2 py-1">M15</span><span className="hidden rounded bg-white/[0.04] px-2 py-1 sm:block">H1</span></div>
              </div>
              <div className="relative h-[300px] sm:h-[340px]"><Image src="/home/hero-chart.png" alt="FX Trade live chart" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-center" /></div>
            </div>
          </article>
        </section>

        {/* STRATEGIES / EDUCATION / TRADING ROOM */}
        <section className="grid gap-4 pb-4 md:grid-cols-3">
          <PromoCard id="strategie" icon={<TrendingUp />} title={t.strategies} text={t.strategyDesc} image="/home/strategies.png" href="/strategie" action={t.seeStrategies} />
          <PromoCard id="edukacja" icon={<GraduationCap />} title={t.education} text={t.educationDesc} image="/home/education.png" href="/edukacja" action={t.openEducation} />
          <PromoCard icon={<Users />} title="Trading Room" text="Analizy na żywo, pomysły i wsparcie społeczności traderów." image="/home/market-scanner.png" href="/trading-room" action="Dołącz teraz" />
        </section>

        {/* GLOW NAVIGATION */}
        <section className="grid grid-cols-2 gap-2 rounded-[18px] border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(5,35,66,.92),rgba(2,23,44,.96))] p-2 shadow-[0_0_40px_rgba(14,165,233,.08)] sm:grid-cols-4 xl:grid-cols-8">
          <GlowNav href="/skaner" icon={<Radar />} label={t.scannerNav} active />
          <GlowNav href="/strategie" icon={<TrendingUp />} label={t.strategies} />
          <GlowNav href="/dashboard" icon={<BarChart3 />} label="Wykresy" />
          <GlowNav href="/trading-room" icon={<Users />} label="Trading Room" />
          <GlowNav href="/edukacja" icon={<GraduationCap />} label={t.education} />
          <GlowNav href="/cennik" icon={<Crown />} label={t.pricing} />
          <GlowNav href="/affiliate" icon={<BrainCircuit />} label="Affiliate" />
          <GlowNav href="#onas" icon={<ShieldCheck />} label={t.about} />
        </section>

        <section
          id="onas"
          className="mt-3 rounded-[12px] border border-sky-200/25 bg-sky-300/[0.035] px-4 py-3"
        >
          <p className="text-[9px] leading-5 text-slate-400">
            {t.disclaimer}
          </p>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 py-4 text-center text-[8px] text-slate-500 sm:flex-row sm:text-left">
          <span>© 2026 FX Trade Professional Trading.</span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
            <Link href="/regulamin" className="hover:text-slate-400">
              {t.terms}
            </Link>
            <Link href="/polityka-prywatnosci" className="hover:text-slate-400">
              {t.privacy}
            </Link>
            <Link href="/kontakt" className="hover:text-slate-400">
              {t.contact}
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FxLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "w-[330px] sm:w-[350px] lg:w-[325px]"
          : "w-[340px] sm:w-[390px]"
      }
    >
      <div className="flex items-center gap-5 sm:gap-6">
        <div className="flex shrink-0 items-end leading-none">
          <span
            className={`${
              compact
                ? "text-[56px] sm:text-[60px] lg:text-[56px]"
                : "text-[58px] sm:text-[66px]"
            } font-black italic tracking-[-0.08em] text-white [text-shadow:0_1px_2px_rgba(255,255,255,.08)]`}
          >
            F
          </span>
          <span
            className={`${
              compact
                ? "text-[60px] sm:text-[64px] lg:text-[60px]"
                : "text-[63px] sm:text-[71px]"
            } -ml-1 font-black italic tracking-[-0.08em] bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 bg-clip-text text-transparent`}
          >
            X
          </span>
        </div>

        <div className="min-w-0">
          <div
            className={`${
              compact
                ? "text-[23px] tracking-[0.20em] sm:text-[25px] lg:text-[23px]"
                : "text-[23px] tracking-[0.24em] sm:text-[27px]"
            } whitespace-nowrap font-black leading-none text-slate-100`}
          >
            TRADE
          </div>
          <div
            className={`${
              compact
                ? "mt-2 text-[7.5px] tracking-[0.36em] sm:text-[8px] lg:text-[7.5px]"
                : "mt-2.5 text-[8px] tracking-[0.44em] sm:text-[9px]"
            } whitespace-nowrap font-semibold text-cyan-400`}
          >
            PROFESSIONAL TRADING
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid h-4 w-4 place-items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-[10px] text-cyan-300">✓</span>
      {text}
    </span>
  );
}

function HarmonicPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(14,165,233,.16),transparent_42%),linear-gradient(180deg,#03172c,#021326)]">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(56,189,248,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.16)_1px,transparent_1px)] [background-size:28px_28px]" />
      <svg viewBox="0 0 240 170" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="harmonicFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <polyline points="18,35 62,138 105,82 156,150 218,42" fill="none" stroke="#38bdf8" strokeWidth="3" />
        <polygon points="18,35 62,138 105,82 156,150 218,42" fill="url(#harmonicFill)" opacity="0.9" />
        <polyline points="18,35 105,82 218,42" fill="none" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.75" />
        {[[18,35,'X'],[62,138,'A'],[105,82,'B'],[156,150,'C'],[218,42,'D']].map(([x,y,l]) => (
          <g key={String(l)}>
            <circle cx={Number(x)} cy={Number(y)} r="4" fill="#e0f2fe" />
            <text x={Number(x)+6} y={Number(y)-7} fill="#e0f2fe" fontSize="12" fontWeight="700">{l}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-2.5 text-sky-400 [&_svg]:h-6 [&_svg]:w-6">{icon}</div>
      <div className="break-words text-[10px] font-bold text-white">{title}</div>
      <div className="mt-1 break-words text-[8px] leading-4 text-slate-400">{text}</div>
    </div>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[7px] text-slate-400">{label}</div>
      <div className="mt-1 text-[11px] font-bold">{value}</div>
    </div>
  );
}

function BigStat({
  icon,
  value,
  text,
}: {
  icon: React.ReactNode;
  value: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-start gap-3 border-b border-sky-200/22 px-3 py-3.5 min-[390px]:border-r sm:px-4 xl:border-b-0">
      <div className="text-sky-400 [&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      <div>
        <div className="text-[15px] font-black sm:text-[16px]">{value}</div>
        <div className="mt-0.5 text-[8px] text-slate-400">{text}</div>
      </div>
    </div>
  );
}

function FeatureCard({
  id,
  icon,
  title,
  description,
  image,
  preview,
  href,
  button,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  image?: string;
  preview?: React.ReactNode;
  href: string;
  button: string;
}) {
  return (
    <article
      id={id}
      className="group flex min-h-[340px] min-w-0 flex-col rounded-[14px] border border-sky-400/30 bg-[linear-gradient(180deg,rgba(5,35,66,.96),rgba(2,23,44,.98))] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:shadow-[0_14px_34px_rgba(2,12,27,.26)] sm:h-[372px]"
    >
      <div className="flex min-h-[54px] gap-2.5">
        <div className="shrink-0 text-sky-400 [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-[12px] font-bold leading-4 text-white">{title}</h2>
          <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="relative mt-3 h-[180px] w-full min-w-0 overflow-hidden rounded-lg border border-sky-200/25 bg-[#02172c] p-2 sm:h-[198px]">
        <div className="relative h-full w-full overflow-hidden rounded-md">
          {preview ? (
            preview
          ) : image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 20vw"
              className="object-contain object-center"
            />
          ) : null}
        </div>
      </div>

      <Link
        href={href}
        className="mt-auto flex h-[38px] items-center justify-between rounded-lg border border-sky-400/38 bg-sky-500/[0.04] px-3 text-[9px] font-semibold text-sky-400 transition hover:bg-sky-500/[0.08]"
      >
        {button}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}

function Ticker({ symbol, price, change, up = false }: { symbol: string; price: string; change: string; up?: boolean }) {
  return (
    <div className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(5,35,66,.94),rgba(2,23,44,.97))] px-3 py-3 transition hover:-translate-y-0.5 hover:border-cyan-300/45 hover:shadow-[0_0_24px_rgba(14,165,233,.12)]">
      <div className="min-w-0"><div className="text-[10px] font-black text-white">{symbol}</div><div className="mt-1 text-[9px] text-slate-300">{price}</div></div>
      <div className={`text-right text-[9px] font-bold ${up ? "text-emerald-400" : "text-rose-400"}`}><div>{change}</div><div className="mt-1 text-[14px] leading-none">{up ? "↗" : "↘"}</div></div>
    </div>
  );
}

function ScannerRow({ symbol, tf, signal, status, up = false }: { symbol: string; tf: string; signal: "BUY" | "SELL"; status: "READY" | "CLOSE"; up?: boolean }) {
  return (
    <div className="grid grid-cols-[1.15fr_.55fr_.65fr_.75fr_.7fr] items-center border-b border-white/[0.055] px-3 py-3 text-[9px] last:border-b-0 sm:text-[10px]">
      <span className="font-bold text-white">{symbol}</span><span className="text-slate-300">{tf}</span><span className={`text-[17px] font-black ${up ? "text-emerald-400" : "text-rose-400"}`}>{up ? "↑" : "↓"}</span><span><span className={`rounded-md px-2 py-1 text-[8px] font-black ${signal === "BUY" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>{signal}</span></span><span><span className={`rounded-md border px-2 py-1 text-[7px] font-black ${status === "READY" ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,.12)]" : "border-slate-400/20 bg-slate-500/10 text-slate-400"}`}>{status}</span></span>
    </div>
  );
}

function PromoCard({ id, icon, title, text, image, href, action }: { id?: string; icon: React.ReactNode; title: string; text: string; image: string; href: string; action: string }) {
  return (
    <article id={id} className="group overflow-hidden rounded-[18px] border border-cyan-300/28 bg-[linear-gradient(180deg,rgba(5,35,66,.97),rgba(2,23,44,.99))] shadow-[0_18px_44px_rgba(0,8,24,.22)] transition hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_20px_50px_rgba(0,8,24,.28),0_0_30px_rgba(14,165,233,.10)]">
      <div className="relative h-[150px] overflow-hidden border-b border-cyan-300/15"><Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-center transition duration-500 group-hover:scale-[1.025]" /><div className="absolute inset-0 bg-gradient-to-t from-[#03172c] via-transparent to-transparent" /></div>
      <div className="p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/[0.06] text-cyan-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span><h3 className="text-[15px] font-black text-white">{title}</h3></div><p className="mt-3 min-h-[40px] text-[9px] leading-5 text-slate-400">{text}</p><Link href={href} className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold text-cyan-300 transition group-hover:text-cyan-200">{action}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
    </article>
  );
}

function GlowNav({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`group flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border px-2 text-center transition duration-300 ${active ? "border-cyan-300/65 bg-cyan-400/[0.08] shadow-[0_0_24px_rgba(34,211,238,.20),inset_0_0_20px_rgba(37,99,235,.10)]" : "border-sky-300/20 bg-white/[0.025] hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-400/[0.05]"}`}><span className={`[&_svg]:h-6 [&_svg]:w-6 ${active ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,.55)]" : "text-slate-300 group-hover:text-cyan-300"}`}>{icon}</span><span className="text-[9px] font-bold text-slate-100">{label}</span></Link>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-sky-200/22 px-3 py-3.5 min-[390px]:border-r sm:px-4 xl:border-b-0">
      <div className="shrink-0 text-blue-500 [&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      <div>
        <div className="text-[11px] font-bold">{title}</div>
        <div className="mt-1 break-words text-[8px] leading-4 text-slate-400">{text}</div>
      </div>
    </div>
  );
}

