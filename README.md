# 🎉 Kender du Katrine?

En mobilvenlig, live fest-quiz. Værten opretter et spil og får en 4-cifret
kode. Spillerne deltager fra deres egen telefon. Én spiller er "Katrine" —
hendes svar bliver automatisk det rigtige svar hver runde, og alle der
gætter det samme som hende, får point.

Denne guide er skrevet, så du kan følge den trin for trin, selvom du aldrig
har brugt Supabase eller Vercel før. Der er ingen genveje — følg
punkterne i rækkefølge.

---

## Sådan virker spillet

1. Værten opretter et spil og får en 4-cifret kode.
2. Spillerne åbner siden på deres telefon, indtaster koden og deres navn.
3. Værten vælger hvem af spillerne der er "Katrine".
4. Værten starter spørgsmål 1. Alle — også Katrine — svarer hemmeligt.
   Ingen kan se andres svar endnu.
5. Værten lukker afstemningen. Katrines svar bliver det "rigtige" svar.
   Alle andre, der svarede det samme som hende, får 1 point. Katrine får
   aldrig point selv.
6. Svarfordelingen og stillingen vises for alle.
7. Værten går videre til næste spørgsmål — kun værten kan gøre dette.
8. Efter 10 spørgsmål vises den endelige stilling.

Hvis en spiller (eller værten) opdaterer siden eller mister forbindelsen,
kan de bare åbne linket igen — de bliver automatisk genkendt og kommer
tilbage til spillet, hvor de var.

### Fælles skærm (til TV'et)

Fra værtens side kan du trykke **"📺 Åbn fælles skærm"** — det åbner en
separat, rent visuel side (`/host/<kode>/screen`) uden knapper, lavet til
at blive vist på et TV. Send den til fjernsynet med AirPlay (fra en
iPhone/iPad/Mac til et AppleTV) eller ved at slutte en iPad til TV'et med
et HDMI-kabel — begge dele er almindelig skærmspejling og kræver intet
ekstra fra appen. Den fælles skærm viser QR-kode til at deltage, hvem der
har svaret, svarfordeling, "fun facts" om streaks/hurtigste svar, samt
priser til allersidst.

---

## Hvad du skal bruge

- En computer med [Node.js](https://nodejs.org) installeret (version 20 eller nyere).
- En gratis konto hos [Supabase](https://supabase.com) — det er her spillets
  data (spil, spillere, svar) gemmes og opdateres live.
- (Til udgivelse på nettet) en gratis konto hos [Vercel](https://vercel.com).

Du opretter selv disse to konti — det er noget, du skal gøre manuelt i din
browser, det kan ikke gøres for dig.

---

## Trin 1 — Opret et Supabase-projekt

1. Gå til [supabase.com](https://supabase.com) og klik **"Start your project"**.
   Opret en gratis konto (fx med din Google-konto eller e-mail).
2. Klik **"New project"**.
3. Udfyld:
   - **Name**: fx `kender-du-katrine`
   - **Database Password**: vælg en adgangskode og gem den et sikkert sted
     (du skal ikke bruge den i denne guide, men gem den alligevel).
   - **Region**: vælg gerne en i nærheden af Danmark, fx `West EU (Ireland)`.
4. Klik **"Create new project"** og vent 1-2 minutter mens Supabase gør
   projektet klar.

### Opret databasen

5. I venstremenuen, klik på **"SQL Editor"**.
6. Klik **"New query"**.
7. Åbn filen [`supabase/schema.sql`](supabase/schema.sql) fra dette projekt,
   kopiér **hele indholdet**, og indsæt det i SQL-editoren i Supabase.
8. Klik **"Run"** (eller tryk Cmd/Ctrl+Enter). Du bør se "Success. No rows
   returned". Det opretter alle tabeller og sikkerhedsregler, appen skal
   bruge.

### Find dine nøgler

9. I venstremenuen, klik på tandhjulet **"Project Settings"**, og derefter
   **"API"** (eller **"API Keys"** afhængigt af Supabase-version).
10. Du skal bruge tre værdier herfra:
    - **Project URL** (starter med `https://` og slutter på `.supabase.co`)
    - **anon / public** nøglen (en lang tekststreng)
    - **service_role** nøglen (en anden lang tekststreng — hold denne
      hemmelig, del den aldrig, og læg den aldrig ud på GitHub)

Behold denne fane åben — du skal bruge de tre værdier om lidt.

---

## Trin 2 — Kør appen lokalt på din computer

Åbn en terminal i projektmappen og kør:

```bash
npm install
```

Kopiér miljøvariabel-skabelonen:

```bash
cp .env.example .env.local
```

Åbn `.env.local` i en teksteditor og indsæt de tre værdier fra Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dit-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-nøgle
SUPABASE_SERVICE_ROLE_KEY=din-service-role-nøgle
```

Start udviklingsserveren:

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser. Klik
"Vær vært for et spil" for at oprette et spil, og prøv at deltage fra en
anden fane (eller din telefon, hvis den er på samme wifi — brug din
computers lokale IP-adresse i stedet for `localhost`, fx
`http://192.168.1.5:3000`).

---

## Trin 3 — Kør de automatiske tests

```bash
npm test
```

Det kører tests for pointberegningen (Katrines svar bliver korrekt,
Katrine får aldrig point selv, osv.), genoprettelse af forbindelse ved
refresh, og at kun værten kan starte/lukke/gå videre i spillet.

---

## Valgfrit — AI-genereret sjovt indhold i lobbyen

Uden noget ekstra opsætning viser lobbyen automatisk nogle faste, sjove
beskeder, mens folk venter. Hvis du i stedet vil have **rigtige,
AI-genererede** beskeder (nye hver gang), skal du oprette en gratis konto
hos Anthropic og hente en nøgle — det koster typisk under en krone for en
hel fest.

1. Gå til [console.anthropic.com](https://console.anthropic.com) og opret en konto
2. Læg et lille beløb ind under **"Billing"** (fx $5 er rigeligt)
3. Gå til **"API Keys"** i venstremenuen, klik **"Create Key"**, og kopiér nøglen
   (den starter med `sk-ant-...` — du kan kun se den én gang, så gem den et
   sikkert sted)
4. Åbn `.env.local` og indsæt den:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-din-nøgle-her
   ```
5. Genstart `npm run dev`

Hvis du springer dette over, virker alt stadig — lobbyen bruger bare de
faste beskeder i stedet.

---

## Trin 4 — Læg appen ud på nettet med Vercel

1. Læg koden i et GitHub-repository (hvis du ikke allerede har gjort det):
   ```bash
   git add .
   git commit -m "Første version af Kender du Katrine"
   ```
   Opret derefter et nyt, tomt repository på [github.com/new](https://github.com/new),
   og følg instruktionerne GitHub viser dig for at skubbe koden op
   (`git remote add origin ...` + `git push`).
2. Gå til [vercel.com](https://vercel.com), opret en gratis konto (du kan
   logge ind med din GitHub-konto), og klik **"Add New..." → "Project"**.
3. Vælg dit GitHub-repository og klik **"Import"**.
4. Under **"Environment Variables"**, tilføj de samme værdier som i
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY` (kun hvis du har sat AI-lobbybeskeder op — se ovenfor)
5. Klik **"Deploy"**. Efter 1-2 minutter får du et link, fx
   `https://kender-du-katrine.vercel.app` — del det med dine gæster.

Herefter kan du altid opdatere appen ved at pushe nye commits til GitHub —
Vercel bygger og udgiver automatisk den nye version.

---

## Under selve festen

1. Værten åbner appen på sin telefon/laptop og klikker "Vær vært for et
   spil" for at få en 4-cifret kode.
2. Værten viser koden frem (højt op, eller del den i en besked).
3. Alle gæster — inklusive Katrine — går ind på siden, klikker "Deltag i et
   spil", og indtaster koden og deres navn.
4. Værten vælger i lobbyen, hvem der er Katrine, og kan om ønsket redigere
   de 10 spørgsmål (tryk "Rediger spørgsmål").
5. Værten trykker "Start spil" og styrer resten af aftenen — luk afstemning
   → se resultatet → næste spørgsmål, indtil alle 10 spørgsmål er
   gennemgået.

---

## Teknisk opbygning (for dig, der vil kigge i koden)

- **Next.js (App Router) + TypeScript** — sider under `app/`, API-routes
  under `app/api/`.
- **Supabase Postgres + Realtime** — `supabase/schema.sql` indeholder hele
  databasestrukturen. Spillere/vært får live-opdateringer via Supabase
  Realtime (`hooks/useGameRealtime.ts`).
- **Ingen login**: værten får et hemmeligt "host-token" og hver spiller får
  et hemmeligt "player-token" i deres browsers `localStorage`. Det bruges
  til at genkende dem, hvis de opdaterer siden (`lib/storage.ts`).
- **Sikkerhed uden konti**: al skrivning (oprette spil, svare, gå videre)
  sker via serverens API-routes med Supabases "service role"-nøgle. Den
  offentlige "anon"-nøgle i browseren har kun læseadgang, og reglerne i
  `supabase/schema.sql` forhindrer specifikt, at nogen kan læse andres
  svar på det aktuelle spørgsmål, før værten har lukket afstemningen.
- **Pointlogik**: den rene, testbare funktion ligger i `lib/scoring.ts` og
  er dækket af `tests/scoring.test.ts`.
- **Tests**: `tests/scoring.test.ts` (pointberegning), `tests/reconnect.test.ts`
  (genopret forbindelse), `tests/hostControls.test.ts` (kun værten kan
  styre spillet, korrekte tilstandsovergange), `tests/insights.test.ts`
  (streaks, hurtigste-svar og aftenens priser).
- **Billeder**: uploades via `app/api/games/[code]/upload-image` til en
  offentlig Supabase Storage-bøtte ("question-images"), oprettet af
  `supabase/schema.sql`.

## Fejlfinding

- **"Mangler NEXT_PUBLIC_SUPABASE_URL..."** — du mangler `.env.local`, eller
  har ikke udfyldt den. Se Trin 2.
- **Spillerne ser ikke opdateringer live** — tjek at du har kørt hele
  `supabase/schema.sql` i Supabase SQL Editor (det slår bl.a. Realtime til
  for de nødvendige tabeller).
- **"Kun værten kan gøre dette"** — du prøver at styre spillet fra en
  browser, der ikke oprettede det. Åbn spillet i den browser/fane, hvor du
  trykkede "Opret nyt spil".
- **Har du opdateret appen med nye funktioner (billeder, avatarer, m.m.)?**
  Kør `supabase/schema.sql` igen i Supabase SQL Editor — filen er lavet til
  trygt at kunne køres igen og igen, og tilføjer kun det nye.
