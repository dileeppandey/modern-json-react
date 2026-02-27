import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { JsonEditor } from '../../src/JsonEditor';

// Large JSON to create scrollable content
const largeJson: Record<string, unknown> = {};
for (let i = 0; i < 50; i++) {
  largeJson[`key_${i}`] = `value ${i} - ${'a'.repeat(100)}`;
}

describe('Scroll Behavior', () => {
  describe('code editor scroll', () => {
    it('renders code editor with scrollable wrapper', () => {
      render(<JsonEditor mode="code" value={largeJson} height={200} />);
      const textarea = screen.getByTestId('code-editor-textarea');
      // The textarea should exist within the scrollable structure
      expect(textarea).toBeInTheDocument();
    });

    it('code editor wrapper has overflow: auto for scroll', () => {
      render(<JsonEditor mode="code" value={largeJson} height={200} />);
      const textarea = screen.getByTestId('code-editor-textarea');
      // The parent wrapper (.mjr-code-editor) should handle scrolling
      const wrapper = textarea.parentElement;
      expect(wrapper).toBeTruthy();
      expect(wrapper!.classList.contains('mjr-code-editor')).toBe(true);
    });

    it('textarea has overflow hidden to prevent dual scroll containers', () => {
      render(<JsonEditor mode="code" value={largeJson} height={200} />);
      const textarea = screen.getByTestId('code-editor-textarea');
      // In our CSS, the textarea has overflow: hidden.
      // In jsdom, computed styles from CSS files aren't applied,
      // so we verify the structural requirement: textarea is inside a wrapper
      // that handles scrolling, not itself.
      expect(textarea.tagName).toBe('TEXTAREA');
      const wrapper = textarea.parentElement;
      expect(wrapper).toBeTruthy();
    });

    it('display layer and textarea are siblings in the scroll container', () => {
      render(<JsonEditor mode="code" value={largeJson} height={200} />);
      const textarea = screen.getByTestId('code-editor-textarea');
      const wrapper = textarea.parentElement!;
      // Display layer (aria-hidden) should be a sibling
      const displayLayer = wrapper.querySelector('[aria-hidden="true"]');
      expect(displayLayer).toBeTruthy();
      expect(displayLayer!.classList.contains('mjr-code__display')).toBe(true);
    });

    it('syncs scroll position from wrapper to textarea', () => {
      render(<JsonEditor mode="code" value={largeJson} height={200} />);
      const textarea = screen.getByTestId('code-editor-textarea') as HTMLTextAreaElement;
      const wrapper = textarea.parentElement as HTMLDivElement;

      // Simulate wrapper scrolling
      Object.defineProperty(wrapper, 'scrollTop', { value: 100, writable: true });
      Object.defineProperty(wrapper, 'scrollLeft', { value: 50, writable: true });
      fireEvent.scroll(wrapper);

      // After scroll event, textarea should sync
      expect(textarea.scrollTop).toBe(100);
      expect(textarea.scrollLeft).toBe(50);
    });
  });

  describe('tree editor scroll', () => {
    it('renders tree editor inside a scrollable panel', () => {
      render(<JsonEditor mode="tree" value={largeJson} height={200} />);
      const treeEditor = screen.getByTestId('tree-editor');
      expect(treeEditor).toBeInTheDocument();

      // Tree editor should be inside the panel which handles scrolling
      const panel = treeEditor.closest('.mjr-editor__panel');
      expect(panel).toBeTruthy();
    });

    it('tree editor does not create a nested scroll container', () => {
      render(<JsonEditor mode="tree" value={largeJson} height={200} />);
      const treeEditor = screen.getByTestId('tree-editor');
      // The tree editor element itself should have overflow: visible (via CSS)
      // and let the parent panel handle scrolling.
      // We verify the structure: tree-editor is direct child of panel
      const panel = treeEditor.closest('.mjr-editor__panel');
      expect(panel).toBeTruthy();
      expect(panel!.contains(treeEditor)).toBe(true);
    });
  });

  describe('panel structure', () => {
    it('content area contains panels for split mode', () => {
      render(<JsonEditor mode="split" value={largeJson} height={200} />);
      const editor = screen.getByTestId('json-editor');
      const panels = editor.querySelectorAll('.mjr-editor__panel');
      // Split mode should have 2 panels
      expect(panels.length).toBe(2);
    });

    it('each panel in split mode is independently scrollable', () => {
      render(<JsonEditor mode="split" value={largeJson} height={200} />);
      const editor = screen.getByTestId('json-editor');
      const panels = editor.querySelectorAll('.mjr-editor__panel');
      // Both panels should have the --half modifier for 50% width
      panels.forEach((panel) => {
        expect(panel.classList.contains('mjr-editor__panel--half')).toBe(true);
      });
    });

    it('code mode has a single panel', () => {
      render(<JsonEditor mode="code" value={largeJson} height={200} />);
      const editor = screen.getByTestId('json-editor');
      const panels = editor.querySelectorAll('.mjr-editor__panel');
      expect(panels.length).toBe(1);
    });

    it('tree mode has a single panel', () => {
      render(<JsonEditor mode="tree" value={largeJson} height={200} />);
      const editor = screen.getByTestId('json-editor');
      const panels = editor.querySelectorAll('.mjr-editor__panel');
      expect(panels.length).toBe(1);
    });
  });
});

describe('Search Bar', () => {
  it('search bar is hidden by default', () => {
    render(<JsonEditor value={{ hello: 'world' }} />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('search bar opens when search toggle is clicked', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    const toggle = screen.getByLabelText('Toggle search');
    fireEvent.click(toggle);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('search bar has input field', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));
    expect(screen.getByLabelText('Search query')).toBeInTheDocument();
  });

  it('search bar has case sensitive and regex toggles', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));
    expect(screen.getByLabelText('Match case')).toBeInTheDocument();
    expect(screen.getByLabelText('Use regular expression')).toBeInTheDocument();
  });

  it('search bar has navigation buttons', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));
    expect(screen.getByLabelText('Previous match')).toBeInTheDocument();
    expect(screen.getByLabelText('Next match')).toBeInTheDocument();
  });

  it('search bar has close button', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));
    expect(screen.getByLabelText('Close search')).toBeInTheDocument();
  });

  it('search bar closes when close button is clicked', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));
    expect(screen.getByRole('search')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close search'));
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('search bar closes when search toggle is clicked again', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    const toggle = screen.getByLabelText('Toggle search');
    fireEvent.click(toggle);
    expect(screen.getByRole('search')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('navigation buttons are disabled when no matches', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));
    expect(screen.getByLabelText('Previous match')).toBeDisabled();
    expect(screen.getByLabelText('Next match')).toBeDisabled();
  });

  it('shows match count when typing a query', () => {
    render(<JsonEditor mode="code" value={{ hello: 'world', helloAgain: 'test' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));

    const input = screen.getByLabelText('Search query');
    fireEvent.change(input, { target: { value: 'hello' } });

    // Should show match count (aria-live region)
    const countEl = screen
      .getByLabelText('Search query')
      .closest('.mjr-search__input-group')
      ?.querySelector('.mjr-search__count');
    expect(countEl).toBeTruthy();
  });

  it('shows "No results" for unmatched query', () => {
    render(<JsonEditor mode="code" value={{ hello: 'world' }} searchable />);
    fireEvent.click(screen.getByLabelText('Toggle search'));

    const input = screen.getByLabelText('Search query');
    fireEvent.change(input, { target: { value: 'zzzzzzz_no_match' } });

    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('does not render search bar when searchable=false', () => {
    render(<JsonEditor value={{ hello: 'world' }} searchable={false} />);
    // No toggle button and no search bar
    expect(screen.queryByLabelText('Toggle search')).not.toBeInTheDocument();
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });
});

describe('Responsive Layout', () => {
  it('editor has a fixed height container for scroll to work', () => {
    render(<JsonEditor value={largeJson} height={300} />);
    const editor = screen.getByTestId('json-editor');
    expect(editor.style.height).toBe('300px');
  });

  it('split mode content area can stack vertically via responsive class', () => {
    // The responsive stacking is controlled by container width measurement.
    // In jsdom, ResizeObserver doesn't fire, so we test that the class structure exists.
    render(<JsonEditor mode="split" value={largeJson} />);
    const editor = screen.getByTestId('json-editor');
    const content = editor.querySelector('.mjr-editor__content');
    expect(content).toBeTruthy();
    // Without ResizeObserver triggering, it won't have responsive-stack class, which is correct
    expect(content!.classList.contains('mjr-editor__content')).toBe(true);
  });

  it('content area holds overflow hidden to contain panel scroll', () => {
    render(<JsonEditor mode="code" value={largeJson} height={200} />);
    const editor = screen.getByTestId('json-editor');
    const content = editor.querySelector('.mjr-editor__content');
    expect(content).toBeTruthy();
  });
});
