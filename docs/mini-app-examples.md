# Example Mini Apps

Reference implementations to learn from when building your own mini apps.

## meetup-cloudflare

**[GitHub](https://github.com/antler-browser/meetup-cloudflare)**

Real-time event check-in app. Displays a live attendee list as people scan the QR code.

**Learn from this:**
- Social links in user profiles

---

## draw-on-my-phone-game

**[GitHub](https://github.com/antler-browser/draw-on-my-phone-game)**

A multiplayer "telephone with pictures" party game. Players alternate between drawing and guessing, creating chains of misinterpretation. 3-8 players, physical pass-the-phone gameplay.

**Learn from this:**
- Game room creation and player lobbies
- Turn-based game flow
- Complex multiplayer game state management
- Drawing canvas with touch support

---

## meetup-self-hosted

**[GitHub](https://github.com/antler-browser/meetup-self-hosted)**

Same functionality as meetup-cloudflare, but uses self-hosted REST API + SQLite instead of using Cloudflare. Designed for self-hosting with Docker.

**Learn from this:**
- Self-hosted REST API + SQLite database
- Docker Compose configuration