"use client";

import { Button, Card, CardContent, Input, Label } from "../../components/ui";import Link from "next/link";

export default function Login() {
  return (
    <main className="px-6 py-16 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Logowanie (placeholder)</h1>
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input placeholder="email@domain.com" />
            </div>
            <div>
              <Label>Hasło</Label>
              <Input placeholder="••••••••" type="password" />
            </div>
            <Button className="w-full">Zaloguj (placeholder)</Button>
            <Button variant="outline" className="w-full">Google (placeholder)</Button>
            <p className="text-xs text-zinc-500">
              Ten ekran jest gotowy pod Supabase Auth (email+hasło + Google). W tej paczce działa tryb demo płatności.
            </p>
            <Link href="/"><Button variant="outline" className="w-full">Wróć</Button></Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
