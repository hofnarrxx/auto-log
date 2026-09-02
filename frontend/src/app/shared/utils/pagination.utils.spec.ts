import { buildPageNumbers } from './pagination.utils';

describe('buildPageNumbers', () => {
  it('returns an empty array when there are no pages', () => {
    expect(buildPageNumbers(0, 0)).toEqual([]);
  });

  it('returns every page when the total fits within maxButtons', () => {
    expect(buildPageNumbers(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('always includes the first and last page', () => {
    const pages = buildPageNumbers(5, 20);
    expect(pages[0]).toBe(0);
    expect(pages[pages.length - 1]).toBe(19);
  });

  it('collapses the middle into a single ellipsis around the current page', () => {
    expect(buildPageNumbers(10, 20)).toEqual([0, 'ellipsis', 9, 10, 11, 'ellipsis', 19]);
  });

  it('only shows a leading ellipsis when the current page is near the start', () => {
    expect(buildPageNumbers(0, 20)).toEqual([0, 1, 'ellipsis', 19]);
  });

  it('only shows a trailing ellipsis when the current page is near the end', () => {
    expect(buildPageNumbers(19, 20)).toEqual([0, 'ellipsis', 18, 19]);
  });

  it('never duplicates the boundary pages when the window touches them', () => {
    const pages = buildPageNumbers(1, 20);
    expect(pages).toEqual([0, 1, 2, 'ellipsis', 19]);
  });
});
