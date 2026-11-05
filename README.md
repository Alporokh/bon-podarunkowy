# Bon podarunkowy - generator

Narzędzie do wystawiania imiennych bonów podarunkowych dla studiów w Poznaniu i Pradze. Każde studio ma osobną stronę i widzi tylko swoje bony:

- **Permanent Guru** (permanentguru.com) - https://alporokh.github.io/bon-podarunkowy/permanentguru/ - bon na zabieg, ważny 6 miesięcy
- **Massage 4 You** (massage-4-you.com) - https://alporokh.github.io/bon-podarunkowy/massage-4-you/ - voucher na zabieg lub kwotę
- **Massage 4 Beauty** (beautymassage.cz, Praga) - https://alporokh.github.io/bon-podarunkowy/massage-4-beauty/ - dárkový poukaz na masaż i/lub kwotę w Kč, ważny 12 miesięcy, strona po czesku

Strona główna (`/bon-podarunkowy/`) nie linkuje do żadnego studia.

## Jak używać

1. Numer bonu podpowiada się sam (`PG-2026-001`, `M4Y-2026-001`, …) - przycisk **Nowy** daje kolejny wolny numer. Można go też wpisać ręcznie.
2. Wpisz imię i nazwisko osoby obdarowanej, zabieg (lub kwotę) i ewentualnie popraw datę ważności.
3. **Pobierz JPEG** - zapisuje bon (2400 × 1500 px).
4. **Wyślij klientowi** - na telefonie otwiera systemowe udostępnianie z dołączonym plikiem (WhatsApp, Messenger, Gmail…). Na komputerze pobiera plik, kopiuje obraz do schowka i otwiera gotową wiadomość e-mail / WhatsApp do wklejenia.

Lista „Ostatnio wystawione bony” i licznik numerów są zapisywane tylko w przeglądarce, na danym urządzeniu, osobno dla każdego studia.

## Technicznie

Statyczne strony, bez zależności:

- `permanentguru/index.html`, `massage-4-you/index.html`, `massage-4-beauty/index.html` - konfiguracja studia (opcjonalnie też teksty interfejsu `ui`, waluta `currency` i format daty `formatDate`) (lista zabiegów, dane kontaktowe, treść wiadomości) i rysowanie bonu
- `assets/voucher.js`, `assets/voucher.css` - wspólna logika formularza, eksport i wygląd narzędzia

Bon jest rysowany na `<canvas>` w kolorach i fontach stron:

- Permanent Guru: magenta `#971756` / `#6E0F3E`, krem `#FAF4EE`, Georgia + Lora, motyw kwiatu
- Massage 4 You: zieleń `#2E4B37` / `#3E5A46`, akcent złoty, Cormorant Garamond + Jost, logo-sygnet
- Massage 4 Beauty: szałwiowa zieleń `#26302A` → `#3E5138`, kość słoniowa `#F4F1EA`, Cormorant Garamond + Jost, podpis Liudmyly (SVG) jako logo

Fonty są hostowane lokalnie w `assets/fonts` (z polskimi znakami). Strony mają `noindex` - to narzędzie wewnętrzne.

Hosting: GitHub Pages (gałąź `main`, katalog główny).
