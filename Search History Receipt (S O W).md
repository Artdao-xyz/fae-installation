# Search History Receipt (S.O.W)

<aside>

Visitors explore the FAE website and, at the end of their session, receive a printed receipt summarising their journey through the archive. The history then clears for the next visitor. 

Each physical receipt includes a QR code containing a deterministic seed with encoded metadata. When scanned, the QR opens a web page that reconstructs the receipt in real time using HTML/SVG

</aside>

## What Gets Captured & Printed

**Information captured during session:**

- Time and date
- Tags/Categories clicked / unclicked
- Projects and pages visited
- Mouse coordinates

**Receipt output:**

- Title: The Archive Show
- Date
- Transcript: Time + Tags, Time + Project/Page name
- Prompt: *"To guide your journey: ___"* (max 50 characters)

---

## **Receipt Printing — Technical Standard**

<aside>

Thermal receipt printers use **ESC/POS** (Epson Standard Code for Point of Sale), a binary command protocol which is the industry standard. Nearly all cheap thermal printers speak this protocol.

</aside>

Example:

![[Link to MercadoLibre](https://www.mercadolibre.com.ar/impresora-termica-xprinter-xp58iih-bluetooth-58mm-comandera-pos-tickets-alta-velocidad/p/MLA36701582#polycard_client=search-desktop&be_origin=backend&search_layout=grid&position=1&type=product&tracking_id=792ec3b6-5ffc-4d4b-9305-0b322e789785&wid=MLA1674605437&sid=search)](Search%20History%20Receipt%20(S%20O%20W)/image.png)

[Link to MercadoLibre](https://www.mercadolibre.com.ar/impresora-termica-xprinter-xp58iih-bluetooth-58mm-comandera-pos-tickets-alta-velocidad/p/MLA36701582#polycard_client=search-desktop&be_origin=backend&search_layout=grid&position=1&type=product&tracking_id=792ec3b6-5ffc-4d4b-9305-0b322e789785&wid=MLA1674605437&sid=search)

**ESC/POS capabilities:**

- Text with left / center / right alignment
- Bold, underline, limited font sizing
- ASCII divider lines (`--`, `===`)
- QR codes (most modern printers)
- Black-and-white bitmap logos / images
- Automatic paper cut at end of receipt

**ESC/POS limitations:**

- No colour
- No custom typefaces
- No complex layouts
- Fixed width: 58mm (~32 chars/line) or 80mm (~48 chars/line). All design must fit within this constraint

**Why ESC/POS over plain text (`.txt`):**

The single most important reason for this project is **automatic paper cut**. Without ESC/POS, someone must manually tear the receipt between visitors. With ESC/POS, the printer cuts automatically after printing. QR code support (for the digital receipt link) is the second key reason.

![**Jack Butcher Self Checkout Receipt Art Basel**](Search%20History%20Receipt%20(S%20O%20W)/image%201.png)

**Jack Butcher Self Checkout Receipt Art Basel**

---

## Digital Receipt — Shareable Export

<aside>

In addition to the physical print, the same session data generates a **digital receipt**. 

</aside>

The installation generates a unique receipt and prints it on thermal paper. Each receipt includes a QR code containing encoded metadata as a deterministic seed.

When scanned, the QR opens a web page that reconstructs the receipt in real time using HTML/SVG. No images or records are stored in a database, the digital version is generated directly from the data embedded in the QR code when the page is opened.

Example: when scanned, the QR code opens `https://futureartecosystems.org/view?seed=48392&activity=23&focus=61&date=2026-06-10T15:00` (metadata can be encrypted so prettier url)

The physical receipt and its online counterpart are two manifestations of the same underlying dataset.

![**Jack Butcher Self Checkout Receipt Art Basel**](Search%20History%20Receipt%20(S%20O%20W)/image%202.png)

**Jack Butcher Self Checkout Receipt Art Basel**

---

## Frontend Updates

- Add Buttons: Print / Start Session Over
- Hide: About, Glossary, Latest Updates, Subscribe, callouts at the top, Activity, Mode, Artists, Networks, Fellowships, R&D Projects, FAE Briefings.
- Deactivate external links.

## Backend Updates

**the Vercel backend cannot directly print to a physical receipt printer**. Vercel functions run in the cloud and have no access to USB devices or machines inside the exhibition space. 

The backend runs on the same FAE Website

`Browser → App POST /api/print → ESC/POS Enconding → Printer (USB / Network)`

The Next.js server runs on the same physical machine as the printer (or same local network if the printer has an IP). This is the expected setup for a physical installation.

> **Note:** This only works when running locally (`npm run start` / `dev`). If the app were deployed to Vercel, it would have no access to the local printer, but for a physical installation this is not an issue.
> 

**Recommended libraries:**

- [`node-thermal-printer`](https://www.npmjs.com/package/node-thermal-printer) — high-level ESC/POS abstraction for Node.js
- [`escpos`](https://www.npmjs.com/package/escpos) — lower-level alternative with broad printer support