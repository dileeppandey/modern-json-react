# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-27

### Fixed

- **Critical:** Corrected `package.json` export paths — `main`/`module`/`exports` now correctly reference `dist/index.js` and `dist/index.mjs` (previous entries pointed to non-existent `index.cjs.js`/`index.esm.js` and would fail to resolve)
- Fixed React `act()` warning in validation test by replacing raw `setTimeout` with `waitFor`

### Added

- `src/styles.css` — standalone CSS file now included in the `dist/` bundle via `tsup` post-build step; importable as `modern-json-react/styles.css`
- `useContainerWidth` hook exported from the public API
- `SearchBar` component for full-text search across keys and values with match highlighting
- Split mode screenshots (`split-mode-light.png`, `split-mode-dark.png`, `tree-mode-dark.png`) added to documentation
- GitHub Actions CI workflow (Node 18/20/22 matrix), npm publish workflow (triggered on GitHub Release), and JSR publish workflow
- Developer tooling: ESLint + TypeScript + React Hooks plugins, Prettier, Husky pre-commit hooks, lint-staged, commitlint, EditorConfig
- `CONTRIBUTING.md` with developer guidelines
- `tsconfig.test.json` for correct IDE type resolution in test files

### Changed

- Added `bugs` and `homepage` fields to `package.json`
- Updated `repository.url` with the correct GitHub URL
- `TreeNode` significantly refactored for improved interaction and accessibility
- `CodeEditor` and `TreeEditor` improvements
- Demo (`demo/index.html`) refreshed
- Screenshots updated to PNG format (previously SVG)

## [1.0.1] - 2026-02-14

### Fixed

- Version bump and minor fixes after initial release

## [1.0.0] - 2026-02-14

### Added

- Initial release
- Dual editing modes: code (syntax-highlighted), tree (collapsible), and split
- JSON Schema validation (Draft-07, 2019-09, 2020-12) with real-time error markers
- Tree view with inline editing, type changing, key renaming, drag-drop reordering, and node deletion
- Undo / Redo with full history stack and keyboard shortcuts
- Full-text search with regex support and match highlighting
- Light and dark themes with 22 CSS custom properties for full customization
- Formatting: pretty-print, minify, sort keys
- WCAG 2.1 AA accessibility with full keyboard navigation and ARIA roles
- Complete TypeScript definitions with JSDoc comments
- Zero peer dependencies beyond React 18+
