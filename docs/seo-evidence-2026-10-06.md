# MooreCode consent and public-page measurement follow-up

Work order3891 / PR12. Baseline9c2e34f24f1fc3cb2dd2ee0d7a3d134d67b87383: live homepage has no site-owned analytics choice and consentKey is empty, so collection stays off. This is absent measurement, not proof of absent visitors. Public direct definitions are added beside titles while retaining product disclosures. Unverified United States service-area targeting was removed.

Site-owned consent now offers equal accept/decline controls and a homepage footer withdrawal path. Collection remains off until accepted and respects DNT/GPC/internal exclusions. Random identifiers can link visits; wording does not promise complete anonymity. A storage-failed withdrawal denies collection in memory immediately and resets identifiers. Explicit authored MooreCode static routes retain page attribution; unknown/private routes still redact identifiers. Contact navigation is intent, never a submitted lead.

Fresh validation: actual390px rendered accept, decline, reopen, status transitions and44px controls; no body overflow. Analytics contract checks cover no events before consent, withdrawal/reaccept/privacy signals, sanitized paths/URLs, explicit public routes and private-path redaction. Independent review found and resolved failed-storage withdrawal and public-route attribution gaps. Read-only CI runs the static/analytics/consent UI contracts. Original typography detector warnings predate this patch; preserve the incumbent style.

Production and exact CI proof will be recorded in PR12 after delivery verification. Test activity is QA. No ranking, signup or lead improvement is attributed to measurement restoration; compare only complete delivery-aligned observations when mature.
