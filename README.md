# Bon podarunkowy - generator

Narzędzie do wystawiania imiennych bonów podarunkowych dla dwóch studiów w Poznaniu:

- **Permanent Guru** (permanentguru.com) - bon na zabieg, ważny 6 miesięcy
- **Massage 4 You** (massage-4-you.com) - voucher na zabieg lub kwotę

## Jak używać

1. Wybierz studio przełącznikiem u góry.
2. Numer bonu podpowiada się sam (`PG-2026-001`, `M4Y-2026-001`, …) - przycisk **Nowy** daje kolejny wolny numer. Można go też wpisać ręcznie.
3. Wpisz imię i nazwisko osoby obdarowanej, zabieg (lub kwotę) i ewentualnie popraw datę ważności.
4. **Pobierz JPEG** - zapisuje bon (2400 × 1500 px).
5. **Wyślij klientowi** - na telefonie otwiera systemowe udostępnianie z dołączonym plikiem (WhatsApp, Messenger, Gmail…). Na komputerze pobiera plik, kopiuje obraz do schowka i otwiera gotową wiadomość e-mail / WhatsApp do wklejenia.

Lista „Ostatnio wystawione bony” i licznik numerów są zapisywane tylko w przeglądarce, na danym urządzeniu.

## Technicznie

Jedna statyczna strona (`index.html`), bez zależności. Bon jest rysowany na `<canvas>` w kolorach i fontach stron:

- Permanent Guru: magenta `#971756` / `#6E0F3E`, krem `#FAF4EE`, Georgia + Lora, motyw kwiatu
- Massage 4 You: zieleń `#2E4B37` / `#3E5A46`, akcent złoty, Cormorant Garamond + Jost, logo-sygnet

Fonty są hostowane lokalnie w `assets/fonts` (z polskimi znakami). Strona ma `noindex` - to narzędzie wewnętrzne.

Hosting: GitHub Pages (gałąź `main`, katalog główny).
