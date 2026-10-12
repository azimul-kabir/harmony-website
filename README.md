# Harmony developer website

The responsive developer and getting-started website for [Harmony](https://github.com/azimul-kabir/harmony), published at `https://harmony.azimulkabir.com/`.

## Preview locally

Serve this directory with a static file server, then open the served address in a browser. For example:

```bash
python -m http.server 8080
```

The site is plain HTML, CSS, and JavaScript with no build step or server-side secrets. Its concise homepage links to separate Features, Get started, FAQ, and Developers pages. The home and Features pages present a screenshot-led view, balanced across desktop, light-theme, and mobile artwork discovered from the current README. Feature names, setup instructions, FAQs, developer resources (including nested Markdown docs), logo, hero artwork, and screenshots load from GitHub when a page opens. Project facts and imagery are not duplicated here, so updates to Harmony's default branch appear automatically. GitHub API indexes and documentation are cached in the browser briefly to reduce rate-limit pressure; when GitHub is unavailable, recent cached content is used with a clear status note. If a live source cannot be reached, the affected section reports the problem and links to the upstream documentation.

The FAQ is assembled from current guide and release-note sections. The installation walkthrough, feature summaries, technology stack, and developer-resource links likewise render current material from the source repository.

## Deploy with GitHub Pages

GitHub is the source of truth and serves the static site with GitHub Pages Actions. There is no package installation or compilation step.

The workflow in `.github/workflows/pages.yml` publishes the repository root whenever changes reach `main`. The repository must remain public for GitHub Pages on the current account plan.

To use `harmony.azimulkabir.com`, keep DNS hosted by Cloudflare and add a DNS-only CNAME record for `harmony` pointing to `azimul-kabir.github.io`. The `CNAME` file and GitHub Pages custom-domain setting use the same hostname. GitHub provisions HTTPS after DNS verification; allow time for DNS propagation and certificate issuance.
