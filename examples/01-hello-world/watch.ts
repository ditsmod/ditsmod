import ts from 'typescript';
import { spawn, type ChildProcess } from 'node:child_process';

let appProcess: ChildProcess | null = null;

function restartApp() {
  if (appProcess) {
    appProcess.kill();
  }

  appProcess = spawn('node', ['--enable-source-maps', 'dist/main.js'], {
    stdio: 'inherit',
  });
}

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.build.json');

if (!configPath) {
  console.error('tsconfig.build.json not found');
  process.exit(1);
}

const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

const host = ts.createWatchCompilerHost(configPath, {}, ts.sys, createProgram);

const origAfterProgramCreate = host.afterProgramCreate;

host.afterProgramCreate = (builderProgram) => {
  origAfterProgramCreate?.(builderProgram);

  const diagnostics = ts.getPreEmitDiagnostics(builderProgram.getProgram());
  const hasErrors = diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error);

  if (!hasErrors) {
    console.log('\n[Watch] Compilation succeeded! Starting application...\n');
    restartApp();
  }
};

ts.createWatchProgram(host);

process.on('SIGINT', () => {
  if (appProcess) {
    appProcess.kill();
  }
  process.exit();
});
