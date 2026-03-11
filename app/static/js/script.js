const $ = id => document.getElementById(id);
const html = document.documentElement;

// Leaflet map instance and the two tile layers (swapped on theme change)
let currentTheme = 'dark', map = null, darkLayer = null, lightLayer = null;


/* ── Theme ──────────────────────────────────────────────────────────────────
   Applies dark/light by toggling data-theme on <html>. If the map is already
   initialised, swaps tile layers rather than rebuilding the whole map.
─────────────────────────────────────────────────────────────────────────── */
function applyTheme(t) {
  currentTheme = t;
  html.setAttribute('data-theme', t);
  $('themeIcon').textContent = t === 'dark' ? '☀️' : '🌙';
  if (map && darkLayer && lightLayer) {
    if (t === 'dark') {
      if (!map.hasLayer(darkLayer))  map.addLayer(darkLayer);
      if (map.hasLayer(lightLayer))  map.removeLayer(lightLayer);
    } else {
      if (!map.hasLayer(lightLayer)) map.addLayer(lightLayer);
      if (map.hasLayer(darkLayer))   map.removeLayer(darkLayer);
    }
  }
}
// Respect the OS-level preference on first load
applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
// Keep in sync if the user changes their OS preference while the page is open
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => applyTheme(e.matches ? 'dark' : 'light'));
$('themeToggle').addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));

const isMobile = () => window.innerWidth < 640;


/* ── Desktop sidebar ─────────────────────────────────────────────────────── */
const mainLayout = $('mainLayout'), collapseBtn = $('collapseBtn');
let sidebarOpen = true;

function setSidebarState(open) {
  sidebarOpen = open;
  mainLayout.classList.toggle('sidebar-collapsed', !open);
  collapseBtn.style.left = open ? 'calc(var(--sidebar-w) - 1px)' : '0px';
  if (map) {
    // Leaflet doesn't know the container resized during the CSS transition,
    // so we keep calling invalidateSize for the duration of the animation (440ms).
    const c = map.getCenter(), z = map.getZoom(), t0 = performance.now();
    if (window._raf) cancelAnimationFrame(window._raf);
    (function loop(now) {
      map.invalidateSize({animate:false, pan:false});
      map.setView(c, z, {animate:false});
      if (now - t0 < 440) window._raf = requestAnimationFrame(loop);
      else window._raf = null;
    })(t0);
  }
}
collapseBtn.addEventListener('click', () => { if (!isMobile()) setSidebarState(!sidebarOpen); });


/* ── Mobile bottom sheet ─────────────────────────────────────────────────
   The sidebar is positioned fixed at the bottom and translated up/down via
   touch events. It snaps to two positions: fully open (translateY 0) or
   peeking (translateY = peekOffset, showing just the handle + IP hero card).
─────────────────────────────────────────────────────────────────────────── */
const sidebar = $('sidebar');
let sheetOpen      = false;
let grabbing       = false; // true once a drag gesture is confirmed
let rejected       = false; // true if the gesture should be ignored (e.g. scrolling content)
let startY         = 0;
let startScrollTop = 0;
let startSheetY    = 0;
let prevY          = 0;
let prevT          = 0;
let velocity       = 0;     // px/ms — used to detect flick gestures on touchend
let cachedPeekOffset = null;

// Measures how far to translateY the sheet so the handle + IP hero are visible.
// Cached after each measurement; invalidated on resize/orientationchange/data load.
function measurePeekOffset() {
  const hero = $('ipHero');
  const sidebarRect = sidebar.getBoundingClientRect();
  if (hero) {
    const heroRect = hero.getBoundingClientRect();
    const visibleHeight = (heroRect.bottom - sidebarRect.top) + 12; // 12px breathing room
    return Math.max(0, sidebarRect.height - visibleHeight);
  }
  // Fallback before the hero card has rendered (e.g. during skeleton phase)
  const handle = $('sheetHandle');
  const handleH = handle ? handle.getBoundingClientRect().height : 48;
  return Math.max(0, sidebarRect.height - (handleH + 140));
}

function getPeekOffset() {
  if (cachedPeekOffset === null) cachedPeekOffset = measurePeekOffset();
  return cachedPeekOffset;
}

function invalidatePeekCache() { cachedPeekOffset = null; }

function getCurrentTranslateY() {
  // Read the live transform matrix rather than a stored value so mid-animation
  // drags start from the correct position
  return new DOMMatrix(getComputedStyle(sidebar).transform).m42;
}

function setSheetY(y, animated) {
  sidebar.style.transition = animated ? 'transform 0.38s cubic-bezier(0.32,0.72,0,1)' : 'none';
  sidebar.style.transform  = `translateY(${y}px)`;
}

function snapTo(open) {
  sheetOpen = open;
  setSheetY(open ? 0 : getPeekOffset(), true);
  // Reset scroll position after the sheet collapses so it's at the top next time
  if (!open) setTimeout(() => { sidebar.scrollTop = 0; }, 400);
  // Let the map fill the newly revealed area
  if (map)   setTimeout(() => map.invalidateSize({animate:false}), 420);
}

function initSheet() {
  if (!isMobile()) return;
  invalidatePeekCache();
  // Double rAF ensures the browser has fully painted before we measure element sizes
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cachedPeekOffset = measurePeekOffset();
      sidebar.style.transition = 'none';
      sidebar.style.transform  = `translateY(${cachedPeekOffset}px)`;
      sheetOpen = false;
    });
  });
}

sidebar.addEventListener('touchstart', function(e) {
  if (!isMobile()) return;
  grabbing       = false;
  rejected       = false;
  startY         = e.touches[0].clientY;
  prevY          = startY;
  prevT          = Date.now();
  velocity       = 0;
  startScrollTop = sidebar.scrollTop;
  startSheetY    = getCurrentTranslateY();
}, { passive: true });

sidebar.addEventListener('touchmove', function(e) {
  if (!isMobile() || rejected) return;
  const y   = e.touches[0].clientY;
  const dy  = y - startY;
  const now = Date.now();
  velocity  = (y - prevY) / Math.max(now - prevT, 1);
  prevY = y; prevT = now;

  if (!grabbing) {
    // Hand off to native scroll if the sheet is open and user swipes up,
    // or if the user is trying to scroll content that has already scrolled down
    if (dy < 0 &&  sheetOpen)          { rejected = true; return; }
    if (dy > 0 && !sheetOpen)          { rejected = true; return; }
    if (dy > 0 &&  startScrollTop > 2) { rejected = true; return; }
    grabbing = true;
  }

  e.preventDefault(); // prevent page scroll while dragging the sheet
  const newY = Math.max(0, Math.min(startSheetY + dy, getPeekOffset()));
  setSheetY(newY, false);
}, { passive: false }); // must be non-passive to call preventDefault

sidebar.addEventListener('touchend', function() {
  if (!isMobile() || !grabbing) return;
  grabbing = false;
  const curY = getCurrentTranslateY();
  // Flick up/down overrides position-based snap
  if      (velocity >  0.5) snapTo(false);
  else if (velocity < -0.5) snapTo(true);
  else                      snapTo(curY < getPeekOffset() / 2);
}, { passive: true });


/* ── Helpers ─────────────────────────────────────────────────────────────── */

// Adds .visible to a .card-enter element after `delay` ms, triggering its CSS entrance
function reveal(id, delay) { setTimeout(() => $(id).classList.add('visible'), delay || 0); }

// Returns the UTC offset string (e.g. "GMT+5:30") for a given IANA timezone name
function getGMTOffset(tz) {
  try {
    const p = new Intl.DateTimeFormat('en', {timeZone:tz, timeZoneName:'shortOffset'}).formatToParts(new Date());
    const t = p.find(x => x.type === 'timeZoneName');
    return t ? t.value.replace(/^GMT$/, 'GMT+0') : '';
  } catch(e) { return ''; }
}


/* ── Map ─────────────────────────────────────────────────────────────────── */
function initMap() {
  map = L.map('map', {
    zoomControl: false,       // repositioned via L.control.zoom below
    attributionControl: false, // repositioned via L.control.attribution below
    maxBounds: [[-90,-180],[90,180]], maxBoundsViscosity: 1, // prevent panning beyond world edges
    worldCopyJump: false, minZoom: 2
  }).setView([20, 0], 2);

  // Two tile layers pre-loaded; only one is active at a time, swapped by applyTheme()
  darkLayer  = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',  {maxZoom:20, subdomains:'abcd', attribution:'&copy; OpenStreetMap &copy; CARTO'});
  lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {maxZoom:20, subdomains:'abcd', attribution:'&copy; OpenStreetMap &copy; CARTO'});
  (currentTheme === 'dark' ? darkLayer : lightLayer).addTo(map);

  L.control.zoom({position:'topright'}).addTo(map);
  L.control.attribution({position:'bottomright', prefix:''}).addTo(map);
}


/* ── Data ────────────────────────────────────────────────────────────────
   Fetches from Flask's /ip-details endpoint and populates all sidebar cards
   with staggered reveal animations. Map flyTo runs after a short delay so
   the tile layer is ready.
─────────────────────────────────────────────────────────────────────────── */
async function loadIPData() {
  try {
    const res = await fetch('/ip-details');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (d.error) throw new Error(d.message || 'API error');

    // Small delay before hiding loader so the bar animation can complete visually
    setTimeout(() => $('loader').classList.add('hidden'), 400);

    $('ipAddr').textContent = d.ip || '—';
    $('ipHost').textContent = (d.hostname && d.hostname !== 'N/A') ? d.hostname : 'No reverse DNS';
    reveal('ipHero', 0);
    // Re-measure peek offset now that the hero card has real content (not skeletons)
    if (isMobile() && !sheetOpen) setTimeout(() => { invalidatePeekCache(); initSheet(); }, 80);

    $('dCity').textContent       = d.city || '—';
    $('dRegion').textContent     = d.region || '—';
    $('countryName').textContent = d.country_name || d.country || '—';
    if (d.country_flag_url) {
      const f = $('countryFlag');
      f.src = d.country_flag_url; f.alt = d.country || ''; f.style.display = 'inline';
    }
    const tz = d.timezone || '';
    $('dTZ').textContent = tz ? `${tz} (${getGMTOffset(tz)})` : '—';
    reveal('locCard', 120);

    $('dOrg').textContent = d.org || '—';
    reveal('netCard', 240);

    const lat = parseFloat(d.latitude), lng = parseFloat(d.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      $('dLat').textContent = lat.toFixed(4) + '°';
      $('dLng').textContent = lng.toFixed(4) + '°';
      reveal('coordsBlock', 360);
      // 700ms delay lets the loader fade out before the map animation starts
      setTimeout(() => {
        const markerIcon = L.divIcon({className:'', html:'<div class="custom-marker"></div>', iconSize:[14,14], iconAnchor:[7,7]});
        map.flyTo([lat, lng], isMobile() ? 9 : 11, {animate:true, duration:3.5, easeLinearity:0.15});
        L.marker([lat, lng], {icon: markerIcon})
          .addTo(map)
          .bindPopup('<b style="color:var(--accent)">' + d.ip + '</b><br>' + [d.city, d.country].filter(Boolean).join(', '))
          .openPopup();
        $('map').classList.add('visible');
      }, 700);
    }
    reveal('accuracyNote', 480);
    reveal('builtBy', 600); // staggered after accuracyNote

  } catch(err) {
    console.error(err);
    $('loader').classList.add('hidden');
    $('errorState').style.display = 'block';
    reveal('ipHero', 0);
    reveal('accuracyNote', 200);
    reveal('builtBy', 320);
  }
}


/* ── Boot ────────────────────────────────────────────────────────────────
   DOMContentLoaded guarantees Leaflet's <script> has executed and the DOM
   is ready before we touch either.
─────────────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadIPData();

  window.addEventListener('orientationchange', () => {
    // Brief timeout lets the browser finish the rotation before we remeasure
    setTimeout(() => {
      if (map) map.invalidateSize({animate:false});
      invalidatePeekCache();
      initSheet();
    }, 300);
  });

  window.addEventListener('resize', () => {
    invalidatePeekCache();
    initSheet();
    // Keep the collapse button aligned to the sidebar edge on desktop
    if (!isMobile() && sidebarOpen) {
      collapseBtn.style.left = `calc(${getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w').trim()} - 1px)`;
    }
  });

  // initSheet needs accurate element sizes; wait for fonts to load to avoid
  // measuring before IBM Plex Mono has affected layout
  if (document.fonts) document.fonts.ready.then(initSheet);
  else window.addEventListener('load', initSheet);
});