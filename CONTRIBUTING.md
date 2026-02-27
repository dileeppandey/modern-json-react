# Contributing to modern-json-react

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/modern-json-react.git
cd modern-json-react
```

2. Install dependencies:

```bash
npm install
```

3. Verify everything works:

```bash
npm run typecheck
npm test
npm run build
```

## Development Workflow

Start the demo server for local development:

```bash
npm run dev
```

Run tests in watch mode while developing:

```bash
npm run test:watch
```

### Available Scripts

- `npm run dev` — Start the demo dev server
- `npm run build` — Build the package (CJS + ESM + types)
- `npm test` — Run all tests once
- `npm run test:watch` — Run tests in watch mode
- `npm run test:coverage` — Run tests with coverage report
- `npm run typecheck` — Type check with TypeScript
- `npm run lint` — Lint source files
- `npm run format` — Format source files with Prettier

## Project Structure

```
src/
├── core/           # Pure logic: parser, validator, formatter, path utilities
├── hooks/          # React hooks: useUndoRedo, useJsonParser, useSearch
├── components/     # UI components: CodeEditor, TreeEditor, Toolbar, StatusBar
├── themes/         # Theme definitions and types
├── types/          # TypeScript type definitions
├── JsonEditor.tsx  # Root component
└── index.ts        # Public API exports
tests/
├── unit/           # Unit tests for core modules
└── component/      # Component tests with React Testing Library
demo/
└── index.html      # Standalone demo page
```

## Making Changes

### Branching

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names like `feature/drag-drop-reorder`, `fix/validation-error-display`, or `docs/api-examples`.

### Code Style

- Write TypeScript with strict mode enabled
- Use functional React components with hooks
- Keep core logic (in `src/core/`) free of React dependencies
- Use CSS custom properties for any new style tokens
- Follow existing naming conventions in the codebase

### Testing

All changes should include tests. Place them in the appropriate directory:

- **Core logic** (`src/core/`) — Add unit tests in `tests/unit/`
- **React components** — Add component tests in `tests/component/`
- **Hooks** — Test through component tests or dedicated hook tests

Run the full test suite before submitting:

```bash
npm run typecheck
npm test
```

### Accessibility

This project follows WCAG 2.1 AA guidelines. When adding or modifying UI:

- Ensure proper ARIA roles and labels
- Support keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Maintain visible focus indicators
- Test with a screen reader if possible

## Submitting a Pull Request

1. Ensure all checks pass locally (`typecheck`, `test`, `build`)
2. Write a clear PR title and description explaining what changed and why
3. Reference any related issues (e.g., "Fixes #42")
4. Keep PRs focused — one feature or fix per PR

### PR Checklist

- [ ] Tests added or updated
- [ ] TypeScript types are correct (`npm run typecheck` passes)
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Accessibility considered for UI changes
- [ ] Documentation updated if API changed

## Reporting Issues

When filing an issue, please include:

- A clear description of the problem or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Browser and React version
- A minimal code example if possible

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x) — Bug fixes, no API changes
- **Minor** (1.x.0) — New features, backward compatible
- **Major** (x.0.0) — Breaking API changes

Releases are automated via GitHub Actions. When a GitHub Release is created with a semver tag (e.g., `v1.2.0`), the package is automatically published to both npm and JSR.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
