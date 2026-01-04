// app.js

// ------------------------------
// 1) Constants for localStorage
// ------------------------------

// Key used to store parking spots data in localStorage
const STORAGE_KEY_SPOTS = "smart_parking_spots_v1";

// Key used to store activity log in localStorage
const STORAGE_KEY_LOG = "smart_parking_log_v1";

// Total number of parking spots
const TOTAL_SPOTS = 20;

// Maximum number of log entries to keep
const MAX_LOG = 10;


// ------------------------------
// 2) DOM Elements (HTML hooks)
// ------------------------------

// Grid container where spots will be drawn
const gridEl = document.getElementById("grid");

// Counters
const totalCountEl = document.getElementById("totalCount");
const availableCountEl = document.getElementById("availableCount");
const occupiedCountEl = document.getElementById("occupiedCount");

// Controls
const filterSelectEl = document.getElementById("filterSelect");
const searchInputEl = document.getElementById("searchInput");
const spotSelectEl = document.getElementById("spotSelect");

// Buttons
const parkBtnEl = document.getElementById("parkBtn");
const exitBtnEl = document.getElementById("exitBtn");
const resetBtnEl = document.getElementById("resetBtn");
const clearLogBtnEl = document.getElementById("clearLogBtn");

// Log list element
const logListEl = document.getElementById("logList");


// -----------------------------------------
// 3) App State (in-memory before rendering)
// -----------------------------------------

// Array of spots: each spot is { id: "P1", status: "available" | "occupied" }
let spots = [];

// Activity log: array of { time: "...", message: "..." }
let logEntries = [];

// Currently selected spot ID (like "P7"), null if none
let selectedSpotId = null;


// -----------------------------------------
// 4) Helpers for time + safe storage access
// -----------------------------------------

// Returns a readable timestamp like "2026-01-04 14:08"
function nowTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// Reads JSON from localStorage and returns parsed value or fallback
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

// Writes JSON to localStorage
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


// -----------------------------------------
// 5) Initialization (load or create default)
// -----------------------------------------

// Create default parking spots (all available)
function createDefaultSpots() {
  const arr = [];
  for (let i = 1; i <= TOTAL_SPOTS; i++) {
    arr.push({ id: `P${i}`, status: "available" });
  }
  return arr;
}

// Load state from localStorage or use defaults
function loadState() {
  spots = readJSON(STORAGE_KEY_SPOTS, createDefaultSpots());
  logEntries = readJSON(STORAGE_KEY_LOG, []);
}

// Save current state to localStorage
function saveState() {
  writeJSON(STORAGE_KEY_SPOTS, spots);
  writeJSON(STORAGE_KEY_LOG, logEntries);
}


// -----------------------------------------
// 6) Logging (keep last MAX_LOG entries)
// -----------------------------------------

// Add new log message
function addLog(message) {
  // Create a new entry with timestamp
  const entry = { time: nowTimestamp(), message };

  // Add to the start of the list (newest first)
  logEntries.unshift(entry);

  // Trim log to maximum size
  if (logEntries.length > MAX_LOG) {
    logEntries = logEntries.slice(0, MAX_LOG);
  }

  // Persist changes
  saveState();

  // Re-render log UI
  renderLog();
}


// -----------------------------------------
// 7) Counters and UI updates
// -----------------------------------------

// Count available and occupied spots
function computeCounts() {
  const available = spots.filter(s => s.status === "available").length;
  const occupied = spots.filter(s => s.status === "occupied").length;
  return { available, occupied, total: spots.length };
}

// Update counter elements in the UI
function renderCounters() {
  const { available, occupied, total } = computeCounts();
  totalCountEl.textContent = String(total);
  availableCountEl.textContent = String(available);
  occupiedCountEl.textContent = String(occupied);
}

// Fill "Selected Spot" dropdown options
function renderSpotSelect() {
  // Clear current options
  spotSelectEl.innerHTML = "";

  // Add a default "None" option
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "None";
  spotSelectEl.appendChild(noneOpt);

  // Add each spot ID as an option
  spots.forEach((spot) => {
    const opt = document.createElement("option");
    opt.value = spot.id;
    opt.textContent = spot.id;
    spotSelectEl.appendChild(opt);
  });

  // Set selected value in dropdown if exists
  spotSelectEl.value = selectedSpotId || "";
}


// -----------------------------------------
// 8) Rendering the parking grid (with filter)
// -----------------------------------------

// Decide if a spot should be visible based on filter + search
function spotMatchesUIFilters(spot) {
  const filter = filterSelectEl.value; // "all" | "available" | "occupied"
  const search = searchInputEl.value.trim().toUpperCase(); // e.g. "P7"

  // Filter logic
  if (filter === "available" && spot.status !== "available") return false;
  if (filter === "occupied" && spot.status !== "occupied") return false;

  // Search logic: if search is empty, accept all
  if (!search) return true;

  // Otherwise, match by spot id
  return spot.id.toUpperCase().includes(search);
}

// Build one spot element (card)
function createSpotElement(spot) {
  // Create main spot div
  const spotEl = document.createElement("div");
  spotEl.className = `spot ${spot.status}`;

  // If selected, add "selected" class
  if (spot.id === selectedSpotId) {
    spotEl.classList.add("selected");
  }

  // Create top row container
  const topEl = document.createElement("div");
  topEl.className = "spot-top";

  // Create spot id label
  const idEl = document.createElement("span");
  idEl.className = "spot-id";
  idEl.textContent = spot.id;

  // Create status pill
  const pillEl = document.createElement("span");
  pillEl.className = "pill";
  pillEl.textContent = spot.status === "available" ? "Available" : "Occupied";

  // Build top row
  topEl.appendChild(idEl);
  topEl.appendChild(pillEl);

  // Create hint text
  const hintEl = document.createElement("div");
  hintEl.className = "muted";
  hintEl.style.fontSize = "12px";
  hintEl.textContent = "Click to toggle";

  // Append children to the spot card
  spotEl.appendChild(topEl);
  spotEl.appendChild(hintEl);

  // Add click handler to toggle and select
  spotEl.addEventListener("click", () => {
    // Select this spot
    selectedSpotId = spot.id;

    // Toggle status
    toggleSpotStatus(spot.id);
  });

  return spotEl;
}

// Render the entire grid
function renderGrid() {
  // Clear grid
  gridEl.innerHTML = "";

  // For each spot, if it matches filter/search, show it
  spots.forEach((spot) => {
    if (!spotMatchesUIFilters(spot)) return;
    const spotEl = createSpotElement(spot);
    gridEl.appendChild(spotEl);
  });
}


// -----------------------------------------
// 9) Render activity log in the UI
// -----------------------------------------

function renderLog() {
  // Clear existing items
  logListEl.innerHTML = "";

  // If no log entries, show placeholder
  if (logEntries.length === 0) {
    const li = document.createElement("li");
    li.className = "log-item";
    li.textContent = "No activity yet.";
    logListEl.appendChild(li);
    return;
  }

  // Create list item for each entry
  logEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "log-item";

    const timeEl = document.createElement("div");
    timeEl.className = "time";
    timeEl.textContent = entry.time;

    const msgEl = document.createElement("div");
    msgEl.textContent = entry.message;

    li.appendChild(timeEl);
    li.appendChild(msgEl);

    logListEl.appendChild(li);
  });
}


// -----------------------------------------
// 10) Core actions: toggle, park, exit, reset
// -----------------------------------------

// Toggle status of a specific spot by ID
function toggleSpotStatus(spotId) {
  // Find spot index
  const idx = spots.findIndex(s => s.id === spotId);

  // If not found, do nothing
  if (idx === -1) return;

  // Toggle available <-> occupied
  const current = spots[idx].status;
  spots[idx].status = current === "available" ? "occupied" : "available";

  // Write log message based on new status
  const newStatus = spots[idx].status;
  if (newStatus === "occupied") {
    addLog(`Spot ${spotId} marked as Occupied`);
  } else {
    addLog(`Spot ${spotId} marked as Available`);
  }

  // Save changes
  saveState();

  // Update UI
  renderAll();
}

// Park car: occupy first available spot
function parkCar() {
  // Find first available spot
  const firstAvailable = spots.find(s => s.status === "available");

  // If no available spot, log and return
  if (!firstAvailable) {
    addLog("Parking is full. No available spots.");
    return;
  }

  // Occupy it
  firstAvailable.status = "occupied";

  // Select it
  selectedSpotId = firstAvailable.id;

  // Log action
  addLog(`Car parked at ${firstAvailable.id}`);

  // Save changes
  saveState();

  // Update UI
  renderAll();
}

// Exit car: free selected occupied spot, otherwise last occupied
function exitCar() {
  // Try selected spot first
  if (selectedSpotId) {
    const selected = spots.find(s => s.id === selectedSpotId);
    if (selected && selected.status === "occupied") {
      selected.status = "available";
      addLog(`Car exited from ${selected.id}`);
      saveState();
      renderAll();
      return;
    }
  }

  // If selected is not occupied, free the last occupied spot
  const lastOccupied = [...spots].reverse().find(s => s.status === "occupied");

  // If no occupied spots, log and return
  if (!lastOccupied) {
    addLog("No occupied spots to exit from.");
    return;
  }

  // Free it
  lastOccupied.status = "available";

  // Select it
  selectedSpotId = lastOccupied.id;

  // Log action
  addLog(`Car exited from ${lastOccupied.id}`);

  // Save and render
  saveState();
  renderAll();
}

// Reset: set all spots available and clear selection
function resetAll() {
  spots = createDefaultSpots();
  selectedSpotId = null;
  addLog("System reset: all spots set to Available");
  saveState();
  renderAll();
}


// -----------------------------------------
// 11) Global render function
// -----------------------------------------

function renderAll() {
  renderCounters();
  renderSpotSelect();
  renderGrid();
  renderLog();
}


// -----------------------------------------
// 12) Event listeners (UI interactions)
// -----------------------------------------

// Filter changes -> re-render grid
filterSelectEl.addEventListener("change", () => {
  renderGrid();
});

// Search typing -> re-render grid
searchInputEl.addEventListener("input", () => {
  renderGrid();
});

// Selected spot dropdown changes -> update selectedSpotId and re-render
spotSelectEl.addEventListener("change", () => {
  selectedSpotId = spotSelectEl.value || null;
  renderAll();
});

// Buttons
parkBtnEl.addEventListener("click", parkCar);
exitBtnEl.addEventListener("click", exitCar);
resetBtnEl.addEventListener("click", resetAll);

// Clear log button
clearLogBtnEl.addEventListener("click", () => {
  logEntries = [];
  addLog("Activity log cleared");
  saveState();
  renderLog();
});


// -----------------------------------------
// 13) Start the app
// -----------------------------------------

// Load saved data first
loadState();

// Render initial UI
renderAll();
