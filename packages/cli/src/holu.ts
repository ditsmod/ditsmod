#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import { startCommand } from './commands/start.command.js';
import { newCommand } from './commands/new.command.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('holu')
  .usage('[options] [command]\n       holu [options] [command]')
  .description('Holu CLI — development tools for Holu framework')
  .version(version);

startCommand(program);
newCommand(program);

program.parse(process.argv);
