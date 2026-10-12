# Harmony developer website

The responsive developer and getting-started website for [Harmony](https://github.com/azimul-kabir/harmony), published at `https://harmony.azimulkabir.com/`.

## Preview locally

Serve this directory with a static file server, then open the served address in a browser. For example:

```bash
python -m http.server 8080
```

The site is plain HTML, CSS, and JavaScript with no build step or server-side secrets. Its concise homepage links to separate Features, Get started, FAQ, and Developers pages. The home and Features pages present a screenshot-led view, balanced across desktop, light-theme, and mobile artwork discovered from the current README. Feature names, setup instructions, FAQs, developer resources (including nested Markdown docs), logo, hero artwork, and screenshots load from GitHub when a page opens. Project facts and imagery are not duplicated here, so updates to Harmony's default branch appear automatically. GitHub API indexes and documentation are cached in the browser briefly to reduce rate-limit pressure; when GitHub is unavailable, recent cached content is used with a clear status note. If a live source cannot be reached, the affected section reports the problem and links to the upstream documentation.

The FAQ is assembled from current guide and release-note sections. The installation walkthrough, feature summaries, technology stack, and developer-resource links likewise render current material from the source repository.

## Deploy with Cloudflare Pages

GitHub remains the source of truth; Cloudflare Pages builds and hosts this private repository. No GitHub Pages workflow, package install, API token, or repository secret is needed. The site is plain static files and has no compilation step.

1. In Cloudflare, open **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize GitHub if prompted and select `azimul-kabir/harmony-website`.
3. Set the production branch to `main`, framework preset to **None**, the build command to `exit 0`, and the build output directory to `.`. `exit 0` is a successful no-op; Cloudflare serves the existing `index.html` and other static files directly.
4. After the first successful deployment, open the Pages project **Custom domains** settings and add `harmony.azimulkabir.com`. Cloudflare will guide you through the DNS record and certificate setup.

Cloudflare Pages supports private GitHub repositories and automatically deploys new commits to `main`; other branches can be used as previews. The site is static HTML, CSS, and JavaScript, so there is no separate build step. Do not point the hostname at `azimul-kabir.github.io`: this repository is private and the account plan does not include GitHub Pages hosting.
