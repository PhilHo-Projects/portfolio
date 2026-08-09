# Project Section Priorities Design

## Goal

Make the portfolio lead with the strongest web work while keeping temporarily hidden projects easy to restore.

## Presentation changes

- Render **Web Development** before **Game Development**. Keep **Automation & Systems** and **Native & Tools** in their current relative order.
- Remove the **Coming soon** badge from the Unreal Engine 5 coursework card. Projects without an explicit status render no status badge; Song Finder keeps its explicitly configured **Coming soon** status.
- Omit Personal SoundCloud and MP3 Maker completely from the rendered page, including their cards and detail panels.

## Reversible visibility

Add an optional `visible` field to project data. Projects remain visible by default, while Personal SoundCloud and MP3 Maker set `visible: false`. The project renderer filters out only entries explicitly marked false.

This keeps their descriptions, links, screenshots, and detail metadata in source control so restoring either project is a one-line data change. Hidden projects are not emitted into the built HTML and therefore are not exposed to visitors, assistive technology, or search indexing through this page.

## Status rendering

Project cards derive a label only from an explicit `status`. The badge is conditionally rendered when that label exists instead of treating a missing status as `coming-soon`.

No new status value is needed for Unreal Engine 5 because its existing **Coursework** subtitle already explains the card.

## Verification

Update the project index contract tests first to assert that:

- Web Development appears before Game Development in the built page.
- Personal SoundCloud and MP3 Maker have no trigger or detail markup in the built page.
- Unreal Engine 5 has no Coming soon badge.
- Song Finder still displays Coming soon.

Then make the smallest data and rendering changes required to pass the contract tests, followed by the complete test and production-build checks.
