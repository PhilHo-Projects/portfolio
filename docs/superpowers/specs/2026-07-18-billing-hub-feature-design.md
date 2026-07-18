# Billing Hub Featured Project Design

## Goal

Add Billing Hub to the portfolio as a featured Web Development project that demonstrates the real product, makes the public demo easy to open, and clearly communicates that its source repository is private.

## Scope and constraints

- Change only the Portfolio repository.
- Do not modify the Billing Hub checkout, Git history, database, deployment, or live application.
- Use the live application's public demo mode only to capture portfolio screenshots. Do not log in or expose private data.
- Keep the public URL exactly `https://philippeho.dev/InvoicingAndTrackingTool/`.
- Do not add a source-code link because the GitHub repository is private.
- Do not push or deploy the portfolio as part of this feature unless the user asks separately.

## Chosen presentation

Place one full-width featured project directly below the Web Development heading and above the existing project-card grid. This matches the established featured treatments for the Job Scraper and MusicPlayer while giving the strongest web application its own visual hierarchy.

The feature will use a real Gazette-interface dashboard screenshot as its dominant artifact. A smaller invoice-preview screenshot will overlap or sit beside it to show the workflow's finished output rather than relying on one generic dashboard view. On narrow screens, the imagery will stack without overlap or horizontal scrolling.

The content will identify the product as **Billing Hub** and frame it as a private freelance-operations workspace. Its short explanation will connect time and expense tracking to invoice generation. Three concise proof points will cover:

1. Multiple companies and timesheets
2. Expense tracking and invoice generation
3. PDF, archive, download, and paid-state workflows

The primary action will be **Open public demo** and will open the live Billing Hub URL in a new tab. A visible **Private repository** status will replace a source action and will not behave like a disabled button.

## Alternatives considered

### Add Billing Hub to the generic project grid

This is the lowest-effort option, but it would make the most complete web application look equivalent to smaller projects and would not give its real UI enough room to be legible.

### Build a dedicated portfolio case-study page

This would offer the most narrative depth, but it creates routing, copy, and maintenance work beyond the current request. The public demo already provides hands-on depth.

### Featured project in the existing section — selected

This provides a strong visual improvement, reuses the portfolio's established component model, and keeps the visitor one click away from the working demo without adding a new route.

## Component architecture

- Create `src/components/BillingHubFeatured.astro` as the sole owner of Billing Hub copy, screenshot references, proof points, status, and public-demo URL.
- Modify `src/components/Projects.astro` only to import and render the new component above the existing Web Development grid.
- Add two optimized PNG screenshots under `public/assets/img/`: one dashboard view and one invoice-preview view.
- Keep Billing Hub out of `src/data/projects.ts`; duplicating it in the generic project grid would weaken the hierarchy and create two sources of presentation data.

The feature is static Astro markup and local image assets. It introduces no new runtime dependency, client-side state, API call, or portfolio data flow.

## Visual direction

Preserve the portfolio's dark terminal-like identity, typography, spacing scale, and small-radius component language. Use the warm yellow already established by the site as the main action and status accent, while the real Billing Hub screenshots provide the visual contrast.

The layout should read as an application showcase, not another nested card grid:

- A large screenshot stage occupies the dominant portion of the section.
- The invoice-preview artifact supplies depth and communicates output.
- Copy and actions are grouped in a distinct content area.
- Borders are restrained and any shadow is local to the screenshot layering, not combined with wide decorative card shadows.
- Hover motion is limited to small image and arrow movement and has a reduced-motion alternative.

## Content and accessibility

- The card is an `article` with a unique project data attribute for regression tests.
- The project title is a semantic heading inside the existing Web Development section.
- Screenshot alt text describes the visible Billing Hub interface and its purpose.
- The demo link has an explicit accessible name, keyboard focus treatment, `target="_blank"`, and `rel="noreferrer"`.
- The private-repository status is plain descriptive content, not an inert or misleading control.
- Text contrast targets WCAG AA: 4.5:1 for body text and 3:1 for large text.
- The mobile layout must fit a 390px viewport without horizontal overflow.

## Screenshot capture

Capture both images from the live public demo using Playwright:

1. Confirm the page is in public demo mode before interacting.
2. Capture a representative Gazette dashboard state using only bundled in-memory sample data.
3. Open a representative invoice preview and capture it without saving, downloading, logging in, or touching private state.
4. Store only the resulting image files in the Portfolio repository.

## Testing and acceptance criteria

Add a focused Node test that reads the Astro source and verifies:

- `Projects.astro` imports and renders `BillingHubFeatured` before the generic Web Development project grid.
- The featured component identifies Billing Hub and the public demo.
- The primary link uses the exact live URL with safe new-tab attributes.
- The component advertises a private repository without a GitHub/source link.
- Both screenshot assets have descriptive alt text and references to local portfolio assets.
- The proof-point copy covers companies/timesheets, expenses/invoicing, and PDF/archive/download/paid workflows.

Then run the complete Node test suite and the Astro production build. Finally, inspect the page at desktop and 390px mobile sizes with Playwright, checking screenshot legibility, focus behavior, console errors, broken assets, and horizontal overflow.

## Out of scope

- Changes to Billing Hub itself
- Authentication or private-data screenshots
- A dedicated Billing Hub portfolio route
- A public source-code link
- Deployment to Hetzner/Coolify

