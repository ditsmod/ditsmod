import { describe, expect, it } from 'vitest';
import { findCycle, GroupConfig } from './tarjan-graph.js';

describe("Tarjan's algorithm", () => {
  describe('circular dependencies with "beforeGroup" property', () => {
    it('case 1', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext2', beforeGroup: 'ext1' },
        { group: 'ext1', beforeGroup: 'ext3' },
      ];

      expect(findCycle(configs)).toBe(null);
    });

    it('case 2', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext3', beforeGroup: 'ext2' },
        { group: 'ext2', beforeGroup: 'ext1' },
        { group: 'ext1', beforeGroup: 'ext4' },
      ];

      expect(findCycle(configs)).toBe(null);
    });

    it('case 3', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext2', beforeGroup: 'ext1' },
        { group: 'ext1', beforeGroup: 'ext2' },
      ];

      expect(findCycle(configs)).toEqual(['ext2', 'ext1', 'ext2']);
    });

    it('has circular dependencies with mediator', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext3', beforeGroup: 'ext2' },
        { group: 'ext2', beforeGroup: 'ext1' },
        { group: 'ext1', beforeGroup: 'ext3' },
      ];
      expect(findCycle(configs)).toEqual(['ext3', 'ext2', 'ext1', 'ext3']);
    });

    it('has circular dependencies with mediator and other deps', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext3', beforeGroup: 'ext2' },
        { group: 'ext3', beforeGroup: 'ext4' },
        { group: 'ext2', beforeGroup: 'ext1' },
        { group: 'ext2', beforeGroup: 'ext4' },
        { group: 'ext1', beforeGroup: 'ext3' },
      ];

      expect(findCycle(configs)).toEqual(['ext3', 'ext2', 'ext1', 'ext3']);
    });
  });

  describe('circular dependencies with "afterGroup" property', () => {
    it('case 1', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext.1', afterGroup: 'ext.2' },
        { group: 'ext.2', afterGroup: 'ext.1' },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.2', 'ext.1']);
    });

    it('case 2', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext.1', afterGroup: 'ext.2' },
        { group: 'ext.2', afterGroup: 'ext.3' },
        { group: 'ext.3', afterGroup: 'ext.1' },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.3', 'ext.2', 'ext.1']);
    });
  });

  describe('circular dependencies with mix "beforeGroup" and "afterGroup" properties', () => {
    it('case 1', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext.1', afterGroup: 'ext.2', beforeGroup: 'ext.2' },
        { group: 'ext.2' },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.2', 'ext.1']);
    });

    it.only('case 2', () => {
      const configs: GroupConfig<string>[] = [
        { group: 'ext.1', afterGroup: 'ext.2', beforeGroup: 'ext.3' },
        { group: 'ext.2' },
        { group: 'ext.3', beforeGroup: 'ext.2' },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.3', 'ext.2', 'ext.1']);
    });
  });
});
