# Probability Lab

An interactive, pure front-end teaching tool for probability and statistics.
Drag sliders to see how distribution parameters shape the PDF/PMF and CDF, and
watch the Central Limit Theorem emerge through animated sampling.

**Live demo:** _add your GitHub Pages URL here after deploying (see below)_

## What's inside

### I. Distribution Lab

Explore six distributions — **Normal, Binomial, Poisson, Exponential, Beta,
Gamma** — with live parameter sliders. The density/mass chart, the CDF chart,
and the moment tiles (mean, variance, standard deviation, each with its
closed-form formula) all update as you drag.

![Distribution Lab](docs/distribution-lab.png)

### II. CLT Simulator

Pick any of the six distributions as the population (including strongly skewed
ones like the Exponential), choose the sample size *n* and the number of
samples, and run an animated simulation. Each sample averages *n* fresh draws;
the histogram of those sample means builds up in real time, with the
theoretical Normal curve N(μ, σ²/n) overlaid for comparison. Stat tiles show
the population moments, the CLT prediction for X̄, and the observed mean/sd of
the simulated sample means side by side.

![CLT Simulator](docs/clt-simulator.png)

Tips:

- Set the population to Exponential with n = 1 to see the raw skewed shape,
  then slide n upward and watch the bell curve take over.
- `#clt` in the URL deep-links to the simulator; adding `?autorun` starts a
  run on page load (handy for sharing).

## Running locally

```bash
npm install
npm run dev      # start the dev server
npm test         # run the math sanity tests
npm run build    # production build into dist/
```

## Deploying to GitHub Pages

The repo ships with a ready-to-use workflow (`.github/workflows/deploy.yml`)
that tests, builds, and publishes on every push to `main`.

1. Create an empty GitHub repository (any name — the build uses relative
   paths, so no base-path configuration is needed).
2. Push this project:

   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

3. In the repository settings, go to **Settings → Pages** and set
   **Source: GitHub Actions**.
4. Wait for the workflow to finish (Actions tab). Your site is live at
   `https://<you>.github.io/<repo>/`.

Every later push to `main` redeploys automatically. Zero servers, zero cost.

## How the math works

No statistics library is used — all distribution math lives in `src/lib/` and
is implemented from scratch:

| Piece | Method |
|---|---|
| `log Γ(x)` | Lanczos approximation |
| Regularized incomplete gamma `P(a, x)` | series + continued fraction (Numerical Recipes) |
| Regularized incomplete beta `I_x(a, b)` | Lentz's continued fraction |
| Normal CDF / erf | via `P(1/2, x²)` |
| Binomial CDF | `I₁₋ₚ(n−k, k+1)` |
| Poisson CDF | `1 − P(k+1, λ)` |
| Normal sampling | Box–Muller |
| Gamma sampling | Marsaglia–Tsang (with the `U^{1/a}` boost for shape < 1) |
| Poisson sampling | Knuth's product method |
| Binomial / Beta / Exponential sampling | Bernoulli sum / gamma ratio / inverse transform |

### Verified, not just implemented

`npm test` runs 35 sanity tests (Vitest) over the math core:

- **Hand-checked point values** — pdf/cdf values verified against textbook
  numbers (e.g. Φ(1.96) ≈ 0.975, Binomial(5, 0.3) pmf at k = 2 = 0.3087).
- **Self-consistency** — for every distribution, the density integrates/sums
  to ≈ 1 over the plotted range, its numeric moments match the closed-form
  mean/variance formulas, and the CDF matches the integrated density. This
  catches parameterization mistakes (rate vs. scale) by construction.
- **Sampler checks** — 40,000 seeded draws per distribution must reproduce the
  theoretical mean and variance within tight tolerances, so the CLT simulator
  is fed by verified samplers.

## Tech stack

- **React 19 + Vite** — SPA, no backend
- **Recharts** — charts
- **Tailwind CSS v4** — styling
- **Vitest** — math sanity tests
- Typography: Fraunces + IBM Plex Sans/Mono

## Project structure

```
src/
  lib/
    special.js          # logGamma, incomplete gamma/beta, erf
    distributions.js    # the six distributions: pdf/pmf, cdf, moments, samplers, ranges
    random.js           # seedable PRNG (mulberry32), Box–Muller, Marsaglia–Tsang
    format.js           # number formatting, nice axis ticks
    *.test.js           # sanity tests
  components/
    DistributionLab.jsx # section I
    CLTSimulator.jsx    # section II
    ...                 # chart cards, sliders, tiles, shared chart theme
```
