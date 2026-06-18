# EarthPrint Testing Strategy

This document details the test framework, test scopes, coverage requirements, and commands to run quality checks across the monorepo workspaces.

---

## 1. Test Architecture

We employ a unified, multi-layered testing strategy combining unit and integration tests using **Jest** and **React Testing Library**:

1. **Unit Tests (Domain Logics):**
   * Target: `packages/emission-engine`
   * Scopes: Verifies emission calculation math formulas, location grid intensities fallback, second-hand purchase multipliers, and aviation RFI.
   * Scopes: Gamification calculations (Bloom points gains, Terra Score decay, badge award triggers).
2. **Integration Tests (Component UI):**
   * Target: `web/` Next.js application
   * Scopes: Test component render stability, path changes, and user navigation (e.g. `Navbar.tsx`, `MobileNav.tsx`).

---

## 2. Running Test Suites

Commands must run through the Turborepo execution pipeline.

### 2.1 Run All Tests
Runs tests across all workspaces concurrently:
```bash
npx turbo run test --env-mode=loose
```

### 2.2 Run Specific Package Tests
Run tests only for the emission engine:
```bash
npm run test --prefix=packages/emission-engine
```
Run tests only for the web client:
```bash
npm run test --prefix=web
```

---

## 3. Coverage Thresholds Gate

To ensure reliability, Jest is configured in both the `web` application and the `emission-engine` package to collect coverage reports and enforce strict minimum gates:

* **Web Application Coverage Thresholds:**
  * Branches: **70%**
  * Functions: **75%**
  * Lines: **80%**
  * Statements: **80%**
* **Emission Engine Coverage Thresholds:**
  * Branches: **75%**
  * Functions: **80%**
  * Lines: **85%**
  * Statements: **85%**

If any PR or commit falls below these gates, the local pre-commit hook and the GitHub Actions quality gate (`ci.yml`) will fail the build, preventing faulty code from reaching production.
