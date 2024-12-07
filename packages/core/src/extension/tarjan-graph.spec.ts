import { findCycle } from './tarjan-graph.js';

describe("Tarjan's algorithm", () => {
  it('no circular dependencies (case 1)', () => {
    const arr = [
      { group: 'ext2', beforeGroup: 'ext1' },
      { group: 'ext1', beforeGroup: 'ext3' },
    ];

    expect(findCycle(arr)).toBe(null);
  });

  it('no circular dependencies (case 2)', () => {
    const arr = [
      { group: 'ext3', beforeGroup: 'ext2' },
      { group: 'ext2', beforeGroup: 'ext1' },
      { group: 'ext1', beforeGroup: 'ext4' },
    ];

    expect(findCycle(arr)).toBe(null);
  });

  it('has direct circular dependencies', () => {
    const arr = [
      { group: 'ext2', beforeGroup: 'ext1' },
      { group: 'ext1', beforeGroup: 'ext2' },
    ];

    expect(findCycle(arr)).toEqual(['ext2', 'ext1', 'ext2']);
  });

  it('has circular dependencies with mediator', () => {
    const arr = [
      { group: 'ext3', beforeGroup: 'ext2' },
      { group: 'ext2', beforeGroup: 'ext1' },
      { group: 'ext1', beforeGroup: 'ext3' },
    ];

    expect(findCycle(arr)).toEqual(['ext3', 'ext2', 'ext1', 'ext3']);
  });
});
