# Job Scraper Case Study Design

## Goal

Replace the separate generic “n8n Job Scraper” and “Job Viewer” cards with one featured visual case study that explains the complete automation from collection to usable dashboard.

## Scope

- Keep Fitbit and Class Action unchanged because they are under construction.
- Reuse the real sanitized n8n workflow screenshot already in the portfolio.
- Add a current screenshot of the public Job Viewer demo.
- Show the verified production facts: 15 workflow nodes, three targeted scraper branches, and schedule/webhook triggers.
- Present the pipeline as: trigger → targeted scrapers → merge/prepare → Gemini enrichment → Job Viewer → email digest.
- Keep both useful actions: inspect the workflow image and open the live Job Viewer demo.

## Layout

The Automation & Systems section will begin with a full-width featured card. Its visual half uses the workflow screenshot as the main image and the Job Viewer screenshot as an inset output preview. Its content half contains the case-study title, concise outcome-oriented copy, three proof points, a compact pipeline diagram, and two explicit actions.

Class Action Scanner remains a standard project card beneath the feature. The old Job Scraper and Job Viewer cards are removed to avoid presenting one system as two unrelated projects.

## Verification

- A build-level Node test will assert that the generated page contains the feature, verified proof points, both visuals, both actions, and no redundant old cards.
- Astro’s production build must complete successfully.
- Playwright will verify the feature visually at desktop and mobile widths and exercise both actions.
