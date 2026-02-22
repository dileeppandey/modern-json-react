import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { JsonEditor } from '../../src/JsonEditor';

describe('JsonEditor Component', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<JsonEditor />);
      expect(screen.getByTestId('json-editor')).toBeInTheDocument();
    });

    it('renders with initial object value', () => {
      render(<JsonEditor value={{ name: 'John' }} />);
      expect(screen.getByTestId('json-editor')).toBeInTheDocument();
    });

    it('renders with initial string value', () => {
      render(<JsonEditor value='{"name": "John"}' />);
      expect(screen.getByTestId('json-editor')).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      render(<JsonEditor height={600} />);
      const editor = screen.getByTestId('json-editor');
      expect(editor.style.height).toBe('600px');
    });

    it('renders with string height', () => {
      render(<JsonEditor height="50vh" />);
      const editor = screen.getByTestId('json-editor');
      expect(editor.style.height).toBe('50vh');
    });

    it('applies custom className', () => {
      render(<JsonEditor className="my-editor" />);
      const editor = screen.getByTestId('json-editor');
      expect(editor.classList.contains('my-editor')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA role', () => {
      render(<JsonEditor />);
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('has accessible label', () => {
      render(<JsonEditor aria-label="Config editor" />);
      expect(screen.getByLabelText('Config editor')).toBeInTheDocument();
    });

    it('renders toolbar with correct role', () => {
      render(<JsonEditor />);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('renders mode tabs with correct roles', () => {
      render(<JsonEditor />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(3); // Code, Tree, Split
    });

    it('marks active mode tab as selected', () => {
      render(<JsonEditor mode="code" />);
      const codeTab = screen.getByRole('tab', { name: /code/i });
      expect(codeTab.getAttribute('aria-selected')).toBe('true');
    });

    it('renders status bar with live region', () => {
      render(<JsonEditor value={{ a: 1 }} />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('mode switching', () => {
    it('switches to tree mode', async () => {
      const onModeChange = vi.fn();
      render(<JsonEditor value={{ a: 1 }} onModeChange={onModeChange} />);

      const treeTab = screen.getByRole('tab', { name: /tree/i });
      fireEvent.click(treeTab);
      expect(onModeChange).toHaveBeenCalledWith('tree');
    });

    it('switches to split mode', async () => {
      const onModeChange = vi.fn();
      render(<JsonEditor value={{ a: 1 }} onModeChange={onModeChange} />);

      const splitTab = screen.getByRole('tab', { name: /split/i });
      fireEvent.click(splitTab);
      expect(onModeChange).toHaveBeenCalledWith('split');
    });
  });

  describe('code editor', () => {
    it('renders textarea in code mode', () => {
      render(<JsonEditor mode="code" value={{ a: 1 }} />);
      expect(screen.getByTestId('code-editor-textarea')).toBeInTheDocument();
    });

    it('textarea is readonly when readOnly prop is set', () => {
      render(<JsonEditor mode="code" value={{ a: 1 }} readOnly />);
      const textarea = screen.getByTestId('code-editor-textarea');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('calls onChange when text is edited', async () => {
      const onChange = vi.fn();
      render(<JsonEditor mode="code" value={{ a: 1 }} onChange={onChange} />);

      const textarea = screen.getByTestId('code-editor-textarea');
      fireEvent.change(textarea, { target: { value: '{"a": 2}' } });
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('tree editor', () => {
    it('renders tree in tree mode', () => {
      render(<JsonEditor mode="tree" value={{ name: 'John', age: 30 }} />);
      expect(screen.getByTestId('tree-editor')).toBeInTheDocument();
    });

    it('shows empty state for undefined value', () => {
      render(<JsonEditor mode="tree" />);
      expect(screen.getByText(/no valid json/i)).toBeInTheDocument();
    });

    it('shows add property button when not readOnly', () => {
      render(<JsonEditor mode="tree" value={{ a: 1 }} />);
      expect(screen.getByTestId('add-property')).toBeInTheDocument();
    });

    it('hides add property button when readOnly', () => {
      render(<JsonEditor mode="tree" value={{ a: 1 }} readOnly />);
      expect(screen.queryByTestId('add-property')).not.toBeInTheDocument();
    });
  });

  describe('toolbar', () => {
    it('disables undo button when no history', () => {
      render(<JsonEditor value={{ a: 1 }} />);
      const undoBtn = screen.getByLabelText('Undo');
      expect(undoBtn).toBeDisabled();
    });

    it('disables redo button when no future states', () => {
      render(<JsonEditor value={{ a: 1 }} />);
      const redoBtn = screen.getByLabelText('Redo');
      expect(redoBtn).toBeDisabled();
    });

    it('hides undo/redo in readOnly mode', () => {
      render(<JsonEditor value={{ a: 1 }} readOnly />);
      expect(screen.queryByLabelText('Undo')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Redo')).not.toBeInTheDocument();
    });

    it('shows search toggle when searchable', () => {
      render(<JsonEditor searchable />);
      expect(screen.getByLabelText('Toggle search')).toBeInTheDocument();
    });

    it('hides search toggle when not searchable', () => {
      render(<JsonEditor searchable={false} />);
      expect(screen.queryByLabelText('Toggle search')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows valid status for valid JSON', () => {
      render(<JsonEditor value={{ a: 1 }} />);
      expect(screen.getByText(/valid json/i)).toBeInTheDocument();
    });

    it('calls onValidate with errors', async () => {
      const onValidate = vi.fn();
      const schema = {
        type: 'object',
        properties: { age: { type: 'number', minimum: 0 } },
      };

      render(
        <JsonEditor
          value={{ age: -5 }}
          schema={schema}
          onValidate={onValidate}
        />
      );

      // Wait for debounced validation
      await new Promise((r) => setTimeout(r, 500));
      expect(onValidate).toHaveBeenCalled();
    });
  });

  describe('theming', () => {
    it('applies light theme by default', () => {
      render(<JsonEditor />);
      const editor = screen.getByTestId('json-editor');
      expect(editor.style.getPropertyValue('--mjr-bg')).toBeTruthy();
    });

    it('applies dark theme', () => {
      render(<JsonEditor theme="dark" />);
      const editor = screen.getByTestId('json-editor');
      expect(editor.style.getPropertyValue('--mjr-bg')).toBe('#1e1e1e');
    });

    it('applies custom theme config', () => {
      const customTheme = {
        name: 'custom',
        bg: '#ff0000',
        fg: '#00ff00',
        border: '#0000ff',
        gutterBg: '#111',
        gutterFg: '#222',
        selection: '#333',
        cursor: '#444',
        keyColor: '#555',
        stringColor: '#666',
        numberColor: '#777',
        booleanColor: '#888',
        nullColor: '#999',
        bracketColor: '#aaa',
        bracketMatchBg: '#bbb',
        errorColor: '#ccc',
        warningColor: '#ddd',
        successColor: '#eee',
        treeLine: '#f00',
        treeHover: '#0f0',
        treeSelected: '#00f',
        typeBadgeBg: '#f0f',
      };

      render(<JsonEditor theme={customTheme} />);
      const editor = screen.getByTestId('json-editor');
      expect(editor.style.getPropertyValue('--mjr-bg')).toBe('#ff0000');
    });
  });

  describe('callbacks', () => {
    it('calls onFocus when editor is focused', () => {
      const onFocus = vi.fn();
      render(<JsonEditor onFocus={onFocus} />);
      fireEvent.focus(screen.getByTestId('json-editor'));
      expect(onFocus).toHaveBeenCalled();
    });

    it('calls onBlur when editor loses focus', () => {
      const onBlur = vi.fn();
      render(<JsonEditor onBlur={onBlur} />);
      const editor = screen.getByTestId('json-editor');
      fireEvent.focus(editor);
      fireEvent.blur(editor);
      expect(onBlur).toHaveBeenCalled();
    });
  });
});
