# Biuro Rachunkowe Iwona Mazur: strona internetowa

Statyczna strona biura rachunkowego z Dębicy: strona główna, O nas, Usługi, Blog, Kontakt
i polityka prywatności.

## Technologia

| Co | Czym |
| --- | --- |
| Generator strony | [Astro](https://docs.astro.build) 7, `dist/` to gotowe pliki HTML |
| Style | Tailwind CSS 4, kolory w bloku `@theme static` w `src/styles/global.css` |
| Animacje | GSAP + ScrollTrigger, płynne przewijanie Lenis |
| Formularz kontaktowy | `public/contact.php` wysyła zgłoszenie na biuro@biuro-mazur.pl, wymaga PHP na serwerze |
| Przekierowania ze starej strony | `public/.htaccess` (Apache na home.pl) |

## Uruchomienie

Wymagany Node.js 22.12 lub nowszy.

```sh
npm ci
npm run dev
```

Strona działa pod `http://localhost:4321`. Formularz kontaktowy działa dopiero na serwerze
z PHP.

| Komenda | Co robi |
| --- | --- |
| `npm run dev` | serwer deweloperski z podglądem na żywo |
| `npm run build` | buduje stronę do `dist/` |
| `npm run preview` | podgląd zbudowanej strony |
| `npm run publish` | buduje stronę i wysyła `dist/` przez FTP; dane logowania w `.env` (wzór w `.env.example`) |

## Struktura

```
src/
  pages/            podstrony, jedna na plik; blog/[slug].astro to szablon wpisu
  layouts/          BaseLayout.astro: <head>, meta, dane strukturalne
  components/       nagłówek, menu, stopka, formularz, slidery
  content/blog/     wpisy na bloga w Markdownie
  data/             kontakt, nawigacja, pytania FAQ, funkcje bloga
  scripts/          animations.js (rejestr) i animations/ (poszczególne efekty)
  styles/           global.css
  assets/photos/    zdjęcia z sesji biura
  assets/client-logos/  logotypy klientów przerobione na grafit
public/             pliki kopiowane bez zmian: favicony, robots.txt, .htaccess, contact.php
scripts/publish.mjs wysyłka na serwer przez FTP
```

## Gdzie co zmienić

| Chcę zmienić | Plik |
| --- | --- |
| telefon, e-mail, adres, godziny, dane rejestrowe | `src/data/contact.js` |
| pozycje w menu i stopce | `src/data/navigation.js` |
| pytania w FAQ | `src/data/questions.js` |
| kolory | `src/styles/global.css`, blok `@theme static` |
| teksty podstrony, tytuł i opis dla Google | plik podstrony w `src/pages/` |
| wpis na blogu | nowy plik w `src/content/blog/` |
| logotypy klientów i lista „Firmy, które nam zaufały” | `src/pages/index.astro` |

Zasady pisania kodu są w `CLAUDE.md`, a lista rzeczy do domknięcia przed startem
w `PRZED_PUBLIKACJA.md`.
