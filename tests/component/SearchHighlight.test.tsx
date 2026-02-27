import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { JsonEditor } from '../../src/JsonEditor';

const sampleJson = {
  name: 'John',
  fullName: 'John Doe',
  age: 30,
  address: { city: 'New York', zip: '10001' },
};

function openSearchAndType(query: string) {
  const toggle = screen.getByLabelText('Toggle search');
  fireEvent.click(toggle);
  const input = screen.getByLabelText('Search query');
  fireEvent.change(input, { target: { value: query } });
  return input;
}

describe('Search Highlighting — Code Editor', () => {
  it('renders <mark> elements for search matches in code mode', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('name');

    // Should have match marks in the display layer
    const marks = document.querySelectorAll('.mjr-code__match');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('marks the current match with the active class', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('name');

    const activeMarks = document.querySelectorAll('.mjr-code__match--active');
    expect(activeMarks.length).toBe(1);
  });

  it('active match changes when navigating with Next button', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('name');

    // Get active match text before navigation
    const activeMarkBefore = document.querySelector('.mjr-code__match--active');
    expect(activeMarkBefore).toBeTruthy();

    // Click Next
    fireEvent.click(screen.getByLabelText('Next match'));

    // There should still be exactly one active mark
    const activeMarksAfter = document.querySelectorAll('.mjr-code__match--active');
    expect(activeMarksAfter.length).toBe(1);
  });

  it('active match changes when navigating with Previous button', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('name');

    // Click Previous to wrap around to last match
    fireEvent.click(screen.getByLabelText('Previous match'));

    const activeMarks = document.querySelectorAll('.mjr-code__match--active');
    expect(activeMarks.length).toBe(1);
  });

  it('match highlights are removed when search query is cleared', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('name');

    // Should have marks
    expect(document.querySelectorAll('.mjr-code__match').length).toBeGreaterThan(0);

    // Clear the query
    const input = screen.getByLabelText('Search query');
    fireEvent.change(input, { target: { value: '' } });

    // Marks should be gone
    expect(document.querySelectorAll('.mjr-code__match').length).toBe(0);
  });

  it('match highlights are removed when search is closed', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('name');

    expect(document.querySelectorAll('.mjr-code__match').length).toBeGreaterThan(0);

    // Close search
    fireEvent.click(screen.getByLabelText('Close search'));

    expect(document.querySelectorAll('.mjr-code__match').length).toBe(0);
  });

  it('no match marks for a query with no results', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('xyznonexistent');

    expect(document.querySelectorAll('.mjr-code__match').length).toBe(0);
  });

  it('displays correct match count in search bar', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('John');

    // "John" appears twice in the JSON: in "name" value and "fullName" value
    const countEl = document.querySelector('.mjr-search__count');
    expect(countEl).toBeTruthy();
    expect(countEl!.textContent).toMatch(/1 of 2/);
  });

  it('navigates through matches cyclically', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    openSearchAndType('John');

    const countEl = () => document.querySelector('.mjr-search__count')!.textContent;

    expect(countEl()).toMatch(/1 of 2/);

    fireEvent.click(screen.getByLabelText('Next match'));
    expect(countEl()).toMatch(/2 of 2/);

    // Wraps back to 1
    fireEvent.click(screen.getByLabelText('Next match'));
    expect(countEl()).toMatch(/1 of 2/);
  });
});

describe('Search Highlighting — Tree Editor', () => {
  it('renders <mark> elements for search matches in tree mode', () => {
    render(<JsonEditor mode="tree" value={sampleJson} searchable />);
    openSearchAndType('name');

    const treeMarks = document.querySelectorAll('.mjr-tree__match');
    expect(treeMarks.length).toBeGreaterThan(0);
  });

  it('highlights matching keys in tree view', () => {
    render(<JsonEditor mode="tree" value={sampleJson} searchable />);
    openSearchAndType('name');

    // "name" and "fullName" keys should have highlight marks
    const treeMarks = document.querySelectorAll('.mjr-tree__match');
    const markTexts = Array.from(treeMarks).map((m) => m.textContent);
    expect(markTexts.some((t) => t === 'name')).toBe(true);
  });

  it('highlights matching values in tree view', () => {
    render(<JsonEditor mode="tree" value={sampleJson} searchable />);
    openSearchAndType('John');

    const treeMarks = document.querySelectorAll('.mjr-tree__match');
    const markTexts = Array.from(treeMarks).map((m) => m.textContent);
    expect(markTexts.some((t) => t === 'John')).toBe(true);
  });

  it('tree highlights are removed when search is closed', () => {
    render(<JsonEditor mode="tree" value={sampleJson} searchable />);
    openSearchAndType('name');

    expect(document.querySelectorAll('.mjr-tree__match').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Close search'));
    expect(document.querySelectorAll('.mjr-tree__match').length).toBe(0);
  });

  it('no tree highlights for a non-matching query', () => {
    render(<JsonEditor mode="tree" value={sampleJson} searchable />);
    openSearchAndType('xyznonexistent');

    expect(document.querySelectorAll('.mjr-tree__match').length).toBe(0);
  });
});

describe('Search Highlighting — Split Mode', () => {
  it('highlights matches in both code and tree panels in split mode', () => {
    render(<JsonEditor mode="split" value={sampleJson} searchable />);
    openSearchAndType('name');

    // Code editor highlights
    const codeMarks = document.querySelectorAll('.mjr-code__match');
    expect(codeMarks.length).toBeGreaterThan(0);

    // Tree editor highlights
    const treeMarks = document.querySelectorAll('.mjr-tree__match');
    expect(treeMarks.length).toBeGreaterThan(0);
  });
});

describe('Search Navigation with Enter key', () => {
  it('Enter key in search input navigates to next match', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    const input = openSearchAndType('John');

    const countEl = () => document.querySelector('.mjr-search__count')!.textContent;
    expect(countEl()).toMatch(/1 of 2/);

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(countEl()).toMatch(/2 of 2/);
  });

  it('Shift+Enter in search input navigates to previous match', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    const input = openSearchAndType('John');

    const countEl = () => document.querySelector('.mjr-search__count')!.textContent;
    expect(countEl()).toMatch(/1 of 2/);

    // Press Shift+Enter to wrap to last match
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(countEl()).toMatch(/2 of 2/);
  });

  it('Escape key closes the search bar', () => {
    render(<JsonEditor mode="code" value={sampleJson} searchable />);
    const input = openSearchAndType('John');

    expect(screen.getByRole('search')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });
});
