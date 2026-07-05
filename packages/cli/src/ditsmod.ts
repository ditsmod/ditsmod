#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './commands/start.command.js';
import { newCommand } from './commands/new.command.js';

const program = new Command();

program
  .name('ditsmod')
  .usage('[options] [command]\n       dm [options] [command]')
  .description('Ditsmod CLI — development tools for Ditsmod framework')
  .version('3.0.0-next.13');

startCommand(program);
newCommand(program);

program.parse(process.argv);
