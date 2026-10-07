# MooreCode production delivery verification

Verified at: `2026-10-07T17:53:30Z`

Production matched the `origin/main` baseline at commit `fd16b736ec3864c77e03140c1aaf256db693282a` (commit timestamp `2026-10-07T03:48:57-05:00`). The deployment hash is inferred by comparing cache-busted production pages with the commit's unique visible content because GitHub Pages does not expose a source revision in the response.

Cache-busted browser checks confirmed:

- The homepage visibly defines MooreCode and contains all six 3D-printing answers.
- The blog index lists all nine posts.
- The three posts dated October 7, 2026 return full article content at their canonical routes.
- All six 3D-printing and printmaking posts contain their plain-language entity-definition sentence.
- The homepage has the consent-controlled PostHog loader, panel, and Analytics settings control; the blog index and posts do not. This repository change moves that same component into the shared loader and includes it on all 20 public HTML files.

