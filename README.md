# Qatar Airways Virtual homepage

A responsive, interactive front page for a Qatar Airways-themed virtual airline. It recreates the visual language of the supplied Qatar Airways references while replacing the commercial booking panel with a live virtual-flight departure board.

## Included

- Responsive hero and navigation with desktop mega menus and a mobile drawer
- Departure/arrival tabs, flight search, status filters and automatic local-time formatting
- Cloudflare Pages Function at `GET /api/flights`
- Promotional, destination, network, package and newsletter sections
- Accessible keyboard states, reduced-motion support and security headers
- Built-in fallback schedule so the static site still works without the Function runtime

## Run locally

For a static preview:

```bash
python -m http.server 8788
```

The page falls back to demonstration flights because Python's static server does not run Pages Functions.

For the complete Cloudflare Pages runtime:

```bash
npx wrangler pages dev .
```

## Deploy to Cloudflare Pages

Use the repository root as the output directory. No framework build command is required. The `functions/` directory is detected automatically by Cloudflare Pages.

## Flight API response

`GET /api/flights` returns:

```json
{
  "flights": [
    {
      "id": "1",
      "flightNumber": "QRV 003",
      "direction": "departure",
      "origin": "DOH",
      "destination": "LHR",
      "scheduledAt": "2026-07-03T18:30:00.000Z",
      "status": "Boarding",
      "gate": "C12",
      "aircraft": "A350-1000",
      "discordEventUrl": "https://discord.com/events"
    }
  ]
}
```

Replace the demonstration handler with the production flight data source later without changing the front-end contract.

## Disclaimer

This project is for a non-commercial virtual airline community and is not the official Qatar Airways website.
