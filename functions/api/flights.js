const airports = [
  ["QRV 003", "departure", "DOH", "LHR", 38, "Boarding", "C12", "A350-1000"],
  ["QRV 725", "departure", "DOH", "JFK", 125, "Scheduled", "D04", "B777-300ER"],
  ["QRV 948", "departure", "DOH", "SIN", -28, "Departed", "B07", "A350-900"],
  ["QRV 039", "departure", "DOH", "CDG", 240, "Delayed", "A18", "B787-9"],
  ["QRV 909", "arrival", "SYD", "DOH", 52, "En route", "C08", "A380-800"],
  ["QRV 677", "arrival", "MLE", "DOH", 97, "Scheduled", "B02", "A320neo"],
  ["QRV 961", "arrival", "DPS", "DOH", -18, "Arrived", "C15", "B787-8"],
  ["QRV 004", "arrival", "LHR", "DOH", 190, "Scheduled", "D09", "A350-1000"],
];

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}

export function onRequestGet() {
  const now = new Date();
  const flights = airports.map(([flightNumber, direction, origin, destination, offset, status, gate, aircraft], index) => ({
    id: String(index + 1),
    flightNumber,
    direction,
    origin,
    destination,
    scheduledAt: addMinutes(now, offset),
    status,
    gate,
    aircraft,
    discordEventUrl: "https://discord.com/events",
    updatedAt: now.toISOString(),
  }));

  return Response.json({ flights }, {
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=30",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
