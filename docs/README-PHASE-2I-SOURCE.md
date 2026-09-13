# BUYE IELTS — Phase 2F

Phase 2F upgrades the Phase 2E 157-lesson catalogue into a browser-based learning engine.

### Added
- Interactive quick-check question in every lesson
- Instant feedback + rationale
- Completion tracking
- Mistake/review queue
- Bookmarks
- Skill progress
- Search + skill filters
- Random lesson
- Self-paced Quick Practice
- Practice result screen
- Responsive learner UI

### Run locally
Because the app loads JSON with `fetch`, use a local server:
`python -m http.server 8000`
Then open `http://localhost:8000`.

### Scope
This is a learning-engine prototype, not yet a full official IELTS exam simulator. Full exam simulation, audio, section scoring, detailed analytics, accounts/backend, and verified current IELTS format rules are later build stages.

Learner-facing explanations and practice prompts are original BUYE content. The research archive is not bundled into the learner site.
