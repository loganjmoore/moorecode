# Mobile navigation recovery

Source: shared `navigation.js`, all ten HTML navigation headers, `style.css`.

Reproduced at 390px: Escape left the mobile menu open, the button had no
expanded state and its target measured 40×36px. The shared script now keeps
ARIA and visibility synchronized; Escape dismisses and restores button focus,
outside clicks and selected links dismiss, and breakpoint changes reset.
The menu button and mobile project links have 44px minimum targets.

Verified in the rendered browser: expanded/collapsed accessibility states,
Escape and focus recovery, outside dismissal, Projects → Contact navigation,
and 320px document width matching viewport with all eleven project links
44px tall. Node syntax check and all-page shared-script/reference checks pass.
Independent finish review passed. No framework or dependency was added.

Counts as one mobile journey improvement. Open gates: production deployment,
physical-device/assistive-technology checks and conversion impact. Navigation
still requires JavaScript on mobile, consistent with the existing site.

## Consulting inquiry outline and fallback — 2026-10-03

Current source uses `mailto:` links, not a web form or delivery API. There is no local submission validator, failure/retry handler or site-held inquiry draft to certify. The broader contact-delivery gate remains open and must not be described as an untested web form.

The consulting page now links directly to `contact.html#project-inquiry`. This new section gives five qualification prompts: goal, current workflow/tools, useful first result, timing and optional budget. A public static mailto draft preserves the existing Logan recipient and supplies an editable subject/outline. A 501-byte TXT brief offers the same prompts when a mail app is unavailable. The visitor reviews and sends from their own account; the site neither collects nor stores inquiry values. It asks visitors to omit credentials, payment details and private customer data. No named client claim or consulting price was changed.

Rendered checks: keyboard Enter from consulting reached the exact anchored contact section; Back/Forward returned to the same context. Actual browser TXT download to `moorecode-project-brief.txt` exactly matches authored bytes (SHA256 40fc3d92363ad50f2ad00e4b24c063adc2f68d44b440d1f1531357ff2ffe3388). The draft URI was inspected for the recipient, encoded subject and five editable prompts; native mail composition, sending and inbox arrival were not executed.

At 390×844 and 320×568, body width equals viewport width and both new actions measure 44px tall; text fits the incumbent dark prose surface. Evidence: `docs/growth-evidence/consulting-inquiry-mobile.png`. Seven offline acquisition tests pass, including the contextual anchor, existing recipient and brief/mailto prompt parity; navigation syntax and analytics privacy checks pass.

This extends the existing mobile inquiry journey without increasing the portfolio idea count. Publication, native mail-client behavior, confirmed inbox delivery and consulting-to-paid conversion remain open. No outgoing email, hosting or tracker change occurred.
