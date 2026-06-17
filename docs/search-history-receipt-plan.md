# Search History Receipt — Implementation Plan

**Status:** Phase 1–2 complete · Phase 3 partial  
**Hardware:** [Tiny Thermal Receipt Printer CSN-A4L](https://thepihut.com/products/tiny-thermal-receipt-printer-ttl-serial-usb) (58mm, ESC/POS, QR) on Raspberry Pi via USB  
**Reference:** [Search History Receipt S.O.W.](../Search%20History%20Receipt%20(S%20O%20W).md)

---

## Overview

Visitors explore the FAE archive during a session. Staff print a thermal receipt summarising their journey, then reset for the next visitor. A QR code on the receipt links to a digital version generated from embedded session data — no database.

```
Browser (exhibition)  →  POST /api/print  →  ESC/POS on same machine  →  USB  →  thermal printer
        ↓
  HTML receipt preview + QR (works without printer)
```

**Installation flag:** `NEXT_PUBLIC_FAE_INSTALLATION_MODE=1`

**Session data:** in-memory only for the active visit. Refresh or reset clears it — by design, no `sessionStorage`.

---

## What we built differently from the original plan

| Original plan | As built |
|---------------|----------|
| Print / Reset in sidebar | **Start** dialog first, then **Print** + **Start session over** fixed **bottom-centre** (outside sidebar) |
| Sidebar auto-opens on load | **Stays closed** until the visitor opens it |
| QR links to `/view?d=…` | QR links to **`/v?d=…`** (`/view` also works) |
| QR payload v1 | **v2** — compact timestamps, indexed taxonomies, optional path grid (`m`, `st`, `en`) |
| Mouse coordinates (open) | **16×10 grid** sampled every 120ms → **star map** on receipt |
| Journey prompt max 50 chars | **150 chars**, wrapped at 32 chars for thermal width |
| Phase 3 optional path + prompt | Path **done**; **poetic prompt** derived from path shape, tags, or pages |
| Gray / opacity in star map | **Thermal-safe:** solid black only, **size** encodes dwell time |
| Keep Search, Focus, **Format** | Desktop install: Search + Focus only. Mobile install: **Focus only** (Format not yet restored) |
| `sessionStorage` backup | **Not used** — sessions are ephemeral |

### Receipt layout (top → bottom)

1. Title — *The Archive Show*
2. Date
3. Transcript — `HH:MM` + tag or project per line
4. QR code
5. Journey line — *To guide your journey: …*
6. Star map — pointer path (when recorded)

Digital preview uses a **1.75×** scale variant; thermal width stays 58mm.

---

## Phase 1 — Tracking, stripped UI, receipt preview ✓

### Session tracking
- In-memory store via `SessionReceiptProvider`, instrumented in `FilterSelectionContext`
- Events: tag on/off (Focus, Activity, Format, Network, Artist), project/page opens
- Pointer path: 16×10 grid while recording (`MousePathTracker`)
- Flow: **Start** → explore → **Print** → preview modal (+ print attempt) → **Start session over**

### Installation UI
Removed when installation mode is on: About, Glossary, Latest Updates, Subscribe, top callouts, Activity, Artists, Networks, Fellowships, R&D, FAE Briefings, external links.

### Receipt output
- HTML preview modal (`ReceiptPreviewModal` + `ReceiptPaper`)
- 58mm / ~32 chars per line
- Printer offline → preview still works, status message shown

### Print (local USB) ✓
- `POST /api/print` → ESC/POS via `node-thermal-printer` when `RECEIPT_PRINTER_INTERFACE` is set
- Star map rasterized to 1-bit bitmap (same geometry as on-screen SVG)
- Optional `RECEIPT_PRINTER_URL` to forward JSON to a remote helper
- If printer unreachable: preview still works, offline message shown

---

## Phase 2 — Digital companion ✓

- `/view?d=…` and `/v?d=…` decode QR payload → `ReceiptPaper`
- Payload: `sessionStart`, `sessionEnd`, events, `prompt`, optional `path`; `seed` derived on decode
- `NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL` or `/api/receipt-origin` for LAN phone scanning

---

## Phase 3 — Aesthetic and generative (partial)

| Item | Status |
|------|--------|
| Mouse-path star map | ✓ Done |
| Poetic journey prompt | ✓ Done — **Tag Fortune** from dominant Focus tag |
| Branded thermal layout (logo, etc.) | Not started |
| Extra generative SVG beyond star map | Not started |

---

## Physical printing

**No Raspberry Pi required.** You need any computer at the exhibition with the printer plugged in via USB (Mac mini, laptop, NUC, Pi — anything that can run `npm run start`).

Browsers cannot access USB printers directly. The app runs **locally** on the exhibition machine; `POST /api/print` turns the receipt into **ESC/POS** (the printer’s binary language) and sends it over USB.

```
┌──────────────────────────────────────────────────────────┐
│  Exhibition computer (same box as the printer USB cable)   │
│                                                          │
│  Browser  →  Next.js /api/print  →  ESC/POS + star bitmap │
│                                         │                │
│                                         ▼                │
│                                   USB thermal printer    │
└──────────────────────────────────────────────────────────┘
```

### Setup

1. Plug CSN-A4L into the computer running the app (5V 2A PSU on the printer).
2. Run `npm run build && npm run start` on that machine (not Vercel).
3. Set in `.env.local`:

```bash
NEXT_PUBLIC_FAE_INSTALLATION_MODE=1
RECEIPT_PRINTER_INTERFACE=/dev/usb/lp0          # Linux
# RECEIPT_PRINTER_INTERFACE=printer:Receipt_Printer   # macOS CUPS name
```

4. Click **Print** — receipt prints with text, QR, journey line, and **star map bitmap**.

### Star map on paper

`src/lib/session-receipt/thermal-print/star-raster.ts` rasterizes the same star placements as the on-screen SVG to a **1-bit bitmap** (solid black, size = dwell time) and embeds it in the ESC/POS stream via `print-receipt.ts`.

### Fallback: remote print URL

If you prefer a separate print helper process, set `RECEIPT_PRINTER_URL` — `/api/print` forwards JSON there instead. The built-in `RECEIPT_PRINTER_INTERFACE` path is simpler for a single machine + USB printer.

---

## Tag Fortune

Printed as: **To guide your journey:** *…* (max 150 characters)

1. **Tally** Focus tag interactions during the session:
   - `+1` each time a Focus tag is turned **on** (searched)
   - `+1` each Focus tag on a **project/page opened** (read)
2. **Pick** the tag with the highest tally (ties → most recent interaction).
3. **Lookup** 1–2 poetic fortunes for that tag in `src/lib/session-receipt/tag-fortunes.ts`.
4. **Select** which fortune using `seed % fortuneCount` (deterministic per session).
5. **Store** in `receipt.prompt` and embed in the QR.

Fortunes are original prose — horoscope-adjacent, emotionally honest, open to interpretation. Not direct quotes from publications. Edit fortunes in `tag-fortunes.ts` as Arts Technologies copy is refined.

---

## Data contract

```ts
type SessionEvent =
  | { type: "tag"; action: "on" | "off"; label: string; taxonomy: string; ts: number }
  | { type: "page"; title: string; slug?: string; focusAreas?: string[]; ts: number };

type SessionPath = {
  visits: number[];  // 160 cells, row-major 16×10
  start: number;
  end: number;
};

type SessionReceipt = {
  sessionStart: string;
  sessionEnd?: string;
  events: SessionEvent[];
  path?: SessionPath;
  seed: number;       // derived from sessionStart + events + path
  prompt: string;     // Tag Fortune suffix, max 150 chars
};
```

QR field `v: 2` — see `src/lib/session-receipt/encode.ts`.

---

## Build order

| Step | Deliverable | Status |
|------|-------------|--------|
| 1 | Installation mode + UI removal | ✓ |
| 2 | Session tracker + instrumentation | ✓ |
| 3 | HTML receipt preview + QR | ✓ |
| 4 | `/api/print` proxy | ✓ |
| 5 | `/view` + `/v` digital page + prompt | ✓ |
| 6 | Path star map + Tag Fortune | ✓ |
| 7 | ESC/POS print + star bitmap (`RECEIPT_PRINTER_INTERFACE`) | ✓ |
| 8 | Branded thermal polish | Not started |

---

## Open decisions

1. **QR base URL** — production domain vs LAN IP (`NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL`)
2. **Printer interface** — `RECEIPT_PRINTER_INTERFACE` path or CUPS name on the exhibition machine
3. **Format filter** — restore in installation sidebar (planned but not wired)

---

## Pi setup checklist (hardware)

Use any computer with USB — Pi is optional.

- [ ] Computer at exhibition running `npm run start`
- [ ] CSN-A4L on USB to that computer
- [ ] 5V 2A PSU for printer
- [ ] 58mm thermal paper (2.25" roll)
- [ ] Confirm device: `ls /dev/usb/lp*` (Linux) or CUPS printer name (macOS)
- [ ] Set `RECEIPT_PRINTER_INTERFACE` in `.env.local`
- [ ] Test print from the app

---

## Risks

| Risk | Mitigation |
|------|------------|
| QR payload too large | Compact v2 encoding; summarise events if needed |
| Pi / printer not ready | HTML preview + QR always work |
| Printer not bus-powered | External PSU on checklist |
| Session lost on refresh | Accepted — in-memory only, no persistence |
