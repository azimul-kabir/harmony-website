# Harmony developer website

The responsive developer and getting-started website for [Harmony](https://github.com/azimul-kabir/harmony), published at `https://harmony.azimulkabir.com/`.

## Preview locally

Serve this directory with a static file server, then open the served address in a browser. For example:

```bash
python -m http.server 8080
```

The site is plain HTML, CSS, and JavaScript with no build step or server-side secrets. Its concise homepage links to separate Features, Get started, FAQ, and Developers pages. The home and Features pages present a screenshot-led view, balanced across desktop, light-theme, and mobile artwork discovered from the current README. Feature names, setup instructions, FAQs, developer resources (including nested Markdown docs), logo, hero artwork, and screenshots load from GitHub when a page opens. Project facts and imagery are not duplicated here, so updates to Harmony's default branch appear automatically. GitHub API indexes and documentation are cached in the browser briefly to reduce rate-limit pressure; when GitHub is unavailable, recent cached content is used with a clear status note. If a live source cannot be reached, the affected section reports the problem and links to the upstream documentation.

The FAQ is assembled from current guide and release-note sections. The installation walkthrough, feature summaries, technology stack, and developer-resource links likewise render current material from the source repository.

## Custom domain and deployment

`CNAME` and the GitHub Pages Actions workflow publish the static website at `harmony.azimulkabir.com` after changes reach this repository's `main` branch. Point the subdomain's DNS CNAME at the GitHub Pages hostname for this repository (`azimul-kabir.github.io`) and enable GitHub Pages with **GitHub Actions** as its build and deployment source. GitHub Pages provisions HTTPS after DNS has propagated.
