// Screenshot tour tabs
const shots = {
  dashboard: ["Dashboard with library totals, attention items, live download workers, and queue health", "Library totals, items needing attention, live download workers, and queue health."],
  library: ["Library songs table with artwork, artist, album, duration, and bitrate", "Search, filter, sort, and edit every indexed track."],
  albums: ["Library album grid with square artwork", "Album grid with artwork served from Harmony's local cache."],
  downloads: ["Downloads page with link box, queue summary, failure diagnosis, and active downloads", "Paste a link, then follow live progress, failures, and history."],
  sources: ["Sources page with Spotify and YouTube Music playlists and auto-sync controls", "Followed Spotify and YouTube Music playlists with scheduled auto-sync."],
  playlists: ["Playlists page with exported M3U playlists, sync health, and actions", "Exported M3U playlists with availability counts and sync health."],
};
const tabs = document.querySelectorAll("[data-shot]");
const img = document.getElementById("tour-img");
const cap = document.getElementById("tour-cap");
const url = document.getElementById("tour-url");

// Screens with a light-theme capture follow the system theme.
const lightShots = new Set(["dashboard", "library"]);
const prefersLight = matchMedia("(prefers-color-scheme: light)");

function show(tab) {
  const key = tab.dataset.shot;
  tabs.forEach((t) => t.setAttribute("aria-selected", t === tab));
  img.style.opacity = 0;
  const next = new Image();
  const variant = prefersLight.matches && lightShots.has(key) ? "-light" : "";
  next.src = `assets/shots/desktop-${key}${variant}.webp`;
  next.decode().catch(() => {}).finally(() => {
    img.src = next.src;
    img.alt = shots[key][0];
    cap.textContent = shots[key][1];
    url.textContent = `harmony.local/${key}`;
    img.style.opacity = 1;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => show(tab));
  tab.addEventListener("keydown", (e) => {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    next.focus();
    show(next);
  });
});

const current = () => [...tabs].find((t) => t.getAttribute("aria-selected") === "true");
if (prefersLight.matches) show(current());
prefersLight.addEventListener("change", () => show(current()));

// Copy buttons on install commands
document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.previousElementSibling.innerText.split("\n").filter((l) => !l.startsWith("#")).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Press ⌘C";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1600);
  });
});
