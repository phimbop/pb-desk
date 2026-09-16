---
name: desktop-app-audit
description: Comprehensive workflow for auditing, QA testing, diagnosing, and fixing desktop applications using xdotool, visual evidence verification, Tauri v2 architectural standards, and Svelte 5 MCP. Covers route/slug inventories, clone-vs-new feature analysis, interactive button/animation testing, and production quality gates.
---

# Desktop App Audit & Visual QA Protocol (xdotool + Tauri + Svelte 5)

This skill provides a battle-tested, repeatable operational protocol for validating, auditing, debugging, and polishing desktop GUI applications (specifically Tauri v2 + Svelte 5) on Linux/X11 environments using `xdotool`, pixel-level screenshot inspection, Tauri v2 best practices, and Svelte MCP tooling.

---

## 1. Architectural Philosophy & The Audit Triad

Unit tests and headless checks cannot detect visual layout collapses, WebKit-specific rendering bugs, broken click event propagation in nested elements, or runaway reactivity loops. Quality assurance requires a 3-part coordinated approach:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DESKTOP APP AUDIT TRIAD                      │
├───────────────────┬────────────────────────┬────────────────────┤
│ 1. VISUAL QA      │ 2. SVELTE 5 MCP        │ 3. TAURI v2 SKILL  │
│ (xdotool + PIL)   │ (Runes & Reactivity)   │ (IPC & Rust Engine)│
├───────────────────┼────────────────────────┼────────────────────┤
│ • Window discovery│ • Rune synchronization │ • Capability scopes│
│ • Window-coord tap│ • Unidirectional flow  │ • Non-blocking Tokio│
│ • State screenshot│ • Sibling button specs │ • SQLite persistence│
│ • Crop inspection │ • WebKit flex hygiene  │ • Zero-clippy gates│
└───────────────────┴────────────────────────┴────────────────────┘
```

---

## 2. Phase 1: Feature & Slug Inventory Mapping

Before executing tests, construct a complete map of all application routes, dynamic slugs, and feature surfaces.

### Step 1.1: Automated Route Discovery
Inspect `src/routes/` to extract all active slugs:
```bash
find src/routes -name "+page.svelte" | sort
```

### Step 1.2: Feature Catalog Template
Every audit must maintain an explicit checklist covering all routes and components:

| Route / Slug | Feature Surface | Key Interactive Elements | Reference Model | Audit Status |
|---|---|---|---|---|
| `/` (Home) | Hero Banners, Carousels, Category Tabs | Play buttons, card clicks, horizontal scroll rails, search bar | Web clone / Custom | Pending |
| `/tim-kiem/phim` | Movie Search & Discovery | Search input, Genres, Country, Year, Filter submit, Pagination | Web clone (`pbv5`) | Verified |
| `/tim-kiem/dien-vien` | Actor Search | Search input, Actor avatar cards, Pagination | Web clone (`pbv5`) | Pending |
| `/phim/[movieName]/[movieId]` | Movie Details & Player | Video player, Episode list, Favorite toggle, Ratings | Web clone (`pbv5`) | Pending |
| `/phim-bo`, `/phim-le`, `/phim-moi` | Filtered Media Feeds | Category chips, Sorting dropdowns, Grid responsive layout | Web clone (`pbv5`) | Pending |
| `/phim-18-cong` | 18+ Adult Movies Feed | TabSwitch (Mới nhất / Xem nhiều nhất), Grid cards, Pagination | Web clone (`pbv5`) | Pending |
| `/phim-tinh-cam` | Romance Movies Feed | Grid cards, Category filters, Pagination | Web clone (`pbv5`) | Pending |
| `/bang-xep-hang` | Leaderboards & Top Rankings | Leaderboard tabs (Phim hot, Thành viên), Top view cards | Web clone (`pbv5`) | Pending |
| `/lich-su` | Local Watch History | Resume play, Clear history, Remove item (SQLite) | Tauri Desktop Feature | Pending |
| `/phim-yeu-thich` | Favorites Collection | Bookmark toggle, Grid layout, Remove item (SQLite) | Tauri Desktop Feature | Pending |
| `/quoc-gia/[slug]` | Country-specific Movies | Country title, Movie cards grid, Pagination | Web clone (`pbv5`) | Pending |
| `/the-loai/[slug]` | Genre-specific Movies | Genre title, Movie cards grid, Pagination | Web clone (`pbv5`) | Pending |
| `/gioi-thieu` | About & Usage Guide | Static content, Accordion FAQs, Social links | Web clone (`pbv5`) | Pending |

---

## 3. Phase 2: Source of Truth Evaluation (Clone vs. New Development)

When evaluating any feature or bug, determine the baseline authority:

```text
                                [Is there a Reference Codebase?]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                      YES                                             NO
                       ▼                                               ▼
             [1:1 CLONE AUDIT]                              [NEW FEATURE AUDIT]
  • Compare directly against reference           • Adhere to Apple HIG / Modern UI standards
    (e.g., `/home/arch/Project/test/pbv5`)       • Responsive flex/grid without hardcoding
  • Match HTML hierarchy & Tailwind 100%         • Consistent typography, tokens, spacing
  • Retain exact micro-animations & transitions  • Proper empty states, skeletons & error recovery
  • ADAPT ONLY: Replace web-specific APIs        • Granular Tauri IPC & SQLite storage
    with Tauri v2 desktop storage/capabilities
```

### Backend Responsibility Boundary Check
Always determine whether a feature requires the Rust backend:
- **Client-Side Only**: Public REST APIs (e.g., TMDB Discover, public search APIs), UI dropdowns, in-memory filtering, theme toggles, and Svelte runes. **Do not route these through Rust IPC.**
- **Rust Backend Required**: Local SQLite tables (`watch_history`, `favorites`), filesystem access, OS window controls, system tray, network proxying, or offline caching.

---

## 4. Phase 3: Interactive Visual Testing Protocol with `xdotool`

### Step 4.1: Locating the Target Desktop Window
Never guess window IDs. Enumerate all visible windows and filter by application title:

```bash
# List all visible windows with titles
for id in $(xdotool search --onlyvisible ""); do
    name=$(xdotool getwindowname $id 2>/dev/null)
    [ -n "$name" ] && echo "$id: $name"
done
```
*Tip: Identify the application window ID (e.g. `73400323: PHIMBOP - Phim gì cũng có!`) and avoid terminal or IDE windows.*

### Step 4.2: Inspecting Geometry and Window Offset
```bash
xdotool getwindowgeometry <WIN_ID>
# Example output:
# Window 73400323
#   Position: 0,23 (screen: 0)
#   Geometry: 1920x1057
```

> [!IMPORTANT]
> **CRITICAL COORDINATE DISTINCTION: SCREEN vs. WINDOW-RELATIVE**
> - Running `xdotool mousemove <x> <y>` operates in **SCREEN COORDINATES**. If the window has a top bar or decoration offset (e.g., `Position: 0, 23`), screen coordinates miss the target element!
> - ALWAYS use `--window <WIN_ID>`:
>   ```bash
>   xdotool windowactivate --sync <WIN_ID> && xdotool mousemove --window <WIN_ID> <x> <y> click 1
>   ```
>   This guarantees mouse events fire at coordinates relative to the application's client viewport.

### Step 4.3: Visual Evidence Capture & Cropping
Never rely on console logs alone. Capture visual evidence before and after interactions:

```bash
# 1. Capture full application window
import -window <WIN_ID> /path/to/capture.png

# 2. Crop target region with Python PIL for micro-inspection
python3 -c '
from PIL import Image
im = Image.open("/path/to/capture.png")
# Crop region: (left, top, right, bottom)
crop = im.crop((1300, 70, 1600, 350))
crop.save("/path/to/crop.png")
'
```

### Step 4.4: Automated Coordinate Finding via Pixel Sampling
When exact coordinates are unknown, locate distinctive color bounds (e.g., neon buttons, borders):
```python
from PIL import Image
im = Image.open("capture.png")
# Search for pink action button (R > 180, G < 40, B > 80)
points = [(x, y) for x in range(im.width) for y in range(im.height)
          if im.getpixel((x, y))[0] > 180 and im.getpixel((x, y))[1] < 40]
if points:
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    center_x = (min(xs) + max(xs)) // 2
    center_y = (min(ys) + max(ys)) // 2
    print(f"Target Center: x={center_x}, y={center_y}")
```

---

## 5. Phase 4: Component-by-Component & Animation Verification

Every interactive widget must undergo two-way state verification:

### 1. Dropdown & Multi-Select Controls
- **Opening**: Click header pill -> Verify container scale/fade transition appears with `max-h-96` and `overflow-y-auto`.
- **Flexbox Collapse Pitfall**:
  - *Anti-Pattern*: Container with `h-fit flex flex-col overflow-hidden` and child `<ul class="flex-1">`. In WebKit/Blink, `flex-1` computes to `0px` height.
  - *Correct Pattern*: Standard block flow without `flex-1`:
    ```svelte
    <div class="absolute z-40 w-[260px] h-fit mt-2 origin-top bg-neutral-800/60 backdrop-blur-xl rounded-2xl overflow-x-hidden shadow-lg">
        <InputFilterSearch bind:inputValue ... />
        <ul class="max-h-96 overflow-y-auto scrollbar p-2">...</ul>
    </div>
    ```
- **Positive Toggle (Ticking)**: Click item -> Verify checkbox checks, text highlights in accent color (`text-neonPink-500`), and badge count increments (`[1]`).
- **Negative Toggle (Unticking)**: Click item again -> Verify checkmark clears, text reverts, and badge removes.
- **Outside Click (`clickOutside`)**: Click outside -> Dropdown closes cleanly without inadvertently triggering underlying actions.

### 2. Buttons & Event Bubbling
- **No Nested Buttons**:
  - *Illegal*: `<button onclick={toggle}><button onclick={clear}>X</button></button>` (Breaks HTML specifications and causes WebKit event abortion).
  - *Correct*: Place the clear button as a sibling inside the relative wrapper with `type="button"`, `z-20`, and `e.stopPropagation()`.
- **Checkbox Pointer Events**:
  - Add `pointer-events-none` to native `<input type="checkbox">` inside a clickable `<li onclick=...>` to prevent conflicting double-toggle events.

### 3. Navigation & Route Transitions
- Test sidebar icons, breadcrumb links, and back buttons.
- Confirm SvelteKit route transitions load data without flashing blank screens.

---

## 6. Phase 5: Svelte 5 Runes & Reactivity Best Practices

Use Svelte MCP (`get-documentation`, `svelte-autofixer`) to enforce Svelte 5 standards:

### 1. Banning the "Infinite Reverse-Sync Effect"
When binding local state to a shared rune store:
```svelte
<!-- ANTI-PATTERN: DO NOT DO THIS -->
<script>
let selected = $state(store.value.items ?? []);
$effect(() => {
    // RUNS EVERY TIME 'selected' CHANGES!
    // Overwrites user input back to store.value immediately!
    if (!arraysEqual(store.value.items, selected)) {
        selected = store.value.items;
    }
});
</script>
```

```svelte
<!-- CORRECT PATTERN: UNIDIRECTIONAL HYDRATION -->
<script>
let selected = $state(store.value.items ?? []);
let hasInitialized = false;

// Hydrate ONCE when store becomes ready
$effect(() => {
    if (!hasInitialized && store.state === 'ready') {
        hasInitialized = true;
        if (store.value.items?.length && selected.length === 0) {
            selected = [...store.value.items];
        }
    }
});

// Sync outward: Local changes drive store updates
$effect(() => {
    if (store.state === 'ready' && !arraysEqual(store.value.items, selected)) {
        store.value = { ...store.value, items: selected };
    }
});
</script>
```

### 2. Loose ID Comparisons
Option IDs from APIs often mix numbers (`28`) and strings (`"2026"`):
```ts
// Safe loose equality comparison for multi-selects
const isSelected = selectedOptions.some((item) => item?.toString() === option.id?.toString());
```

---

## 7. Phase 6: Production Verification Gates

No task or bug fix is complete without passing all 4 gates in order:

```bash
# Gate 1: Rust Linting & Strict Clippy
cargo clippy --workspace -- -D warnings

# Gate 2: Workspace Unit & Integration Tests
cargo test --workspace

# Gate 3: Frontend TypeScript & Rune Checks (strictly bun)
bun run check

# Gate 4: Frontend Production Static Build (strictly bun)
bun run build

# Gate 5: Knowledge Retention & Graph Sync
codegraph sync .
```

---

## 8. Summary Audit Execution Checklist

When starting an audit of any feature/slug:

- [ ] **Step 1: Discover**: Enumerate the target slug and review its reference implementation (`pbv5` vs custom).
- [ ] **Step 2: Launch App**: Verify dev server (`http://localhost:1420`) and active Tauri window (`xdotool search`).
- [ ] **Step 3: Baseline Capture**: Take baseline screenshot with `import -window <WIN_ID>`.
- [ ] **Step 4: Interactive Test**: Use `xdotool mousemove --window <WIN_ID> <x> <y> click 1` to test:
  - [ ] Opening dropdowns / menus
  - [ ] Selecting items (positive check)
  - [ ] Deselecting items (negative check)
  - [ ] Clear / Reset buttons
  - [ ] Text input typing & Enter submit
  - [ ] Pagination next/prev clicks
- [ ] **Step 5: Visual Verification**: Crop and inspect component states.
- [ ] **Step 6: Code Repair**: Apply Svelte 5 runes / Tauri architecture fixes if defects are found.
- [ ] **Step 7: Quality Gate**: Pass all 4 compile, clippy, check, and build gates.
- [ ] **Step 8: Knowledge Sync**: Save lessons to `agentmemory` and sync `codegraph`.
