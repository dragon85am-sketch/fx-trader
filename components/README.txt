FX TRADE V6.2 — Smooth Pan (bezpieczny wariant)

Zmiany: DrawingsLayer.tsx — zamiast setVisibleLogicalRange() przy kazdej klatce
uzywamy timeScale.scrollToPosition() i stalej bazowej pozycji/odstepu swiec.
Przesuniecie kursora 1px odpowiada ok. 1px przesuniecia wykresu.
Dodatkowo ostatnie zdarzenie myszy jest przetwarzane przy mouseup.

Uwaga: to NIE jest pelne przekazanie zdarzen myszy do natywnego handlera
Lightweight Charts: warstwa rysunkow nadal przechwytuje klikniecia, aby
zachowac zaznaczanie i przesuwanie BOX/BRUSH/FIBO.

Podmien oba pliki w ich istniejacym folderze components.
Zrob kopie poprzednich plikow. npm run build, potem test lokalny.
Nie wdrazaj produkcyjnie, jesli test przesuwania i rysunkow nie przejdzie.
