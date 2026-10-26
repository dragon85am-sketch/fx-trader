# FX TRADE Trading Rewards — etap 1

W tej paczce znajdują się wyłącznie nowe/zmienione pliki, zachowaj resztę projektu.

1. Zrób kopię zapasową projektu i bazy.
2. Skopiuj pliki do katalogu projektu, zachowując strukturę.
3. Uruchom `npx prisma migrate dev --name trading_rewards_phase1` w środowisku deweloperskim z poprawną bazą, a na produkcji wdrażaj wygenerowaną i sprawdzoną migrację przez `npx prisma migrate deploy`.
4. Uruchom `npm run build` i sprawdź `/dashboard/rewards`.

**Stan:** etap 1 to UI, poziomy, struktura danych i API odczytu. Nie ma automatycznego łączenia TradeQuo, importu lotów ani działających wypłat. Bez dostępu do autoryzowanego źródła danych nie należy uruchamiać naliczania środków. Nie publikuj stawek prowizji FX TRADE w panelu kursanta.

**Reguła produkcyjna:** weryfikowane loty powinny być dopisywane wyłącznie przez zaufany proces serwerowy; nagroda za lot i poziom muszą być zapisane w chwili weryfikacji, z kontrolą duplikatów. Użytkownik nie może sam wprowadzać lotów ani nagród.
