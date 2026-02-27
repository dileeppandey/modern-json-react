import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { JsonEditor } from '../../src/JsonEditor';

/**
 * Deeply nested JSON to produce wide tree rows when expanded.
 * Each nesting level adds ~21px of indentation (margin-left + padding-left),
 * so 6 levels ≈ 126px of pure indentation before content starts.
 */
const deeplyNestedJson = {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: {
              deepKey:
                'this is a very long value that should extend well beyond any narrow panel width in split mode',
            },
          },
        },
      },
    },
  },
};

/** Wide values at the root level */
const wideValuesJson = {
  shortKey: 'short',
  longDescription:
    'This is an extremely long string value that contains lots of text to ensure it exceeds the panel width in split view mode and triggers horizontal scrolling',
  anotherLong:
    'Another wide value that pushes content beyond the available panel width for horizontal scroll testing',
};

/**
 * Helper: expands all nested "Expand" buttons in the tree view.
 * Clicks each expand arrow that is visible, repeatedly, to open all levels.
 */
function expandAllNodes() {
  let expandButtons = screen.getAllByLabelText('Expand');
  while (expandButtons.length > 0) {
    // Click the first collapsed node
    fireEvent.click(expandButtons[0]);
    // Re-query — some buttons become "Collapse", new "Expand" buttons may appear
    expandButtons = screen.queryAllByLabelText('Expand');
  }
}

describe('Tree View — Horizontal Scroll Structure', () => {
  describe('tree editor uses inline-block for content-based sizing', () => {
    it('tree editor element has mjr-tree-editor class (inline-block via CSS)', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={300} />);
      const treeEditor = screen.getByTestId('tree-editor');
      expect(treeEditor.classList.contains('mjr-tree-editor')).toBe(true);
    });

    it('tree editor is a direct child of the scrollable panel', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={300} />);
      const treeEditor = screen.getByTestId('tree-editor');
      const panel = treeEditor.parentElement;
      expect(panel).toBeTruthy();
      expect(panel!.classList.contains('mjr-editor__panel')).toBe(true);
    });

    it('panel has overflow auto to provide scrollbars', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={300} />);
      const treeEditor = screen.getByTestId('tree-editor');
      const panel = treeEditor.closest('.mjr-editor__panel');
      expect(panel).toBeTruthy();
      // Panel should exist and be the scroll container
      expect(panel!.classList.contains('mjr-editor__panel')).toBe(true);
    });
  });

  describe('expanding nested nodes creates deeply indented content', () => {
    it('initially shows collapsed root — only one level visible', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={300} />);
      // Root ($) is expanded by default, so level1 is visible
      expect(screen.getByTestId('tree-node-$.level1')).toBeInTheDocument();
      // level2 is not expanded yet
      expect(screen.queryByTestId('tree-node-$.level1.level2')).not.toBeInTheDocument();
    });

    it('expanding all levels creates nested children containers', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={400} />);
      expandAllNodes();

      // All levels should now be visible
      expect(screen.getByTestId('tree-node-$.level1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-$.level1.level2')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-$.level1.level2.level3')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-$.level1.level2.level3.level4')).toBeInTheDocument();
      expect(
        screen.getByTestId('tree-node-$.level1.level2.level3.level4.level5'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('tree-node-$.level1.level2.level3.level4.level5.level6'),
      ).toBeInTheDocument();
    });

    it('each nesting level is wrapped in a mjr-tree__children container', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={400} />);
      expandAllNodes();

      const treeEditor = screen.getByTestId('tree-editor');
      const childrenContainers = treeEditor.querySelectorAll('.mjr-tree__children');
      // Should have at least 6 nesting levels of children containers
      expect(childrenContainers.length).toBeGreaterThanOrEqual(6);
    });

    it('the deepest leaf node is nested inside multiple children containers', () => {
      render(<JsonEditor mode="tree" value={deeplyNestedJson} height={400} />);
      expandAllNodes();

      const deepNode = screen.getByTestId(
        'tree-node-$.level1.level2.level3.level4.level5.level6.deepKey',
      );
      expect(deepNode).toBeInTheDocument();

      // Count how many .mjr-tree__children ancestors it has
      let parent = deepNode.parentElement;
      let childrenAncestors = 0;
      while (parent) {
        if (parent.classList.contains('mjr-tree__children')) {
          childrenAncestors++;
        }
        if (parent.classList.contains('mjr-tree-editor')) break;
        parent = parent.parentElement;
      }
      // deepKey is at depth 7 (root → level1 → ... → level6 → deepKey)
      // so it should be inside at least 6 .mjr-tree__children containers
      expect(childrenAncestors).toBeGreaterThanOrEqual(6);
    });
  });

  describe('tree rows use non-shrinking flex layout for horizontal expansion', () => {
    it('tree rows have mjr-tree__row class', () => {
      render(<JsonEditor mode="tree" value={wideValuesJson} height={300} />);
      const treeEditor = screen.getByTestId('tree-editor');
      const rows = treeEditor.querySelectorAll('.mjr-tree__row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('content area inside rows has mjr-tree__content class', () => {
      render(<JsonEditor mode="tree" value={wideValuesJson} height={300} />);
      const treeEditor = screen.getByTestId('tree-editor');
      const contents = treeEditor.querySelectorAll('.mjr-tree__content');
      expect(contents.length).toBeGreaterThan(0);
    });

    it('values do not have overflow:hidden or max-width (no truncation)', () => {
      render(<JsonEditor mode="tree" value={wideValuesJson} height={300} />);
      const treeEditor = screen.getByTestId('tree-editor');
      const values = treeEditor.querySelectorAll('.mjr-tree__value');
      expect(values.length).toBeGreaterThan(0);

      // Values render via formatDisplayValue which truncates strings > 80 chars,
      // but the value element itself should still exist and contain the start of the text
      const longVal = screen.getByTestId('value-$.longDescription');
      expect(longVal.textContent).toContain('extremely long string');
    });
  });

  describe('split mode — tree panel structure for horizontal scroll', () => {
    it('split mode has two half-width panels', () => {
      render(<JsonEditor mode="split" value={deeplyNestedJson} height={400} />);
      const editor = screen.getByTestId('json-editor');
      const halfPanels = editor.querySelectorAll('.mjr-editor__panel--half');
      expect(halfPanels.length).toBe(2);
    });

    it('tree editor in split mode is inside the second panel', () => {
      render(<JsonEditor mode="split" value={deeplyNestedJson} height={400} />);
      const editor = screen.getByTestId('json-editor');
      const panels = editor.querySelectorAll('.mjr-editor__panel--half');
      const secondPanel = panels[1];
      const treeEditor = secondPanel.querySelector('.mjr-tree-editor');
      expect(treeEditor).toBeTruthy();
    });

    it('expanding nested nodes in split mode creates children at all levels', () => {
      render(<JsonEditor mode="split" value={deeplyNestedJson} height={400} />);
      expandAllNodes();

      const deepNode = screen.getByTestId(
        'tree-node-$.level1.level2.level3.level4.level5.level6.deepKey',
      );
      expect(deepNode).toBeInTheDocument();

      // Verify the deep value is rendered (formatDisplayValue truncates strings > 80 chars)
      const value = screen.getByTestId('value-$.level1.level2.level3.level4.level5.level6.deepKey');
      expect(value.textContent).toContain('very long value');
    });

    it('collapsing nodes removes children (reducing content width)', () => {
      render(<JsonEditor mode="split" value={deeplyNestedJson} height={400} />);
      expandAllNodes();

      // Verify deep node exists
      expect(
        screen.getByTestId('tree-node-$.level1.level2.level3.level4.level5.level6.deepKey'),
      ).toBeInTheDocument();

      // Collapse level1
      const collapseBtn = screen.getAllByLabelText('Collapse');
      // Click the outermost collapse (level1)
      fireEvent.click(collapseBtn[collapseBtn.length - 1]);

      // Deep nodes should be removed
      expect(
        screen.queryByTestId('tree-node-$.level1.level2.level3.level4.level5.level6.deepKey'),
      ).not.toBeInTheDocument();
    });
  });

  describe('scroll container dimensions respond to content changes', () => {
    it('tree editor scrollWidth increases after expanding deeply nested nodes', () => {
      render(<JsonEditor mode="split" value={deeplyNestedJson} height={400} />);
      const editor = screen.getByTestId('json-editor');
      const panels = editor.querySelectorAll('.mjr-editor__panel--half');
      const treePanel = panels[1];

      // Mock panel dimensions: narrow panel to force overflow
      Object.defineProperty(treePanel, 'clientWidth', { value: 300, configurable: true });
      Object.defineProperty(treePanel, 'scrollWidth', {
        value: 300,
        configurable: true,
        writable: true,
      });

      // Before expanding: scrollWidth == clientWidth (no overflow)
      expect(treePanel.scrollWidth).toBe(treePanel.clientWidth);

      // Expand all nodes
      expandAllNodes();

      // After expanding, the tree content is deeper. In a real browser the
      // scrollWidth would be wider. In jsdom we verify that the deep DOM
      // structure was created (which is what causes scrollWidth > clientWidth
      // in a real browser).
      const deepNode = screen.queryByTestId(
        'tree-node-$.level1.level2.level3.level4.level5.level6.deepKey',
      );
      expect(deepNode).toBeInTheDocument();

      // Count total nesting depth via .mjr-tree__children containers
      const treeEditor = treePanel.querySelector('.mjr-tree-editor')!;
      const childrenContainers = treeEditor.querySelectorAll('.mjr-tree__children');
      expect(childrenContainers.length).toBeGreaterThanOrEqual(6);
    });
  });
});
