# UX Design Specification: modern-json-react

## 1. Layout Architecture

### 1.1 Component Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  JsonEditor (root container)                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │  Toolbar                                        │ │
│ │  [Code] [Tree] [Split] │ Search… │ ⟲ ⟳ │ ⚙    │ │
│ ├─────────────────────────────────────────────────┤ │
│ │                                                 │ │
│ │  Editor Area                                    │ │
│ │  ┌─────────────────┬───────────────────────┐    │ │
│ │  │   Code View     │   Tree View           │    │ │
│ │  │   (or full)     │   (or full)           │    │ │
│ │  │                 │                       │    │ │
│ │  │  1│ {           │  ▼ root {}            │    │ │
│ │  │  2│   "name":   │    ├─ name: "Jo…"     │    │ │
│ │  │  3│     "John", │    ├─ age: 30         │    │ │
│ │  │  4│   "age": 30 │    └─ tags: [...]     │    │ │
│ │  │  5│ }           │                       │    │ │
│ │  │                 │                       │    │ │
│ │  └─────────────────┴───────────────────────┘    │ │
│ ├─────────────────────────────────────────────────┤ │
│ │  Status Bar                                     │ │
│ │  ✓ Valid JSON  │  Ln 3, Col 12  │  5 properties │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 1.2 Responsive Behavior

| Viewport | Layout |
|----------|--------|
| ≥ 1024px | Split mode shows side-by-side panels |
| 768–1023px | Split mode stacks vertically |
| < 768px | Single mode only, toolbar collapses to icon menu |

---

## 2. Mode Specifications

### 2.1 Code Mode

**Primary interaction:** Text editing with syntax intelligence.

```
┌──────────────────────────────────────────┐
│ ┌──┬─────────────────────────────────┐   │
│ │1 │ {                               │   │
│ │2 │   "name": "John Doe",           │   │
│ │3 │   "age": 30,                    │   │
│ │4 │   "email": "john@example.com",  │   │
│ │5▸│   "address": {                  │   │ ← fold indicator
│ │  │     ...                         │   │ ← collapsed
│ │9 │   },                            │   │
│ │10│   "tags": ["dev", "react"]      │   │
│ │11│ }                               │   │
│ └──┴─────────────────────────────────┘   │
│  ↕ minimap (optional, for large docs)    │
└──────────────────────────────────────────┘
```

**Features:**
- Line numbers (toggleable)
- Syntax highlighting: keys (blue), strings (green), numbers (orange), booleans (purple), null (gray)
- Bracket matching with highlight
- Code folding at object/array boundaries
- Error underlines (red wavy) with hover tooltip
- Schema warning underlines (yellow wavy)
- Auto-indent on Enter
- Auto-close brackets/quotes
- Multi-cursor support (Ctrl/Cmd+D)

**Keyboard Shortcuts:**

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + F | Open search |
| Ctrl/Cmd + Shift + F | Open search & replace |
| Ctrl/Cmd + D | Select next occurrence |
| Ctrl/Cmd + / | Toggle comment (JSONC/JSON5 mode) |
| Alt + Up/Down | Move line up/down |
| Ctrl/Cmd + Shift + K | Delete line |
| Ctrl/Cmd + [ or ] | Indent / outdent |
| Ctrl/Cmd + Shift + P | Format document |

### 2.2 Tree Mode

**Primary interaction:** Visual navigation and inline editing.

```
┌──────────────────────────────────────────────────────┐
│  Filter: [____________]  [+ Add] [▼ Expand All]      │
│ ─────────────────────────────────────────────────────│
│                                                      │
│  ▼ {} root                              3 properties │
│  │                                                   │
│  ├── "name"    : ┌──────────┐  str      [⋯] [✕]     │
│  │               │ John Doe │                        │
│  │               └──────────┘                        │
│  ├── "age"     :  30           num      [⋯] [✕]     │
│  │                                                   │
│  ▶ "address"  : {...}          obj (4)  [⋯] [✕]     │
│  │                                                   │
│  ▼ "tags"     : [...]          arr (2)  [⋯] [✕]     │
│  │  ├── 0 : "developer"       str      [⋯] [✕]     │
│  │  └── 1 : "react"           str      [⋯] [✕]     │
│  │                                                   │
│  + Add property                                      │
└──────────────────────────────────────────────────────┘

Legend:
  ▼ = expanded    ▶ = collapsed
  [⋯] = context menu (copy, cut, paste, duplicate, move)
  [✕] = delete
  str/num/obj/arr = type badge (clickable to change type)
```

**Tree Node Interactions:**

| Action | Trigger |
|--------|---------|
| Expand/collapse | Click arrow, or Right/Left arrow key |
| Edit value | Double-click value, or Enter key |
| Edit key | Double-click key |
| Change type | Click type badge → dropdown |
| Delete node | Click ✕, or Delete key |
| Add child | Click "+ Add" below node |
| Reorder | Drag handle (⠿) on left edge |
| Context menu | Right-click or click [⋯] |

**Type Change Dropdown:**
```
┌────────────────┐
│ ○ String       │
│ ● Number       │  ← current type highlighted
│ ○ Boolean      │
│ ○ Null         │
│ ○ Object {}    │
│ ○ Array []     │
└────────────────┘
```

**Context Menu:**
```
┌──────────────────────────┐
│  Copy value              │
│  Copy path               │
│  Copy node (JSON)        │
│  ─────────────────────── │
│  Cut                     │
│  Paste                   │
│  Duplicate               │
│  ─────────────────────── │
│  Insert before           │
│  Insert after            │
│  ─────────────────────── │
│  Expand all children     │
│  Collapse all children   │
└──────────────────────────┘
```

### 2.3 Split Mode

```
┌────────────────────────┬────────────────────────┐
│     Code View          │      Tree View         │
│                        │                        │
│  Edits sync in         │  Edits sync in         │
│  real-time (debounced) │  real-time             │
│                        │                        │
│  Clicking a tree node  │  Clicking in code      │
│  scrolls code view     │  highlights tree node  │
│  to that position      │  for that path         │
│                        │                        │
└────────────────────────┴────────────────────────┘
         ↕ draggable divider (resize panels)
```

---

## 3. Toolbar Design

```
┌───────────────────────────────────────────────────────────────┐
│ [Code ▾] [Tree] [Split]  │  🔍 [Search…________] │ ↶ ↷ │ ⚙ │
└───────────────────────────────────────────────────────────────┘
   Mode selector              Search bar          Undo  Settings
   (segmented control)        (Ctrl+F expands)    Redo  menu
```

**Settings Menu (⚙):**
```
┌────────────────────────────────┐
│  Indent: [2 spaces ▾]         │
│  Theme:  [Auto ▾]             │
│  ☑ Line numbers               │
│  ☑ Bracket matching           │
│  ☑ Auto-format on paste       │
│  ☐ Word wrap                  │
│  ─────────────────────────    │
│  Format document   Ctrl+Shift+P│
│  Minify                       │
│  Sort keys                    │
└────────────────────────────────┘
```

---

## 4. Validation UX

### 4.1 Error States

**Syntax Error (Code Mode):**
```
  4│   "age": 30,
  5│   "email": "john@example.com"   ← missing comma
  6│   "address": {
       ~~~~~~~~~
       ⚠ Expected ',' or '}' after property value
```

**Schema Error (Tree Mode):**
```
  ├── "age"  :  -5          num    ⚠ [⋯] [✕]
  │              ↓
  │   ┌──────────────────────────────────┐
  │   │ ⚠ Schema: minimum value is 0    │
  │   │   Path: $.age                    │
  │   │   Schema rule: { minimum: 0 }   │
  │   └──────────────────────────────────┘
```

### 4.2 Status Bar States

```
Valid:    ✓ Valid JSON  │  Ln 3, Col 12  │  12 properties, 3 arrays
Warning:  ⚠ 2 schema warnings  │  Ln 3, Col 12  │  12 properties
Error:    ✕ Invalid JSON (line 5)  │  Ln 5, Col 22
Loading:  ⟳ Parsing… (2.3 MB)
```

### 4.3 Error Panel (expandable from status bar)

```
┌──────────────────────────────────────────────────────┐
│  Errors (3)  │  Warnings (1)                         │
│ ─────────────────────────────────────────────────────│
│  ✕ Line 5:22  Expected ',' or '}' after value       │
│  ✕ Line 8:1   Unexpected end of input               │
│  ✕ Line 12:15 Duplicate key "name"                  │
│  ⚠ $.age      Value -5 is less than minimum (0)     │
└──────────────────────────────────────────────────────┘
  Click any error → jumps to location in editor
```

---

## 5. Search UX

### 5.1 Search Bar (expanded)

```
┌─────────────────────────────────────────────────────┐
│  🔍 [search term________] [.*] [Aa] [""│{}]  3/17  │
│     [replace with_______] [Replace] [Replace All]   │
└─────────────────────────────────────────────────────┘
     toggles:   Regex  Case   Keys/Values   match count
```

### 5.2 Search Highlight Behavior
- All matches highlighted in yellow
- Current match highlighted in orange
- Up/Down arrows or Enter/Shift+Enter to navigate
- In tree mode: non-matching nodes dimmed, matching nodes and their ancestors visible

---

## 6. Theming

### 6.1 Color Tokens (CSS Custom Properties)

```css
--json-editor-bg:               /* editor background */
--json-editor-fg:               /* default text */
--json-editor-border:           /* borders and dividers */
--json-editor-gutter-bg:        /* line number gutter */
--json-editor-gutter-fg:        /* line numbers */
--json-editor-selection:        /* selected text bg */
--json-editor-cursor:           /* cursor color */

/* Syntax colors */
--json-editor-key:              /* object keys */
--json-editor-string:           /* string values */
--json-editor-number:           /* number values */
--json-editor-boolean:          /* true/false */
--json-editor-null:             /* null */
--json-editor-bracket:          /* {}[] */
--json-editor-bracket-match:    /* matching bracket bg */

/* Validation colors */
--json-editor-error:            /* error underline/icon */
--json-editor-warning:          /* warning underline/icon */
--json-editor-success:          /* valid indicator */

/* Tree mode */
--json-editor-tree-line:        /* connector lines */
--json-editor-tree-hover:       /* hovered node bg */
--json-editor-tree-selected:    /* selected node bg */
--json-editor-type-badge-bg:    /* type badge background */
```

### 6.2 Theme Presets

**Light (default):**
- Background: #ffffff, Text: #1e1e1e
- Keys: #0451a5, Strings: #0a7e07, Numbers: #098658

**Dark:**
- Background: #1e1e1e, Text: #d4d4d4
- Keys: #9cdcfe, Strings: #ce9178, Numbers: #b5cea8

---

## 7. Accessibility Specification

### 7.1 ARIA Structure

```html
<div role="application" aria-label="JSON Editor">

  <!-- Toolbar -->
  <div role="toolbar" aria-label="Editor controls">
    <div role="tablist" aria-label="Editor mode">
      <button role="tab" aria-selected="true">Code</button>
      <button role="tab" aria-selected="false">Tree</button>
    </div>
  </div>

  <!-- Code editor -->
  <div role="textbox" aria-multiline="true"
       aria-label="JSON code editor"
       aria-describedby="validation-status">
  </div>

  <!-- Tree editor -->
  <div role="tree" aria-label="JSON tree editor">
    <div role="treeitem" aria-expanded="true" aria-level="1">
      root
      <div role="group">
        <div role="treeitem" aria-level="2">name: "John"</div>
      </div>
    </div>
  </div>

  <!-- Status bar -->
  <div role="status" aria-live="polite" id="validation-status">
    Valid JSON — 12 properties
  </div>
</div>
```

### 7.2 Keyboard Navigation Map

| Context | Key | Action |
|---------|-----|--------|
| **Global** | Ctrl+1 | Switch to Code mode |
| | Ctrl+2 | Switch to Tree mode |
| | Ctrl+3 | Switch to Split mode |
| | Escape | Close search/dialog/menu |
| **Tree** | ↑/↓ | Navigate nodes |
| | →  | Expand or move to first child |
| | ←  | Collapse or move to parent |
| | Enter | Edit selected node value |
| | F2 | Rename key |
| | Delete | Delete node (with confirmation) |
| | Ctrl+C | Copy node |
| | Ctrl+V | Paste node |
| | Home/End | First/last visible node |
| **Code** | Standard text editor shortcuts (see 2.1) |

### 7.3 Screen Reader Announcements

| Event | Announcement |
|-------|-------------|
| Mode switch | "Switched to Tree mode" |
| Node expand | "Expanded address, 4 children" |
| Node collapse | "Collapsed address" |
| Validation pass | "JSON is valid" |
| Validation error | "3 errors found. First error at line 5" |
| Search match | "Match 3 of 17" |
| Undo | "Undone: changed age from 30 to 25" |

---

## 8. Component Architecture

```
modern-json-react/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── JsonEditor.tsx              # Root orchestrator
│   ├── components/
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.tsx         # Mode switcher, search, actions
│   │   │   ├── SearchBar.tsx
│   │   │   └── SettingsMenu.tsx
│   │   ├── CodeEditor/
│   │   │   ├── CodeEditor.tsx      # Syntax-highlighted text editor
│   │   │   ├── SyntaxHighlighter.tsx
│   │   │   ├── LineNumbers.tsx
│   │   │   └── ErrorMarkers.tsx
│   │   ├── TreeEditor/
│   │   │   ├── TreeEditor.tsx      # Tree view orchestrator
│   │   │   ├── TreeNode.tsx        # Recursive node renderer
│   │   │   ├── NodeValue.tsx       # Inline value editor
│   │   │   ├── TypeBadge.tsx       # Type indicator + changer
│   │   │   └── DragHandle.tsx
│   │   ├── StatusBar/
│   │   │   ├── StatusBar.tsx
│   │   │   └── ErrorPanel.tsx
│   │   └── shared/
│   │       ├── ContextMenu.tsx
│   │       └── Tooltip.tsx
│   ├── hooks/
│   │   ├── useJsonParser.ts        # Parse + validate JSON
│   │   ├── useUndoRedo.ts          # History management
│   │   ├── useSearch.ts            # Search state + matching
│   │   ├── useSchema.ts            # JSON Schema validation
│   │   ├── useKeyboard.ts          # Shortcut management
│   │   └── useVirtualization.ts    # Virtual scrolling
│   ├── core/
│   │   ├── parser.ts               # JSON / JSON5 / JSONC parser
│   │   ├── validator.ts            # Validation engine
│   │   ├── formatter.ts            # Pretty-print / minify
│   │   ├── differ.ts               # JSON diff algorithm
│   │   └── path.ts                 # JSONPath utilities
│   ├── themes/
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── types.ts
│   └── types/
│       ├── editor.ts               # Editor prop types
│       ├── tree.ts                 # Tree node types
│       └── validation.ts           # Error/warning types
├── tests/
│   ├── unit/                       # Core logic tests
│   ├── component/                  # React component tests
│   ├── integration/                # Full editor tests
│   └── a11y/                       # Accessibility tests
└── demo/                           # Storybook / demo app
```

---

## 9. Interaction Flows

### 9.1 Paste Invalid JSON
```
User pastes text → Parser runs → Error detected
  → Code mode: red underline at error location + status bar turns red
  → Tree mode: shows last valid tree + banner "Parse error at line X — showing last valid state"
  → Error panel auto-expands with clickable error
```

### 9.2 Schema Validation on Edit
```
User changes value → Debounce 300ms → Schema validator runs
  → Pass: green check in status bar
  → Fail: yellow underline on violating node
         → Hover shows schema rule + expected value
         → Tree mode: warning icon on node
         → Error panel lists all violations with paths
```

### 9.3 Large File Loading
```
User sets value (> 1MB) → Show loading spinner + "Parsing..."
  → Web Worker parses in background
  → Progress bar in status bar
  → Tree mode: lazy-render only root + first 2 levels
  → Code mode: virtualized scrolling
  → Status bar shows "2.3 MB — 15,432 nodes"
```
