# Majstr — Manuálny testovací checklist

> Testovacia URL: https://majster.onrender.com
> Dátum testu: ___________
> Tester: ___________

---

## 1. Registrácia cez Email + Heslo

- [ ] Otvoriť `/auth/register`
- [ ] Zadať meno, priezvisko, email (`+test` alias), heslo (min. 8 znakov)
- [ ] Kliknúť **Zaregistrovať sa**
- [ ] Skontrolovať: presmerovanie na dashboard alebo výber roly
- [ ] Skontrolovať: e-mail **"Overte váš email — Majstr"** prišiel do schránky
- [ ] Kliknúť na odkaz v e-maile
- [ ] Skontrolovať: stránka `/auth/verify-email` zobrazí **"Váš e-mail bol úspešne overený!"**
- [ ] Kliknúť **Prihlásiť sa** → správny presun na login

---

## 2. Registrácia cez Google OAuth

- [ ] Otvoriť `/auth/register` alebo `/auth/login`
- [ ] Kliknúť **Prihlásiť sa cez Google**
- [ ] Vybrať Google účet
- [ ] Skontrolovať: presmerovanie na `/auth/choose-role` (pre nového používateľa)
- [ ] Vybrať rolu (Klient alebo Majster)
- [ ] Skontrolovať: presmerovanie na dashboard
- [ ] Skontrolovať: privítací e-mail **"Vitajte na Majstr! 🎉"** prišiel do schránky

---

## 3. Prihlásenie

### 3a. Email + Heslo
- [ ] Otvoriť `/auth/login`
- [ ] Zadať správny email a heslo → kliknúť **Prihlásiť sa**
- [ ] Skontrolovať: presmerovanie na `/dashboard`
- [ ] Zadať nesprávne heslo → skontrolovať chybová správa: **"Nesprávny e-mail alebo heslo"**

### 3b. Google OAuth
- [ ] Kliknúť **Prihlásiť sa cez Google**
- [ ] Vybrať existujúci Google účet
- [ ] Skontrolovať: presmerovanie na dashboard (bez výberu roly)

---

## 4. Zabudnuté heslo

- [ ] Otvoriť `/auth/forgot-password`
- [ ] Zadať email **existujúceho email+heslo účtu**
- [ ] Kliknúť **Nadoslať posielanie**
- [ ] Skontrolovať: správa **"Ak tento e-mail existuje, bol naň odoslaný odkaz..."**
- [ ] Skontrolovať: e-mail **"Obnovenie hesla — Majstr"** prišiel do schránky
- [ ] Kliknúť na odkaz v e-maile → otvorí sa `/auth/reset-password?token=...`
- [ ] Zadať nové heslo (min. 8 znakov) → kliknúť **Obnoviť heslo**
- [ ] Skontrolovať: správa o úspešnom obnovení + presmerovanie na login za 3 sekundy
- [ ] Prihlásiť sa s novým heslom → funguje ✓

### Edge cases
- [ ] Zadať neexistujúci email → správa je rovnaká (žiadna informácia o existencii účtu)
- [ ] Zadať email Google účtu (bez hesla) → žiadny e-mail sa neodošle, správa rovnaká

---

## 5. Výber roly

- [ ] Po registrácii cez Google otvoriť `/auth/choose-role`
- [ ] Kliknúť **Som klient** → presmerovanie na dashboard, rola = CLIENT
- [ ] (Nový účet) Kliknúť **Som majster** → presmerovanie na dashboard, rola = MASTER

---

## 6. Profil používateľa

- [ ] Prihlásiť sa → otvoriť `/profile`
- [ ] Zmeniť meno / priezvisko / telefón / bio → uložiť
- [ ] Skontrolovať: zmeny sú viditeľné po obnovení stránky
- [ ] Nahrať profilovú fotku → zobrazí sa nová fotka v navigácii
- [ ] Kliknúť **Vymazať účet** → potvrdiť → presmerovanie na `/` (odhlásenie)

---

## 7. Kategórie a Služby (verejné)

- [ ] Otvoriť `/services` bez prihlásenia
- [ ] Skontrolovať: zoznam kategórií (Inštalatérstvo, Elektrikár, Maľovanie, atď.)
- [ ] Kliknúť na kategóriu → zoznam služieb v kategórii
- [ ] Kliknúť na službu → detail majstra a možnosť rezervácie

---

## 8. Majster — správa služieb

> Prihlásiť sa ako MASTER účet

- [ ] Otvoriť `/dashboard`
- [ ] Kliknúť **Pridať službu**
- [ ] Vyplniť názov, popis, cenu, kategóriu → uložiť
- [ ] Skontrolovať: nová služba sa objaví v zozname
- [ ] Upraviť existujúcu službu → uložiť → zmeny viditeľné
- [ ] Vymazať službu → zmizne zo zoznamu
- [ ] Skontrolovať: vlastné služby viditeľné na `/masters/:id`

---

## 9. Rezervácia (booking)

> Prihlásiť sa ako CLIENT účet

- [ ] Nájsť majstra cez `/services` alebo `/masters`
- [ ] Otvoriť detail majstra → kliknúť **Rezervovať**
- [ ] Vybrať dátum a čas **v budúcnosti**
- [ ] Potvrdiť rezerváciu
- [ ] Skontrolovať: e-mail klientovi **"Rezervácia prijatá: [Služba]"** prišiel
- [ ] Skontrolovať: e-mail majstrovi **"Nová rezervácia: [Služba]"** prišiel
- [ ] Otvoriť `/dashboard` → rezervácia viditeľná so stavom **PENDING**

### Edge case
- [ ] Pokúsiť sa rezervovať čas v minulosti → chybová správa: **"Čas rezervácie musí byť v budúcnosti"**

---

## 10. Správa rezervácií — Majster

> Prihlásiť sa ako MASTER účet

- [ ] Otvoriť `/dashboard` → záložka rezervácie
- [ ] Zobraziť rezerváciu so stavom PENDING
- [ ] Kliknúť **Potvrdiť** → stav zmení na CONFIRMED
- [ ] Skontrolovať: e-mail klientovi **"Rezervácia potvrdená"** prišiel
- [ ] Kliknúť **Zrušiť** na inej rezervácii → stav CANCELLED
- [ ] Skontrolovať: e-mail klientovi **"Rezervácia zrušená"** prišiel
- [ ] Kliknúť **Dokončiť** → stav COMPLETED
- [ ] Skontrolovať: e-mail klientovi **"Rezervácia dokončená"** prišiel

---

## 11. Odhlásenie

- [ ] Kliknúť na avatar / menu → **Odhlásiť sa**
- [ ] Skontrolovať: presmerovanie na `/`
- [ ] Skontrolovať: chránené stránky (`/dashboard`, `/profile`) presmerujú na `/auth/login`

---

## 12. Bezpečnosť — Rate limiting

- [ ] Zadať nesprávne heslo **6×** za sebou
- [ ] Skontrolovať: odpoveď **"Príliš veľa pokusov. Skúste to o chvíľu"** (429)
- [ ] Počkať 15 minút → pokus opäť funguje

---

## 13. Email notifikácie — súhrnný prehľad

| Udalosť | Príjemca | Predmet |
|---|---|---|
| Registrácia email+heslo | Klient | Overte váš email — Majstr |
| Registrácia cez Google | Klient | Vitajte na Majstr! 🎉 |
| Zabudnuté heslo | Klient | Obnovenie hesla — Majstr |
| Nová rezervácia | Majster | Nová rezervácia: [Služba] |
| Nová rezervácia | Klient | Rezervácia prijatá: [Služba] |
| Potvrdenie rezervácie | Klient | Rezervácia potvrdená: [Služba] |
| Zrušenie rezervácie | Klient | Rezervácia zrušená: [Služba] |
| Dokončenie rezervácie | Klient | Rezervácia dokončená: [Služba] |

---

## 14. UI / UX kontrola

- [ ] Mobilný pohľad (DevTools → 375px) — všetky stránky čitateľné
- [ ] Chybové správy sú po **slovensky** (žiadna anglická chyba v toastri)
- [ ] Prehliadač **neponúka preklad** stránky (notranslate funguje)
- [ ] Favicon zobrazuje **M** ikonu (nie Nx logo)
- [ ] Načítanie po prebudení Render (~30s prvý request) — spinner viditeľný

---

## Výsledok testu

| Sekcia | Stav | Poznámky |
|---|--|---|
| 1. Registrácia email | ✅ | |
| 2. Registrácia Google | ✅ | |
| 3. Prihlásenie | ✅ | |
| 4. Zabudnuté heslo | ✅ | |
| 5. Výber roly | ✅ | |
| 6. Profil | ✅ | |
| 7. Kategórie & Služby | ✅ | |
| 8. Majster — služby | ✅ | |
| 9. Rezervácia | ✅ | |
| 10. Správa rezervácií | ✅ | |
| 11. Odhlásenie | ✅ | |
| 12. Rate limiting | ✅ | |
| 13. Emaily | ✅ | |
| 14. UI/UX | ⬜ | |
