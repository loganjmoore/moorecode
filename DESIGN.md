# Design Quality

This repository should treat design quality as part of every user-facing change. Use this file as the local visual contract for Codex, Claude Code, and any foreman-run agent.

## Operating Rule

For any task that touches UI, onboarding, dashboards, settings, marketing pages, app screens, visual copy, or screenshots:

- Read this file before making visual decisions.
- Use installed design skills/plugins such as Taste Skill, Impeccable, or equivalent critique tools when available.
- Make the interface look deliberate, specific to this product, and useful in real workflows.
- Verify the rendered result with a screenshot, simulator run, browser preview, or the closest platform-appropriate visual check.
- Record the visual evidence in the handoff or PR notes.

## Product Feel

- Prefer quiet, clear, task-focused interfaces over generic landing-page composition.
- Make the primary user action obvious without oversized hero treatment unless the screen is truly a marketing hero.
- Keep density appropriate for repeated use: dashboards and operational tools should be scannable, compact, and organized.
- Use domain-specific labels, states, and empty states. Avoid vague AI-sounding copy.
- Do not advertise integrations, automation, notifications, payments, analytics, or AI behavior unless the feature is actually shipped and verified.

## Visual Standards

- Use a restrained palette with meaningful contrast. Avoid one-note purple, beige, slate, brown, or generic gradient-heavy themes unless the product brand already requires them.
- Use consistent spacing, alignment, and type scale. Do not scale text with viewport width.
- Keep cards for repeated items, dialogs, and genuinely framed tools. Do not nest cards or turn every section into a floating card.
- Prefer familiar controls: icon buttons for tools, segmented controls for modes, toggles for binary settings, sliders or inputs for numeric values, and tabs for alternate views.
- Use real product, gameplay, place, person, or object imagery when imagery matters. Avoid dark blurred stock-like backgrounds when users need to inspect the subject.
- Make responsive layouts stable. Text must not overflow, overlap, or get clipped on mobile or desktop.

## Anti-Patterns To Remove

- Generic AI SaaS hero sections with vague promises and decorative blobs.
- Oversized rounded cards stacked inside other rounded cards.
- Placeholder metrics, fake activity, unsupported integration claims, or copy that sounds more capable than the product is.
- Repetitive icon-card grids that explain features instead of helping users act.
- Low-information gradients, glass panels, and decorative backgrounds that do not support the workflow.

## Completion Bar

A user-facing change is not complete until it has been reviewed against this contract and visually checked in the running app or a faithful preview. If visual verification is not feasible, state exactly why and what was checked instead.
