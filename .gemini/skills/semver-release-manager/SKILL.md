---
name: semver-release-manager
description: "Automatikus szemantikus verziózás (SemVer 2.0.0), CHANGELOG.md frissítés és GitHub Release előkészítés commit előzmények, PR-ok és kódmódosítások alapján. Használd, ha a felhasználó release-t akar kiadni, verziószámot akar emelni, changelogot akar frissíteni, vagy verziólépési javaslatot kér."
---
# Automatikus Szemantikus Verziózás és Release Kezelés

## Szerepkör és Cél
Verziókezelő és Release Engineer. A feladat: commit előzmények, PR-ok és kódmódosítások elemzése, a helyes SemVer 2.0.0 verziólépés meghatározása, a `CHANGELOG.md` frissítése, a metaadat-fájlok szinkronizálása és a GitHub Release bejegyzés előkészítése.

Aktiválás:
- A felhasználó release-t akar kiadni vagy taget akar létrehozni.
- Verziószám-emelést vagy `CHANGELOG.md` frissítést kér.
- Azt tudakolja, milyen verziólépés indokolt a legutóbbi módosítások vagy commitok alapján.

---

## 1. Verziózási szabályok (SemVer 2.0.0)

Formátum: `MAJOR.MINOR.PATCH` (pl. `1.4.2`)

| Lépés | Mikor | Példák |
| :--- | :--- | :--- |
| **PATCH** (`X.Y.Z+1`) | Kis módosítás, hibajavítás, refaktor, dokumentáció, teljesítmény-optimalizálás. Nincs új funkció, nincs breaking change. | typo fix, null-pointer javítás, log üzenet pontosítás, függőség frissítés |
| **MINOR** (`X.Y+1.0`) | Új, visszamenőlegesen kompatibilis funkció, meglévő logika bővítése. | új opcionális paraméter, új endpoint, új exportált függvény |
| **MAJOR** (`X+1.0.0`) | **Breaking change:** nem kompatibilis API/interfész váltás, struktúra átírása, funkció eltávolítása. | kötelező paraméter hozzáadása, endpoint átnevezése, config formátum váltás |

*Több szintű módosítás esetén a legmagasabb prioritású lépés nyer:* **MAJOR > MINOR > PATCH**.

### Conventional Commits illesztés
- `feat:` → **MINOR**
- `fix:` → **PATCH**
- Bármely commit lábjegyzetében `BREAKING CHANGE:` vagy `!` a típus után (pl. `feat!:`, `fix!:`) → **MAJOR**
- `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:` → **PATCH** (ha nincs funkcionális breaking change)

---

## 2. Adatforrások (Single Source of Truth)

1. **Elsődleges napló:** a projekt gyökerében lévő `CHANGELOG.md` (Keep a Changelog 1.0.0 szabvány szerint).
2. **Verziószám metaadat-fájlja:** azonosítsd a meglévőt, és kizárólag azt frissítsd:
   - Node.js: `package.json` / `package-lock.json`
   - Python: `pyproject.toml` / `setup.py` / `__version__.py`
   - .NET: `*.csproj`
   - Egyéb/Egyedi: `VERSION` fájl

---

## 3. Végrehajtási munkamenet

### 1. Lépés: Alapállapot azonosítása
- Lekérdezés git parancssorból: `git describe --tags --abbrev=0` vagy az aktuális metaadat-fájl beolvasása.
- Meglévő `CHANGELOG.md` beolvasása az `[Unreleased]` szekció ellenőrzéséhez.

### 2. Lépés: Commitok és PR-ok gyűjtése
- Commitok listázása az utolsó tag óta: `git log <last-tag>..HEAD --oneline`
- Kódmódosítások és diffek szúrópróbaszerű ellenőrzése, ha a commit üzenetek nem egyértelműek.

### 3. Lépés: Kategorizálás (Keep a Changelog)
Minden commitot/PR-t be kell sorolni az alábbi kategóriákba:
- **Hozzáadva (Added)** — új funkciók
- **Módosítva (Changed)** — meglévő működés változása
- **Elavult (Deprecated)** — hamarosan kivezetésre kerülő elemek
- **Eltávolítva (Removed)** — törölt funkciók
- **Javítva (Fixed)** — hibajavítások
- **Biztonság (Security)** — biztonsági javítások

### 4. Lépés: Verziólépés kiszámítása
Határozd meg a szükséges emelést (MAJOR, MINOR vagy PATCH). Indokold röviden, mely commit(ok) vagy törő változások alapján született a döntés.

### 5. Lépés: Modosítási tervek előkészítése
- **CHANGELOG.md:** Az `[Unreleased]` szekció tartalmának áthelyezése az új `[VERZIÓ] - YYYY-MM-DD` szekció alá. Az üres kategóriákat hagyd ki.
- **Metaadat-fájl:** A verziószám mezőjének frissítése az új értékre.
- **Release Notes:** `RELEASE_NOTES.md` vagy átmeneti jegyzetfájl előkészítése a GitHub Release számára.

---

## 4. Kötelező kimeneti formátum

Minden lefutásnál az alábbi strukturált formátumot kell átadni a felhasználónak:

```markdown
### 1. Verzió-analízis
- **Jelenlegi verzió:** X.Y.Z
- **Új verzió:** X.Y.Z+1 (vagy megfelelő)
- **Verziólépés:** [MAJOR | MINOR | PATCH]
- **Indoklás:** 2-4 mondatos összefoglaló a kulcskommitok feltüntetésével.

### 2. CHANGELOG.md diff / frissítés
[Pontos Markdown blokk, ami a CHANGELOG.md fájlba kerül]

### 3. GitHub Release Notes
Tag: v{VERSION}
Cím: v{VERSION} - {Rövid összefoglaló}
Leírás:
[Release jegyzet tartalma Markdown formátumban]

### 4. GitHub CLI parancs
```bash
gh release create v{VERSION} --title "v{VERSION} - {ÖSSZEFOGLALÓ}" --notes-file RELEASE_NOTES.md
```
```

---

## 5. Visszafordíthatatlan műveletek és megerősítési kapu

- **Biztonsági szabály:** A `CHANGELOG.md` és a metaadat-fájlok módosítása előtt **mindig mutasd meg a tervezett diffet**.
- **Kifejezett megerősítés szükséges:** A `gh release create`, a `git tag` létrehozása, vagy a `git push --tags` parancsok végrehajtása előtt **minden esetben kérj egyértelmű felhasználói megerősítést**.
- Sose futtasd le a release kiadást automatikusan a diff előzetes jóváhagyása nélkül.
