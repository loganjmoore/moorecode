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
