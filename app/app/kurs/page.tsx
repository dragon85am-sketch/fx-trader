import Link from "next/link";
import { Button, Card, CardContent, Pill } from "../../../components/ui";

const lessons = [
  { module: "Moduł 1: Fundamenty", title: "Przewaga, R, expectancy, DD", status: "premium" },
  { module: "Moduł 2: Struktura M5", title: "Trend / range + filtr M5", status: "premium" },
  { module: "Moduł 3: Scalp M1", title: "Setup 1–2–3 + mid BB", status: "premium" },
  { module: "Moduł 4: Zarządzanie", title: "BE, TP, ręczne wyjście", status: "premium" },
  { module: "Moduł 5: Journal", title: "Analiza danych + eliminacja błędów", status: "premium" },
];

export default function Kurs() {
  return (
    <main className="px-6 py-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kurs (premium)</h1>
        <Link href="/app"><Button variant="outline">Wróć do dashboardu</Button></Link>
      </div>

      <Card>
        <CardContent>
          <p className="text-zinc-400">
            Treści kursu masz w canvasie (Moduły 1–5) + checklisty premium. Produkcyjnie te lekcje wczytujemy z bazy (Supabase) jako Markdown.
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
                Wersja demo: karta lekcji. Produkcyjnie: strona lekcji + checkbox ukończenia.
              </p>
              <Button variant="outline" disabled className="w-full">Otwórz lekcję (wkrótce)</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
