# E3 Compass Field Guides

Practical operating guides for E3 Lead Operating Partners, one per Compass capability. Each guide ships in three formats:

- `E3_Compass_[Module]_Field_Guide.md` — the structured source (single source of truth)
- `E3_Compass_[Module]_Field_Guide.html` — the branded, self-contained HTML edition
- `E3_Compass_[Module]_Field_Guide.pdf` — the print-ready PDF (US Letter, page numbers, selectable text)

The HTML and PDF are self-contained and need nothing installed to read. The build tooling below is only needed to regenerate them from the Markdown.

## Brand

The guides use the E3 brand system from `e3-brand-assets`: E3 Navy `#052652` as the primary, the neutral ramp for text and rules, the official vector E3 monogram (inlined as SVG), and Gilroy for type (Gilroy ExtraBold headings, Gilroy Light body).

### Gilroy

The guides request Gilroy first in the font stack, so on any machine or server that has Gilroy installed they render in Gilroy. To embed true Gilroy in the generated HTML and PDF, drop the licensed font files into `assets/`:

```
assets/Gilroy-Light.otf
assets/Gilroy-ExtraBold.otf
```

then rebuild. Until then the guides fall back to a geometric sans (Montserrat, embedded in `assets/`) that matches Gilroy's proportions and the two-weight system. Keep the E3 Gilroy EULA receipt on file, per the brand asset notes.

## Regenerating

Requires Node and two build-only packages (`marked`, `playwright-core`). The PDF renders through the environment's pre-installed Chromium.

```bash
npm i -D marked playwright-core
# HTML from Markdown
node docs/field-guides/build.js docs/field-guides/E3_Compass_Governance_Field_Guide.md
# PDF from HTML (point CHROMIUM_PATH at a Chromium/Chrome binary)
CHROMIUM_PATH=/path/to/chromium node docs/field-guides/render-pdf.js docs/field-guides/E3_Compass_Governance_Field_Guide.html
```

`build.js` takes the Markdown path, an optional output path, and an optional module name. `render-pdf.js` takes the HTML path and an optional output path.

## Source discipline

Guides are written from the E3 Compass knowledge base (Core Knowledge, Plays, Tools, Question Bank, engagement model). They reflect E3's current operating point of view. Where the source does not yet establish an E3 position, the guide carries an explicit `[E3 INPUT REQUIRED]` note rather than filling the gap with generic advice. Working examples are drawn from real engagements and anonymized; no Member names, customers, or figures appear.
