# Portfolio acquisition paths

Source: `projects.html`. Counts as one content-refresh improvement, not one per link.

On 2026-10-02, the old Drifta slug-only App Store URL returned HTTP 404.
Apple's US lookup API and current developer listing verified TILT App
6775362731, Drifta 6749255417, Debtless 6748594182 and existing No Tipper
6742201810. Names and developer Logan Moore matched. TILT/Drifta/Debtless
copy now describes their current listed products.

Primary evidence: [Apple developer listing](https://apps.apple.com/us/developer/logan-moore/id382096113),
[US lookup](https://itunes.apple.com/lookup?id=382096113&entity=software&country=us).
The public [PancakeBudget site](https://www.pancakebudget.com/) says it is
closed. Its card states that and directs inquiries to existing Contact.
Blackjack's US lookup returned no result; its card links to existing support
information instead of claiming a download. Math has no verified store
listing, so its link explicitly asks about availability. PARE links to its
existing product website, not guessed app listings.

Verification: all local HTML references resolve, all portfolio store links
have numeric app IDs, JavaScript syntax passes. Rendered desktop and 390/320px
views preserve incumbent styling and have no horizontal overflow. Actual
Math inquiry and Blackjack information clicks reach their respective local
pages. Screenshots: `docs/growth-evidence/projects-desktop.png` and
`projects-mobile.png`. Independent Impeccable finish review passed; detector
warnings refer only to unchanged Inter typography, retained for this narrow
repair.

Open gates: deployment, real installs/contact delivery, paid-customer lift.
US listing absence does not establish worldwide availability. No outbound
message, purchase, tracking configuration or provider key was used. Debtless
is free; its installs are not paying customers. Existing anonymous opt-in
website analytics can measure navigation, not attribute subscriptions.

## Offline regression CI, 2026-10-03

`Verify portfolio destinations` checks pull requests and pushes to main or
the growth branch. It uses read-only repository permissions and has no deploy
step. Python's standard-library HTML parser checks all ten root HTML pages:
local files and anchors must resolve, and Apple destinations require numeric
IDs. The portfolio also retains its four distinct store URLs, Math/Pancake
inquiry links, Blackjack support link and contact email destination.

All six checks pass locally, including negative checks proving detection of
a missing file, missing anchor and slug-only Apple URL. Both browser scripts
pass syntax checks; the existing PostHog browser contract passes using mocked
network transport. CI does not request external websites or establish store
availability, inbox delivery, installs or revenue. This adds regression
protection to the existing rendered acquisition paths without changing UI.

## Main integration, 2026-10-04

Integrated main 7497e05 with its blog, feed, verification files, entity schema and semantic project list. Preserved the existing reviewed portfolio links and consulting brief. The newly imported project schema was aligned with the visible card descriptions and actual destinations, including closed/unverified app paths. Added a parity check to prevent schema reintroducing stale store URLs. The link checker now preserves directory trailing slashes and checks the new blog pages; nine offline checks and analytics consent contract pass. All four new blog pages reuse the existing keyboard/escape menu handler and expanded state. Rendered 390px consulting → project inquiry and menu → blog journeys passed without overflow or errors; fresh blog menu Enter/Escape passed. Local screenshot: /tmp/moorecode-integrated-inquiry-mobile.png. No email was sent and no production release occurred.
