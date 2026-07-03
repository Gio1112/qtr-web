const state = {
  flights: [],
  direction: "departure",
  status: "all",
  search: "",
  tripType: "Return",
  origin: "Doha DOH",
};

const statusGroups = {
  upcoming: ["scheduled", "boarding", "delayed"],
  live: ["departed", "en route"],
  complete: ["arrived", "cancelled"],
};

const airports = {
  DOH: "Doha",
  LHR: "London Heathrow",
  JFK: "New York JFK",
  SIN: "Singapore",
  CDG: "Paris Charles de Gaulle",
  SYD: "Sydney",
  MLE: "Malé",
  DPS: "Bali Denpasar",
};

const iconArrow = '<span aria-hidden="true">→</span>';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}

function getMockFlights() {
  const now = new Date();
  return [
    { id: "1", flightNumber: "QRV 003", direction: "departure", origin: "DOH", destination: "LHR", scheduledAt: addMinutes(now, 38), status: "Boarding", gate: "C12", aircraft: "A350-1000", discordEventUrl: "https://discord.com/events" },
    { id: "2", flightNumber: "QRV 725", direction: "departure", origin: "DOH", destination: "JFK", scheduledAt: addMinutes(now, 125), status: "Scheduled", gate: "D04", aircraft: "B777-300ER", discordEventUrl: "https://discord.com/events" },
    { id: "3", flightNumber: "QRV 948", direction: "departure", origin: "DOH", destination: "SIN", scheduledAt: addMinutes(now, -28), status: "Departed", gate: "B07", aircraft: "A350-900", discordEventUrl: "https://discord.com/events" },
    { id: "4", flightNumber: "QRV 039", direction: "departure", origin: "DOH", destination: "CDG", scheduledAt: addMinutes(now, 240), status: "Delayed", gate: "A18", aircraft: "B787-9", discordEventUrl: "https://discord.com/events" },
    { id: "5", flightNumber: "QRV 909", direction: "arrival", origin: "SYD", destination: "DOH", scheduledAt: addMinutes(now, 52), status: "En route", gate: "C08", aircraft: "A380-800", discordEventUrl: "https://discord.com/events" },
    { id: "6", flightNumber: "QRV 677", direction: "arrival", origin: "MLE", destination: "DOH", scheduledAt: addMinutes(now, 97), status: "Scheduled", gate: "B02", aircraft: "A320neo", discordEventUrl: "https://discord.com/events" },
    { id: "7", flightNumber: "QRV 961", direction: "arrival", origin: "DPS", destination: "DOH", scheduledAt: addMinutes(now, -18), status: "Arrived", gate: "C15", aircraft: "B787-8", discordEventUrl: "https://discord.com/events" },
    { id: "8", flightNumber: "QRV 004", direction: "arrival", origin: "LHR", destination: "DOH", scheduledAt: addMinutes(now, 190), status: "Scheduled", gate: "D09", aircraft: "A350-1000", discordEventUrl: "https://discord.com/events" },
  ];
}

async function loadFlights() {
  const loading = $("#boardLoading");
  try {
    const response = await fetch("/api/flights", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Flight API responded ${response.status}`);
    const payload = await response.json();
    state.flights = Array.isArray(payload) ? payload : payload.flights;
    if (!Array.isArray(state.flights)) throw new Error("Invalid flight payload");
  } catch (error) {
    console.info("Using built-in demonstration schedule:", error.message);
    state.flights = getMockFlights();
  } finally {
    loading.hidden = true;
    renderFlights();
  }
}

function formatFlightTime(value) {
  const date = new Date(value);
  return {
    time: new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date),
    day: new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(date),
    full: new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(date),
  };
}

function normaliseStatus(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function flightMatchesStatus(flight) {
  if (state.status === "all") return true;
  return statusGroups[state.status]?.includes(flight.status.toLowerCase()) ?? false;
}

function renderFlights() {
  const list = $("#flightList");
  const empty = $("#boardEmpty");
  const query = state.search.trim().toLowerCase();

  const matching = state.flights
    .filter((flight) => flight.direction === state.direction)
    .filter(flightMatchesStatus)
    .filter((flight) => {
      if (!query) return true;
      const searchable = [flight.flightNumber, flight.origin, flight.destination, airports[flight.origin], airports[flight.destination], flight.aircraft, flight.status].join(" ").toLowerCase();
      return searchable.includes(query);
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  empty.hidden = matching.length > 0;
  list.innerHTML = matching.map((flight) => {
    const time = formatFlightTime(flight.scheduledAt);
    const originName = airports[flight.origin] ?? flight.origin;
    const destinationName = airports[flight.destination] ?? flight.destination;
    const statusClass = normaliseStatus(flight.status);
    return `
      <article class="flight-row">
        <div class="flight-time">
          <small>${state.direction === "departure" ? "Departs" : "Arrives"}</small>
          <strong>${time.time}</strong>
          <time datetime="${flight.scheduledAt}" title="${time.full}">${time.day}</time>
        </div>
        <div class="flight-code">
          <small>Flight</small>
          <strong>${flight.flightNumber}</strong>
          <small>${flight.aircraft}</small>
        </div>
        <div class="flight-route" aria-label="${originName} to ${destinationName}">
          <div class="flight-route__airport"><small>From</small><strong>${originName}</strong><small>${flight.origin}</small></div>
          <div class="flight-route__line"><span>✈</span></div>
          <div class="flight-route__airport"><small>To</small><strong>${destinationName}</strong><small>${flight.destination}</small></div>
        </div>
        <div class="flight-meta"><small>Gate ${flight.gate ?? "TBA"}</small><span class="status-pill status--${statusClass}">${flight.status}</span></div>
        <a class="flight-event" href="${flight.discordEventUrl}" target="_blank" rel="noreferrer">Discord event ${iconArrow}</a>
      </article>`;
  }).join("");
}

function initFlightBoard() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  $("#timezoneLabel").textContent = `Times shown in ${timeZone.replaceAll("_", " ")}`;

  $$(".board-tab").forEach((tab) => tab.addEventListener("click", () => {
    state.direction = tab.dataset.direction;
    $$(".board-tab").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    renderFlights();
  }));

  $$(".filter-chip").forEach((chip) => chip.addEventListener("click", () => {
    state.status = chip.dataset.status;
    $$(".filter-chip").forEach((item) => item.classList.toggle("is-active", item === chip));
    renderFlights();
  }));

  $("#flightSearch").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderFlights();
  });

  setInterval(() => {
    $$(".flight-time time").forEach(() => {});
    renderFlights();
  }, 60_000);
}

function initHeader() {
  const header = $("#siteHeader");
  const announcement = $("#announcement");
  const mobileToggle = $("#mobileToggle");
  const mobileMenu = $("#mobileMenu");
  const megaMenu = $("#megaMenu");
  const threshold = 90;

  const updateHeader = () => header.classList.toggle("is-sticky", window.scrollY > threshold);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  $("#closeAnnouncement").addEventListener("click", () => {
    announcement.hidden = true;
    header.style.top = "0";
  });

  mobileToggle.addEventListener("click", () => {
    const open = mobileMenu.hidden;
    mobileMenu.hidden = !open;
    mobileToggle.setAttribute("aria-expanded", String(open));
  });

  $$("#mobileMenu a").forEach((link) => link.addEventListener("click", () => {
    mobileMenu.hidden = true;
    mobileToggle.setAttribute("aria-expanded", "false");
  }));

  $$(".nav-menu-trigger").forEach((trigger) => trigger.addEventListener("click", () => {
    const panel = trigger.dataset.menu;
    const sameOpen = !megaMenu.hidden && megaMenu.dataset.openPanel === panel;
    megaMenu.hidden = sameOpen;
    megaMenu.dataset.openPanel = sameOpen ? "" : panel;
    $$(".mega-menu__inner").forEach((item) => { item.hidden = item.dataset.panel !== panel; });
  }));

  document.addEventListener("click", (event) => {
    if (!megaMenu.hidden && !megaMenu.contains(event.target) && !event.target.closest(".nav-menu-trigger")) megaMenu.hidden = true;
  });
}

function initSearch() {
  const overlay = $("#searchOverlay");
  const input = $("#siteSearchInput");
  const results = $("#siteSearchResults");
  const pages = [
    { name: "Upcoming flights", detail: "View the live departure board", href: "#flight-board" },
    { name: "Places you’ll love", detail: "Discover featured destinations", href: "#destinations" },
    { name: "Our network", detail: "Explore the global route map", href: "#network" },
    { name: "Travel packages", detail: "Browse themed virtual events", href: "#packages" },
    { name: "Virtual support", detail: "Open community support", href: "#support" },
  ];

  const close = () => { overlay.hidden = true; document.body.classList.remove("is-locked"); };
  $("#openSearch").addEventListener("click", () => { overlay.hidden = false; document.body.classList.add("is-locked"); setTimeout(() => input.focus(), 20); });
  $("#closeSearch").addEventListener("click", close);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
  input.addEventListener("input", () => {
    const query = input.value.toLowerCase().trim();
    const matches = pages.filter((page) => !query || `${page.name} ${page.detail}`.toLowerCase().includes(query));
    results.innerHTML = matches.map((page) => `<a class="search-result" href="${page.href}"><strong>${page.name}</strong><br><span>${page.detail}</span></a>`).join("");
    $$(".search-result", results).forEach((link) => link.addEventListener("click", close));
  });
  input.dispatchEvent(new Event("input"));
}

function initPromos() {
  const grid = $("#promoGrid");
  $("#promoPrev").addEventListener("click", () => grid.scrollBy({ left: -grid.clientWidth * .75, behavior: "smooth" }));
  $("#promoNext").addEventListener("click", () => grid.scrollBy({ left: grid.clientWidth * .75, behavior: "smooth" }));
}

function initDestinations() {
  $$('[data-trip]').forEach((button) => button.addEventListener("click", () => {
    state.tripType = button.dataset.trip;
    $$('[data-trip]').forEach((item) => item.classList.toggle("is-active", item === button));
  }));

  $$('[data-destination]').forEach((button) => button.addEventListener("click", () => {
    state.search = button.dataset.destination;
    $("#flightSearch").value = state.search;
    document.querySelector("#flight-board").scrollIntoView({ behavior: "smooth" });
    renderFlights();
  }));

  const modal = $("#originModal");
  const close = () => { modal.hidden = true; document.body.classList.remove("is-locked"); };
  $("#editOrigin").addEventListener("click", () => { modal.hidden = false; document.body.classList.add("is-locked"); });
  $("[data-close-modal]").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  $$('[data-origin]').forEach((button) => button.addEventListener("click", () => {
    state.origin = button.dataset.origin;
    $(".origin-field strong").textContent = state.origin;
    close();
  }));
}

function initNetwork() {
  const card = $(".network-card");
  const message = $("#networkMessage");
  $$('[data-region]').forEach((button) => button.addEventListener("click", () => {
    const region = button.dataset.region;
    $$('[data-region]').forEach((item) => item.classList.toggle("is-active", item === button));
    card.classList.toggle("is-filtered", region !== "All");
    message.textContent = region === "All" ? "Showing our complete virtual route network." : `Highlighting virtual destinations in ${region}.`;
  }));

  $("#routeDestination").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.value.trim()) {
      state.search = event.target.value.trim();
      $("#flightSearch").value = state.search;
      $("#flight-board").scrollIntoView({ behavior: "smooth" });
      renderFlights();
    }
  });
}

function initNewsletter() {
  const form = $("#newsletterForm");
  const input = $("#newsletterEmail");
  const message = $("#newsletterMessage");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.validity.valid) {
      message.textContent = "Please enter a valid email address.";
      input.focus();
      return;
    }
    message.textContent = "You’re on the list. Watch your inbox for the next flight announcement.";
    form.reset();
  });
}

function initSupport() {
  const button = $("#supportButton");
  const panel = $("#supportPanel");
  const close = () => { panel.hidden = true; button.setAttribute("aria-expanded", "false"); };
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
  });
  $("#closeSupport").addEventListener("click", close);
}

function initKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    ["#searchOverlay", "#originModal", "#supportPanel", "#mobileMenu", "#megaMenu"].forEach((selector) => { const node = $(selector); if (node) node.hidden = true; });
    document.body.classList.remove("is-locked");
    $("#mobileToggle")?.setAttribute("aria-expanded", "false");
    $("#supportButton")?.setAttribute("aria-expanded", "false");
  });
}

function init() {
  $("#currentYear").textContent = new Date().getFullYear();
  initHeader();
  initSearch();
  initFlightBoard();
  initPromos();
  initDestinations();
  initNetwork();
  initNewsletter();
  initSupport();
  initKeyboard();
  loadFlights();
}

document.addEventListener("DOMContentLoaded", init);
