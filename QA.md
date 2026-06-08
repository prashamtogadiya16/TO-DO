# QA — Busy Day (design-2)

---

## CSS Questions

### `:root` & CSS Variables

**Q1. Why did you define variables like `--font`, `--text`, `--card-radius` in `:root` but hardcoded colors like `#1a1a1a` and `#000000` directly elsewhere?**
Variables are defined when a value is reused in multiple places. `--text` is used across 10+ rules so it earns a variable. `#000000` on the task text is a one-off spec value — no other rule references it, so a variable there adds no real benefit and would be misleading.

**Q2. What does `:root` mean and why use it instead of `body`?**
`:root` targets the `<html>` element — the highest point in the DOM. CSS custom properties declared there are available everywhere in the document, including inside SVGs and pseudo-elements. `body` works too for most cases but `:root` has higher specificity and is the conventional place for design tokens.

**Q3. What is the alternate to CSS custom properties for managing a colour palette?**
You could use a preprocessor like Sass/SCSS variables (`$primary: #1a1a1a`). The difference is Sass variables are compiled away at build time (static), whereas CSS custom properties exist at runtime and can be changed with JavaScript or media queries (`prefers-color-scheme`).

---

### Reset & Base Styles

**Q4. Why `* { margin: 0; padding: 0; box-sizing: border-box; }`?**
Browsers apply their own default margins and padding to elements like `<h2>`, `<ul>`, `<body>`. Zeroing them gives a clean baseline. `box-sizing: border-box` makes `width`/`height` include padding and border — without it, adding `padding: 20px` to a `240px` card would make it `280px` wide, breaking the layout.

**Q5. What is the difference between `box-sizing: border-box` and `box-sizing: content-box`?**
`content-box` (browser default): `width` only counts the content area. Padding and border add on top.
`border-box`: `width` includes content + padding + border. Makes sizing predictable — a `240px` element stays `240px` regardless of padding.

**Q6. Why `ul { list-style: none; }`?**
`<ul>` by default shows bullet points. Task items are custom-styled checkboxes — the native bullet would appear alongside them. Removing it prevents double markers.

**Q7. Why set `font-family` separately on `button` and `input` even though `body` already sets it?**
Buttons and inputs are replaced/form elements — they do not inherit `font-family` from `body` in all browsers by default. They must be explicitly set. `font-family: inherit` or the direct value both work; using `var(--font)` here keeps it tied to the design token.

---

### Header

**Q8. Why `height: 80px` with `display: flex; align-items: center; justify-content: center;` instead of `padding`?**
`padding` creates variable height depending on content size. A fixed `height: 80px` matches the exact Figma spec. Flex centering then positions the logo perfectly vertically and horizontally regardless of font size changes.

**Q9. What is `linear-gradient(90deg, ...)` — what does `90deg` mean?**
`90deg` means the gradient runs left to right (east direction). `0deg` would be bottom to top, `180deg` top to bottom. The colours defined at percentage stops (`0%`, `29.5%`, `60.5%`, `98%`) mark where each colour is at its full value; the browser interpolates smoothly between them.

**Q10. Why does the gradient use the same colours as the card backgrounds?**
The four card colours (`#FFF6E7`, `#E5FFE6`, `#F3E4F7`, `#EDBBB4`) are used in the header gradient to create visual cohesion — the header palette mirrors the card palette, tying the page together without needing extra brand colours.

---

### Layout — Container & Grid

**Q11. Why `max-width: 1000px` with `margin: 0 auto`?**
`max-width` prevents the content from becoming too wide on large monitors (readability degrades past ~1000px for dense card layouts). `margin: 0 auto` centers the container horizontally in whatever space is available.

**Q12. What does `align-items: start` do on the grid?**
By default, grid items stretch to the tallest item in their row. `align-items: start` makes each card only as tall as its own content. Without it, a card with 3 tasks would stretch to match a card with 10 tasks, creating large empty gaps inside shorter cards.

**Q13. Why `repeat(3, 1fr)` instead of `repeat(3, 240px)`?**
`1fr` (one fraction of available space) distributes the remaining space equally between columns. `240px` would be fixed — on narrower screens the cards would overflow or not fill the container. `1fr` is fluid and responsive. `min-width: 240px` on the card itself still enforces the minimum.

**Q14. What is the alternate to CSS Grid for this card layout?**
Flexbox with `flex-wrap: wrap` is a common alternative. The difference: Grid gives you explicit 2D control (rows and columns together). Flexbox is primarily 1D (either row or column). For a strict 3-column layout where alignment across rows matters, Grid is the right tool.

---

### Card

**Q15. Why `display: flex; flex-direction: column; gap: 16px` on `.todo-card`?**
The card has four sections stacked vertically: title row, date row, task list, add-task input. Flex column makes them stack. `gap: 16px` adds uniform spacing between them — cleaner than setting `margin-bottom` on every child individually, and it matches the Figma auto-layout gap spec exactly.

**Q16. What does `margin-top: auto` on `.add-task-row` do?**
When the card is a flex column, `margin-top: auto` on the last child absorbs all remaining vertical space, pushing the add-task input to the bottom of the card. This means short cards (few tasks) and tall cards (many tasks) all have the input pinned at the bottom consistently.

**Q17. Why `transition: transform 0.2s, box-shadow 0.2s` — why not `transition: all`?**
`transition: all` animates every CSS property that changes, including ones you didn't intend (like `background`, `border-color`). That can cause unexpected flashes. Explicitly naming `transform` and `box-shadow` animates only the hover lift effect.

**Q18. Why `flex-shrink: 0` on the delete button and checkbox?**
In a flex row, children can shrink below their natural size if there isn't enough space. `flex-shrink: 0` prevents the trash icon and checkbox from compressing when a long task title needs room. The title has `flex: 1` so it absorbs the squeeze instead.

---

### Card Title — `contenteditable`

**Q19. Why `contenteditable="true"` on an `<h2>` instead of an `<input>`?**
`<input>` is single-line only. `<h2 contenteditable>` can hold multi-word titles, wraps naturally, and inherits all heading styles. It also avoids the visual complexity of styling an input to look like a heading (removing borders, backgrounds, etc.).

**Q20. What is `.card-title:empty::before` and why `pointer-events: none` on it?**
`::before` inserts pseudo-content before the element's real content. When `.card-title` is empty, `::before` shows the `data-placeholder` text as a visual hint. `pointer-events: none` ensures clicks on the placeholder text fall through to the actual element below, so clicking the placeholder correctly focuses the editable field.

**Q21. Why the negative `margin: -2px -4px` paired with `padding: 2px 4px` on `.card-title`?**
The padding creates a clickable/hoverable area around the text and space for the focus background highlight. The equal negative margin cancels out the space that padding would add to the element's box, so the title text stays flush with the card edge. This is a common technique to add visual affordance without shifting surrounding elements.

---

### Date Picker

**Q22. Why use a hidden `<input type="date">` instead of keeping `contenteditable` on the date span?**
`contenteditable` lets users type anything — "asdf", "yesterday", invalid formats. A native `<input type="date">` enforces valid date entry, provides a browser calendar UI for free, and returns a reliable ISO `YYYY-MM-DD` string that's easy to format programmatically.

**Q23. How is the date picker hidden but still functional?**
`opacity: 0; width: 1px; height: 1px; pointer-events: none; position: absolute` makes it invisible and non-interactive. The `showPicker()` method is called programmatically on click, which opens the native calendar without the user needing to click the input directly. `display: none` or `visibility: hidden` would prevent `showPicker()` from working.

**Q24. Why the `try/catch` around `datePicker.showPicker()`?**
`showPicker()` is a relatively new API and throws a `NotAllowedError` in some browsers if called without a user gesture, or a `TypeError` in older browsers that don't support it. The `catch` block falls back to `datePicker.click()`, which triggers the native picker in older browsers.

---

### Checkbox

**Q25. Why `appearance: none` and `-webkit-appearance: none` on the checkbox?**
These remove the browser's native checkbox styling (which varies between Chrome, Firefox, Safari). Without them you cannot override the look with CSS — the browser renders its own OS-native control. Setting both prefixed and unprefixed covers older WebKit browsers (Safari) and modern standards-compliant browsers.

**Q26. How is the checkmark drawn without an image?**
The `.task-check:checked::after` pseudo-element draws an L-shape using two CSS borders (`border-right` + `border-bottom`), then `transform: rotate(45deg)` tilts the L into a checkmark (✓) shape. No image or icon font needed.

**Q27. What does `flex-shrink: 0` prevent specifically on `.task-check`?**
In a flex row (`task-item`), if the task text is very long, the row can run out of space and start squeezing children. Without `flex-shrink: 0`, the checkbox could compress below 16×16px and the checkmark geometry (hardcoded pixel positions in `::after`) would break visually.

---

### Event Delegation

**Q28. Why attach the `change` listener to `ul.task-list` instead of each individual checkbox?**
Event delegation. When the user adds a new task dynamically, that new `<li>` has no listeners attached — it was created after the initial setup. By listening on the parent `<ul>`, any `change` event that bubbles up from any checkbox (present or future) is caught. This is more efficient and correct than re-attaching listeners after every DOM insertion.

**Q29. What does `e.target.closest('.delete-task-btn')` do and why use it instead of `e.target === btn`?**
`closest()` walks up the DOM tree from the click target, looking for the first ancestor matching the selector. The SVG inside the button may be the actual `e.target` (the click lands on the SVG path, not the button). `e.target === btn` would fail in that case. `closest()` handles the case where the click lands on a child element of the button.

---

### JavaScript Architecture

**Q30. Why `let uid = 1` with `uid++` for IDs instead of using array index?**
Array index breaks when items are deleted — the third item becomes index 0 if you delete the first two. An always-incrementing `uid` gives each task/list a stable, unique identity that never changes or collides, regardless of deletions or reordering.

**Q31. Why `const DARK_BG = new Set([...])` instead of an array with `.includes()`?**
`Set.has()` is O(1) — constant time regardless of set size. `Array.includes()` is O(n) — it scans every element. For a two-element check it makes no measurable difference here, but `Set` communicates the intent clearly: this is a membership lookup, not an ordered list.

**Q32. Why define SVG strings as constants (`TRASH_SVG`, `CALENDAR_SVG`, `CLOSE_SVG`) at the top of the file?**
Each card creation calls `buildCard()` which uses these strings. Defining them once at module scope means the strings are created once in memory and reused. It also means changing an icon requires editing one line, not hunting through a function.

**Q33. Why `span.textContent = text` instead of `span.innerHTML = text` when adding a new task?**
`textContent` treats the value as plain text — any `<`, `>`, `&` characters are escaped automatically. `innerHTML` would parse them as HTML, so a user typing `<script>alert(1)</script>` as a task name could inject executable code (XSS). `textContent` is always safe for user-supplied content.

---

### Weather

**Q34. Why use `ipapi.co` instead of `navigator.geolocation`?**
`navigator.geolocation` requires the user to grant a browser permission popup. If denied, no weather shows. `ipapi.co` returns approximate coordinates based on the request's IP address — no permission prompt, always works, no user friction.

**Q35. What is the risk of relying on `ipapi.co`?**
IP-based geolocation is approximate (city-level at best, sometimes wrong for VPNs or mobile networks). It also has a free tier rate limit (1,000 requests/day). For a production app you would use a paid geolocation API or the browser's geolocation with a graceful fallback.

**Q36. Why `Math.round(weather.current.temperature_2m)` instead of showing the raw value?**
The Open-Meteo API returns temperatures like `21.3°C`. Displaying `21.3°C` in a small UI element looks noisy. Rounding to `21°C` is more readable and matches the design's `67 C` style.

**Q37. Why `async/await` with `try/catch` instead of `.then().catch()`?**
Both are correct. `async/await` reads linearly (top to bottom) like synchronous code, making the two-step fetch (geolocation → weather) easy to follow. The equivalent `.then()` chain would nest two callbacks and be harder to read. The `catch` block silently swallows errors so the rest of the UI (date, cards) works even if weather fails.

---

### Responsive Design

**Q38. Why three separate `@media` breakpoints (1024px, 640px, 400px)?**
Each breakpoint targets a different class of device: 1024px catches tablets in portrait, 640px catches large phones, 400px catches small phones. Three breakpoints is a common minimal set — enough to cover the major form factors without over-engineering.

**Q39. What is the difference between `max-width` and `min-width` in a media query?**
`max-width: 640px` applies styles when the viewport is 640px wide or smaller (mobile-first override). `min-width: 640px` applies when the viewport is 640px or wider (desktop-first override). This project uses `max-width` (desktop-first approach) — base styles are desktop, media queries override for smaller screens.

**Q40. Why `clamp(2rem, 5vw, 3rem)` on `.greeting` instead of a fixed size?**
`clamp(min, preferred, max)` sets a fluid range. At small screens `5vw` could drop below `2rem` — `clamp` floors it at `2rem`. At large screens it could exceed `3rem` — `clamp` caps it. The result is a font size that scales smoothly between `2rem` and `3rem` based on viewport width, with no jarring jumps at breakpoints.
