# Logic & Scoring Implementation Guide

Tento dokument zachycuje navrzenou logiku propojeni dotazniku, backend scoringu a mapove vizualizace tak, aby odpovedi uzivatele meli realny a okamzity dopad na selekci zemi.

## 1. Cile

1. Kazda odpoved musi mit dopad na vysledek.
2. Mapa musi reagovat v realnem case po kazde odpovedi.
3. Pravidla musi byt rozsiritelna bez prepisu cele aplikace.
4. Scoring musi byt vysvetlitelny (proc je zeme vysoko/nizko).

## 2. Aktualni stav (v projektu)

Technicke propojeni uz existuje:

1. Frontend uklada odpovedi a posila je na backend (`POST /api/filter`).
2. Backend aplikuje scoring na seznam zemi.
3. Backend vraci `remaining_countries` a `top_recommendations`.
4. Frontend mapa vykresli aktivni/inaktivni zeme podle `remaining_countries`.

Kriticka mezera:

- Pravidly je pokryta jen cast otazek, takze nektere odpovedi nemaji realny dopad na vyber zemi.

## 3. Pozadovana architektura pravidel

Kazdou odpoved mapovat na jeden ze dvou typu pravidel:

1. Hard constraints (diskvalifikacni pravidla)
   - Pokud zeme nesplni podminku, je okamzite vyrazena.
   - Pouzivat jen pro opravdu kriticke nesoulady.

2. Soft weighted preferences (vazene preference)
   - Odpoved prida vahu k jednomu nebo vice profilovym atributum.
   - Zeme nejsou vyrazeny, ale meni se jejich poradi ve vysledku.

Doporuceni:

- Hard pravidla drzet konzervativne, aby uzivatel neskoncil rychle s prazdnym seznamem.
- Vetsinu otazek modelovat jako soft rules.

## 4. Datovy model pravidel

Cilovy koncept mapovani:

- `question_id` + `option` -> sada profilovych atributu + vahy

Priklad:

- `q17: B` -> `climate_mediterranean: 1.0`
- `q39: A` -> `internet_top_tier: 1.0`
- `q54: A` -> `budget_low: 1.0`

Pro hard pravidla:

- `q4: A` vyzaduje `access_land >= threshold`

## 5. Scoring pipeline (backend)

Doporuceny vypocet v kazdem requestu:

1. Nacist odpovedi uzivatele.
2. Pro kazdou zemi:
   - Aplikovat hard constraints.
   - Pokud hard pass, spocitat weighted score.
3. Normalizovat score (0-100).
4. Seradit zeme podle score sestupne.
5. Vratit:
   - `remaining_countries` (ISO3)
   - `top_recommendations` (iso3, score, matched, considered, ...)

## 6. Propojeni na mapu

Minimalni funkcni rezim:

- Binarni zobrazeni:
  - aktivni zeme (v `remaining_countries`) = zvyraznit
  - ostatni = ztlumit

Doporuceny dalsi krok:

- Intenzita podle score:
  - vyssi score -> vyssi opacity/sytejsi barva
  - nizsi score -> nizsi opacity

Tim bude mapa nejen filtrovat, ale i vysvetlovat kvalitu shody.

## 7. Implementacni plan pro pravidla

1. Pokryt vsech 60 otazek v `backend/app/scoring.py`.
2. U kazde otazky zajistit alespon jeden realny dopad.
3. Zachovat konzistenci s atributy v `backend/data/countries_data.json`.
4. Dopsat testy po blocich otazek (`backend/tests/test_scoring.py`).
5. Prubezne overovat, ze API vraci smysluplne `remaining_countries` i `top_recommendations`.

## 8. Testovaci strategie

Minimalni sadu testu drzet nad temi scenari:

1. No answers -> nezkolabuje, vrati baseline seznam.
2. Kriticke hard pravidlo -> ocekavane zeme jsou vyrazene.
3. Kombinace soft preferenci -> poradi zemi se smysluplne meni.
4. Regrese endpointu -> `POST /api/filter` vraci validni kontrakt.

## 9. Definition of Done (DoD) pro logiku

Logika je povazovana za dostatecne implementovanou, kdyz:

1. Kazda otazka/odpoved meni filtrovani nebo scoring.
2. Frontend po kazde odpovedi zobrazi aktualizovanou mapu a shortlist.
3. Neexistuji dead options (odpoved bez efektu).
4. Testy potvrzuji stabilni chovani pravidel bez regresi.

## 10. Dalsi evoluce (po MVP)

1. Presun pravidel z Python kodu do datove konfigurace (napr. JSON), aby se menily bez redeploy backendu.
2. Pridat explainability payload (napr. nejvic matching faktory pro kazdou top zemi).
3. Zavest score heatmapu v mape.

---

## Prakticky start point pro dalsi iteraci

Nejefektivnejsi dalsi krok:

1. Dopsat chybejici mapovani pro blok `q1` az `q20`.
2. Pridat k tomu odpovidajici testy.
3. Overit na local demo stacku, ze po odpovedich realne meni se:
   - pocet `remaining_countries`
   - poradi v `top_recommendations`
   - vizualni stav mapy/fallback panelu
