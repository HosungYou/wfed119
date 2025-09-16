**Module Overview**
- Purpose: Prioritize values by dragging “sticky notes” into four categories — Very Important, Important, Somewhat Important, Not Important — before the Strength Discovery module.
- Inputs: Terminal, Instrumental, and Work Values (translated), aligned with the Info Sheet and textbook pp.4–6.
- Output: Local, per-user layout saved in the browser; optional JSON export for reflection or submission.

**Files**
- `Values_English_Translation.md`: English translations of Terminal, Instrumental, and Work Values.
- `activity/drag-categorize/index.html`: Drag-and-drop UI.
- `activity/drag-categorize/styles.css`: Styling.
- `activity/drag-categorize/app.js`: Logic, persistence, export.
- `activity/drag-categorize/values.json`: Data for all value sets.
- `activity/drag-categorize/screenshot_before_strength_discovery.png`: Provided screenshot, placed before Strength Discovery context.

**Usage**
- Open `activity/drag-categorize/index.html` in a browser.
- Choose a value set (default: Work). Drag each note into a category column.
- Use Export JSON to download your layout; Reset clears the current set’s layout.

**Integration Guidance**
- Place this module immediately before the Strength Discovery module in your course flow.
- If embedding into LMS or a site, host the `activity/drag-categorize` folder as static files.
- To pre-seed values or reduce the set (e.g., Work Values only), edit `values.json`.

**Notes**
- Layout saves to `localStorage` per set; no backend required.
- If you’d like auto-capture of screenshots, add a brief instruction to students to take a screenshot of their final layout for submission.

