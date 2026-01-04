<!-- README.md -->

# Smart Parking System (Web Simulator)

A simple **Smart Parking System** simulator built with **vanilla HTML, CSS, and JavaScript**.  
It displays a parking lot (P1–P20) and lets you simulate cars parking and exiting.

## How to Run
1. Download the project folder.
2. Open `index.html` in any web browser.
3. No server needed.

## Features
- 20 parking spots shown in a responsive grid.
- Each spot can be **Available** or **Occupied**.
- Click any spot to toggle its status.
- **Park Car**: occupies the first available spot.
- **Exit Car**: frees the selected occupied spot (or the last occupied spot).
- Filter: All / Available / Occupied.
- Search by spot ID (e.g., `P7`).
- Counters: total / available / occupied.
- Activity log (last 10 actions) with timestamps.
- Persistent storage using `localStorage`.

## localStorage Persistence
The app saves:
- Spot statuses (available/occupied)
- Activity log entries

So when you refresh the page, the parking lot state stays the same.

## Project Structure
- `index.html` — UI structure
- `style.css` — Styling and responsive layout
- `app.js` — App logic, rendering, and localStorage
