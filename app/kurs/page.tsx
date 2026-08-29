import Link from "next/link";
import { Card, CardContent, Pill, Button, cn } from "@/components/ui";
import { COURSE } from "@/components/course";
import { getCourseProgress } from "@/components/courseProgress";

const lessons = [
  { module: "ModuÅ‚ 1: Fundamenty", title: "Przewaga, R, expectancy, DD", status: "premium" },
  { module: "ModuÅ‚ 2: Struktura M5", title: "Trend / range + filtr M5", status: "premium" },
  { module: "ModuÅ‚ 3: Scalp M1", title: "Setup 1â€“2â€“3 + mid BB", status: "premium" },
  { module: "ModuÅ‚ 4: ZarzÄ…dzanie", title: "BE, TP, rÄ™czne wyjÅ›cie", status: "premium" },
  { module: "ModuÅ‚ 5: Journal", title: "Analiza danych + eliminacja bÅ‚Ä™dÃ³w", status: "premium" },
];

export default function Kurs() {
  return (
    <main className="px-6 py-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kurs (premium)</h1>
        <Link  href="/app"><Button variant="outline">WrÃ³Ä‡ do dashboardu</Button></Link>
      </div>

      <Card>
        <CardContent>
          <p className="text-zinc-400">
            TreÅ›ci kursu masz w canvasie (ModuÅ‚y 1â€“5) + checklisty premium. Produkcyjnie te lekcje wczytujemy z bazy (Supabase) jako Markdown.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map((l) => (
          <Card key={l.title}>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Pill>{l.module}</Pill>
                <Pill>Premium</Pill>
              </div>
              <h3 className="text-lg font-semibold">{l.title}</h3>
              <p className="text-sm text-zinc-400">
                Wersja demo: karta lekcji. Produkcyjnie: strona lekcji + checkbox ukoÅ„czenia.
              </p>
              <Button variant="outline" disabled className="w-full">OtwÃ³rz lekcjÄ™ (wkrÃ³tce)</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

