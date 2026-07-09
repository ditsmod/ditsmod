import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { UserConfig } from '@commitlint/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPackages = (): string[] => {
  const packagesPath = path.join(__dirname, 'packages');
  if (!fs.existsSync(packagesPath)) {
    return [];
  }
  return fs
    .readdirSync(packagesPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [...getPackages(), 'website', 'examples', 'ci', 'experiments', 'cross']],
    'scope-empty': [2, 'never'],
    'header-max-length': [2, 'always', 120],
  },
  helpUrl:
    'https://github.com/ditsmod/ditsmod/blob/main/CONTRIBUTING.md\n\n' +
    '  Correct pattern:\n' +
    '  type(scope): subject\n\n' +
    '  Example:\n' +
    '  chore(website): update dependencies\n',
};

export default Configuration;
