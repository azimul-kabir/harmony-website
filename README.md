# Harmony website

The landing page for [Harmony](https://github.com/azimul-kabir/harmony), published at <https://harmony.azimulkabir.com/>.

It's a single static page: `index.html`, `styles.css`, a small `main.js` (screenshot tabs and copy buttons), and optimized images in `assets/`. There is no build step, and nothing is fetched from GitHub at runtime.

## Preview locally

```bash
python3 -m http.server 8080
```

## Updating for a new Harmony release

1. Update the version in the hero pill and the `docker pull` tag in `index.html`.
2. If the UI changed, re-export the screenshots from `harmony/docs/images/screenshots/` to WebP in `assets/shots/` (desktop 1400px wide, mobile 560px wide).

`features.html`, `get-started.html`, `faq.html`, and `developers.html` are redirect stubs that keep old links working.

## Deploy

`.github/workflows/pages.yml` publishes the repository root to GitHub Pages on every push to `main`. DNS for `harmony.azimulkabir.com` is a DNS-only Cloudflare CNAME to `azimul-kabir.github.io`, matching the `CNAME` file.
