#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './commands/start.command.js';

const program = new Command();

program
  .name('ditsmod')
  .description('Ditsmod CLI — development tools for Ditsmod framework')
  .version('3.0.0-next.13');

startCommand(program);

program.parse(process.argv);
