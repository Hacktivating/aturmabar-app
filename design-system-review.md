# Neutral design system review

The login route renders with a warm beige light-mode background, white card surface, black typography, black primary action, and restrained beige-gray borders. Dark mode renders with charcoal/near-black surfaces, soft neutral borders, warm-white text, and no blue accent dependency. The centered form proportions are calmer and more balanced than the previous layout.

The palette transformation was applied across all route components in `frontend/src/pages` and shared components, including dashboard, admin dashboard, members, sessions, session details, leaderboard, verification, register, password recovery, and 404 screens. Remaining semantic rose/green status colors are intentionally retained for error/success communication.

Additional browser checks confirmed the 404 route renders as a neutral centered card and the register route inherits the same charcoal theme and spacing structure in dark mode. The app’s persistent language toggle also continues to render Indonesian translations on the public routes.
