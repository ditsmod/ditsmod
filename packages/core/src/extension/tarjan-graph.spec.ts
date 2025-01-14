import { describe, expect, it } from 'vitest';
import { findCycle, ExtensionConfig } from './tarjan-graph.js';

describe("Tarjan's algorithm", () => {
  describe('circular dependencies with "beforeExtensions" property', () => {
    it('case 1', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext2', beforeExtensions: ['ext1'] },
        { extension: 'ext1', beforeExtensions: ['ext3'] },
      ];

      expect(findCycle(configs)).toBe(null);
    });

    it('case 2', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext3', beforeExtensions: ['ext2'] },
        { extension: 'ext2', beforeExtensions: ['ext1'] },
        { extension: 'ext1', beforeExtensions: ['ext4'] },
      ];

      expect(findCycle(configs)).toBe(null);
    });

    it('case 3', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext2', beforeExtensions: ['ext1'] },
        { extension: 'ext1', beforeExtensions: ['ext2'] },
      ];

      expect(findCycle(configs)).toEqual(['ext2', 'ext1', 'ext2']);
    });

    it('has circular dependencies with mediator', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext3', beforeExtensions: ['ext2'] },
        { extension: 'ext2', beforeExtensions: ['ext1'] },
        { extension: 'ext1', beforeExtensions: ['ext3'] },
      ];
      expect(findCycle(configs)).toEqual(['ext3', 'ext2', 'ext1', 'ext3']);
    });

    it('has circular dependencies with mediator and other deps', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext3', beforeExtensions: ['ext2'] },
        { extension: 'ext3', beforeExtensions: ['ext4'] },
        { extension: 'ext2', beforeExtensions: ['ext1'] },
        { extension: 'ext2', beforeExtensions: ['ext4'] },
        { extension: 'ext1', beforeExtensions: ['ext3'] },
      ];

      expect(findCycle(configs)).toEqual(['ext3', 'ext2', 'ext1', 'ext3']);
    });
  });

  describe('circular dependencies with "afterExtensions" property', () => {
    it('case 1', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext.1', afterExtensions: ['ext.2'] },
        { extension: 'ext.2', afterExtensions: ['ext.1'] },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.2', 'ext.1']);
    });

    it('case 2', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext.1', afterExtensions: ['ext.2'] },
        { extension: 'ext.2', afterExtensions: ['ext.3'] },
        { extension: 'ext.3', afterExtensions: ['ext.1'] },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.3', 'ext.2', 'ext.1']);
    });
  });

  describe('circular dependencies with mix "beforeExtensions" and "afterExtensions" properties', () => {
    it('case 1', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext.1', afterExtensions: ['ext.2'], beforeExtensions: ['ext.2'] },
        { extension: 'ext.2' },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.2', 'ext.1']);
    });

    it('case 2', () => {
      const configs: ExtensionConfig<string>[] = [
        { extension: 'ext.1', afterExtensions: ['ext.2'], beforeExtensions: ['ext.3'] },
        { extension: 'ext.2' },
        { extension: 'ext.3', beforeExtensions: ['ext.2'] },
      ];
      expect(findCycle(configs)).toEqual(['ext.1', 'ext.3', 'ext.2', 'ext.1']);
    });
  });
});
