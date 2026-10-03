"""Offline checks for the static site's acquisition destinations."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit, parse_qs
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.links = []
        self.ids = set()
        self.store_links = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        for attribute in ("href", "src"):
            if attribute in attrs:
                self.links.append(attrs[attribute])
        if tag == "a" and "store" in attrs.get("class", "").split():
            self.store_links.append(attrs.get("href", ""))


def destination_errors(pages, exists):
    errors = []
    for filename, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                if url.hostname == "apps.apple.com" and not re.search(r"/id\d+/?$", url.path):
                    errors.append(f"{filename}: App Store destination needs a numeric ID: {link}")
                continue
            path = unquote(url.path)
            target = path.lstrip("/") if path.startswith("/") else str(Path(filename).parent / path) if path else filename
            if not target or target.endswith("/"):
                target += "index.html"
            if not exists(target):
                errors.append(f"{filename}: missing destination {target}")
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f"{filename}: missing anchor {target}#{url.fragment}")
    return errors


class PortfolioPaths(unittest.TestCase):
    def test_all_public_pages_resolve_local_destinations(self):
        pages = {path.name: Page(path.read_text()) for path in ROOT.glob("*.html")}
        self.assertGreaterEqual(len(pages), 10)
        self.assertEqual(destination_errors(pages, lambda path: (ROOT / path).is_file()), [])

    def test_consulting_brief_keeps_draft_recipient_and_outline(self):
        page = Page((ROOT / "contact.html").read_text())
        drafts = [urlsplit(link) for link in page.links if link.startswith("mailto:") and urlsplit(link).query]
        self.assertEqual(len(drafts), 1)
        self.assertEqual(drafts[0].path, "loganjmoore@gmail.com")
        query = parse_qs(drafts[0].query)
        self.assertEqual(set(query), {"subject", "body"})
        self.assertEqual(query["subject"], ["Consulting project inquiry"])
        brief = (ROOT / "project-brief.txt").read_text()
        for prompt in ("Goal:", "Current workflow and tools:", "Useful first result:", "Timing:", "Budget"):
            self.assertIn(prompt, query["body"][0])
            self.assertIn(prompt, brief)
        self.assertIn("project-brief.txt", page.links)
        self.assertIn("contact.html#project-inquiry", Page((ROOT / "consulting.html").read_text()).links)
        self.assertNotIn("<form", (ROOT / "contact.html").read_text())

    def test_missing_destination_is_detected(self):
        self.assertIn("missing destination", destination_errors({"index.html": Page('<a href="missing.html">Ask</a>')}, lambda _: False)[0])

    def test_missing_anchor_is_detected(self):
        self.assertIn("missing anchor", destination_errors({"index.html": Page('<a href="#missing">Ask</a>')}, lambda _: True)[0])

    def test_slug_only_app_store_url_is_detected(self):
        self.assertIn("numeric ID", destination_errors({"index.html": Page('<a href="https://apps.apple.com/us/app/tilt-app">Install</a>')}, lambda _: True)[0])

    def test_portfolio_has_four_numeric_store_destinations(self):
        links = Page((ROOT / "projects.html").read_text()).store_links
        store_links = [link for link in links if urlsplit(link).hostname == "apps.apple.com"]
        self.assertEqual(len(store_links), 4)
        self.assertEqual(len(set(store_links)), 4)

    def test_unverified_products_keep_inquiry_and_support_paths(self):
        source = (ROOT / "projects.html").read_text()
        for label, target in (("Ask about PancakeBudget", "contact.html"), ("Ask about Math Prizes", "contact.html"), ("About Blackjack Now", "blackjack-support.html")):
            self.assertRegex(source, rf'<a\b[^>]*href="{re.escape(target)}"[^>]*>{re.escape(label)}</a>')
        self.assertIn("mailto:loganjmoore@gmail.com", Page((ROOT / "contact.html").read_text()).links)


if __name__ == "__main__":
    unittest.main()
