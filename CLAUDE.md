# Debrecht Command Center (DCC)

## Project
- **Owner:** AO Solutions LLC (Owen Pyatt)
- **Client:** Debrecht Properties (Lorenzo Debrecht)
- **Stack:** React, Recharts, Anthropic API
- **API key:** `process.env.REACT_APP_ANTHROPIC_API_KEY`
- **Deploy:** Vercel via GitHub repo `owenpyatt-beep/dcc`

## Design tokens
All design tokens live in the `T` object in `src/data/jobs.js` — never change these.

## Rules
- No emojis anywhere — inline SVG icons only
- All dollar amounts via `Intl.NumberFormat` currency style
- All numbers and data values in JetBrains Mono font
- Inline styles only — no Tailwind, no CSS modules
- Fonts: Playfair Display (headings), DM Sans (body), JetBrains Mono (numbers/data)
