# Frontend refactor rules
Stack: React + [framework], Tailwind [version]. Source in [path].
Goal: modernise visuals and make fully responsive. Page layouts and structure stay the same.
Never change functionality, routes, API calls, state logic or text.
Style: light theme, blue accent, neutral greys, subtle borders, small radius, restrained
shadows, ~150ms transitions. No gradients, glassmorphism, glows, emoji icons, decorative animation.
Colours live only in the Tailwind theme (primary [hex], neutrals, success/warning/error).
Never hard-code colours in components.
Responsive: mobile-first, 320-1440px, no horizontal scroll, usable at 200% zoom,
44px touch targets, 16px inputs on mobile.
Workflow: one page or area at a time. Don't read files you aren't editing. Keep replies short.
After each unit: run the build, commit, tick the item in REFACTOR_PROGRESS.md, then stop.
