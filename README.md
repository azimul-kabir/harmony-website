# Harmony developer website

The responsive developer and getting-started website for [Harmony](https://github.com/azimul-kabir/harmony), published at `https://harmony.azimulkabir.com/`.

## Preview locally

Serve this directory with a static file server, then open the served address in a browser. For example:

```bash
python -m http.server 8080
```

The site is plain HTML, CSS, and JavaScript with no build step or server-side secrets. Its concise homepage links to separate Features, Get started, FAQ, and Developers pages. Those pages fetch Harmony's default branch and readme, user guide, release notes, developer docs, logo, hero artwork, and screenshots from GitHub when opened. Project facts and imagery are not duplicated here, so updates to Harmony's default branch appear automatically. If a live source cannot be reached, the affected section reports the problem and links to the upstream documentation.

The FAQ is assembled from current guide and release-note sections. The installation walkthrough, feature summaries, technology stack, and developer-resource links likewise render current material from the source repository.

## Custom domain and deployment

`CNAME` and the GitHub Pages Actions workflow publish the static website at `harmony.azimulkabir.com` after changes reach this repository's `main` branch. Point the subdomain's DNS CNAME at the GitHub Pages hostname for this repository (`azimul-kabir.github.io`) and enable GitHub Pages with **GitHub Actions** as its build and deployment source. GitHub Pages provisions HTTPS after DNS has propagated.
