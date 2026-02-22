# Product Requirements Document: modern-json-react

## 1. Overview

**Product Name:** `modern-json-react`
**Type:** Open-source npm package (React component library)
**Target:** Web applications needing structured JSON input/output with configurable complexity

### Vision
A production-grade, fully-featured JSON editor React component that fills the gaps left by existing solutions — combining tree + code editing, JSON Schema validation, accessibility-first design, large-file performance, and a developer-friendly API — all in a single, zero-config package.

### Problem Statement
Existing JSON editor React components suffer from: abandoned maintenance (react-json-editor-ajrm), poor accessibility, no JSON Schema integration in tree views, limited large-file support, difficult testing in Jest/Vitest, and fragmented feature sets requiring multiple libraries. Developers need a single, well-maintained component that handles the full spectrum from simple config editing to complex schema-driven data entry.

---

## 2. Target Users

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **App Developer** | Integrates the editor into React apps | Simple API, TypeScript types, small bundle, easy testing |
| **Admin/Ops User** | Edits JSON configs in dashboards | Tree view, validation feedback, undo/redo, search |
| **API Developer** | Inspects/edits API payloads | Code view, formatting, syntax highlighting, diff |
| **Data Engineer** | Works with large JSON datasets | Performance with 10MB+ files, virtualization, filtering |

---

## 3. Core Features (MVP — v1.0)

### 3.1 Dual Editing Modes
- **Code Mode:** Syntax-highlighted text editor with line numbers, bracket matching, auto-indent, and folding.
- **Tree Mode:** Collapsible tree view with inline editing of keys, values, and types. Drag-drop reordering of object keys and array items.
- **Seamless toggle** between modes preserving cursor position and scroll state.

### 3.2 JSON Validation Engine
- **Syntax validation:** Real-time parse error detection with line/column markers and human-readable messages.
- **JSON Schema validation (Draft-07, 2019-09, 2020-12):** Schema-aware error markers, autocomplete suggestions for enum values, and required-field indicators.
- **Custom validators:** Plugin API for user-defined validation rules (e.g., "no duplicate IDs in array").
- **Validation modes:** `onChange` (debounced, default 300ms), `onBlur`, `onSubmit`, or `manual`.

### 3.3 Search & Filter
- Full-text search across keys and values with match highlighting.
- JSONPath / dot-notation filter (e.g., `$.store.book[*].author`).
- Regex search toggle.

### 3.4 Undo / Redo
- Full history stack with configurable depth (default 100).
- Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z).
- Time-based action grouping (typing grouped into words).

### 3.5 Clipboard Support
- Copy/paste JSON nodes in tree mode.
- Copy path (dot notation or JSONPath).
- Paste external JSON with auto-format.

### 3.6 Formatting & Transformation
- Pretty-print / compact toggle.
- Configurable indentation (2/4 spaces, tabs).
- Sort keys (ascending/descending/custom comparator).
- Minify output.

### 3.7 Theming
- Built-in light and dark themes.
- CSS custom properties API for full customization.
- Follows `prefers-color-scheme` by default.

---

## 4. Advanced Features (v1.x)

### 4.1 Performance
- Virtual scrolling for documents > 1,000 nodes (react-window integration).
- Web Worker parsing for files > 1MB.
- Lazy rendering of collapsed tree branches.
- Target: smooth editing of 10MB files, viewable up to 50MB.

### 4.2 Extended Format Support
- JSON5 parsing/editing (comments, trailing commas, unquoted keys).
- JSONC support (comments preserved during round-trip edits).
- Toggle between strict JSON and extended modes.

### 4.3 Diff View
- Side-by-side comparison of two JSON documents.
- Inline diff highlighting (additions, deletions, modifications).
- Navigate between changes.

### 4.4 Schema-Driven Editing
- Auto-generate tree structure from JSON Schema.
- Inline type hints and descriptions from schema.
- "Add property" dropdown populated from schema `properties`.
- Enum value dropdowns.

---

## 5. Non-Functional Requirements

### 5.1 Accessibility (WCAG 2.1 AA)
- Full keyboard navigation in both modes.
- ARIA roles/labels for tree nodes, editor regions, and status messages.
- Screen reader announcements for validation errors and state changes.
- Minimum 4.5:1 color contrast for all text.
- Focus-visible indicators on all interactive elements.

### 5.2 Performance Targets
| Metric | Target |
|--------|--------|
| Initial render (empty editor) | < 50ms |
| Parse + render 1MB JSON | < 500ms |
| Keystroke latency | < 16ms (60fps) |
| Bundle size (gzipped) | < 45KB core, < 80KB with all features |
| Tree-shaking | Unused features excluded |

### 5.3 Browser Support
- Chrome/Edge 90+, Firefox 90+, Safari 15+
- React 18+ (concurrent features supported)
- React 19 compatible

### 5.4 Developer Experience
- Full TypeScript types with JSDoc comments.
- Storybook documentation with interactive examples.
- Jest/Vitest test utilities (`renderJsonEditor`, `getValidationErrors`).
- Zero peer dependencies beyond React and ReactDOM.

---

## 6. API Design (Public Interface)

```tsx
import { JsonEditor } from 'modern-json-react';

<JsonEditor
  // Data
  value={object | string}
  onChange={(value: unknown, rawText: string) => void}

  // Mode
  mode={"code" | "tree" | "split"}
  onModeChange={(mode: string) => void}

  // Validation
  schema={JSONSchema}
  validators={CustomValidator[]}
  validationMode={"onChange" | "onBlur" | "onSubmit" | "manual"}
  onValidate={(errors: ValidationError[]) => void}

  // Appearance
  theme={"light" | "dark" | "auto" | ThemeConfig}
  height={string | number}

  // Features
  readOnly={boolean}
  searchable={boolean}
  sortable={boolean}
  indentation={2 | 4 | "tab"}

  // Performance
  maxSize={number}  // bytes, shows warning above this
  virtualize={boolean | "auto"}

  // Callbacks
  onError={(error: Error) => void}
  onFocus={() => void}
  onBlur={() => void}
/>
```

---

## 7. Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| npm weekly downloads | > 5,000 |
| GitHub stars | > 500 |
| Bundle size vs. competitors | ≤ 50% of jsoneditor |
| Accessibility audit score | 100% WCAG 2.1 AA |
| Test coverage | > 90% |

---

## 8. Out of Scope (v1.0)

- Server-side rendering (SSR) of editor content (shell only).
- Collaborative real-time editing (CRDT/OT).
- Non-JSON formats (YAML, TOML, XML).
- Mobile-optimized touch editing (basic touch works, no gestures).
- Built-in file upload/download UI (provide hooks instead).
