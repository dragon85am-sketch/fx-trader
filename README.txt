FX TRADE - optymalizacja logowania / dashboardu

Podmien: lib/auth.ts oraz app/api/me/route.ts.

Zmiany: requirePremiumUser korzysta z jednego odczytu Prisma; /api/me korzysta z jednego odczytu Prisma zamiast dwoch, zachowujac JWT/tokenVersion/isBanned.
Nie zmieniano PIN, 2FA, Stripe, LayoutShell ani UserProvider.

Weryfikacja: npm run build, test email/haslo, PIN, 2FA, Premium, admin, wylogowanie, potem npx vercel --prod.
UWAGA: nie usuwa problemu ECHECKOUTTIMEOUT poolera Supabase; osobno sprawdz DATABASE_URL i liczbe polaczen.
