#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './commands/start.command.js';
import { newCommand } from './commands/new.command.js';

const program = new Command();

program
  .name('holu')
  .usage('[options] [command]\n       dm [options] [command]')
  .description('Holu CLI — development tools for Holu framework')
  .version('3.0.0-next.15');

startCommand(program);
newCommand(program);

program.parse(process.argv);
