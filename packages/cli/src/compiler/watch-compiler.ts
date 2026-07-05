import ts from 'typescript';
import { EventEmitter } from 'node:events';
import path from 'node:path';

export interface WatchCompilerOptions {
  tsconfig: string;
  preserveWatchOutput?: boolean;
}

export interface CompilationResult {
  hasErrors: boolean;
  diagnostics: readonly ts.Diagnostic[];
}

/**
 * Wraps the TypeScript Compiler API for incremental watch-mode compilation.
 *
 * Emits the following events:
 * - `compiled` (result: CompilationResult) — after each compilation cycle completes.
 * - `error` (err: Error) — on internal failures.
 */
export class WatchCompiler extends EventEmitter {
  private watchProgram: ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram> | null = null;

  constructor(private readonly options: WatchCompilerOptions) {
    super();
  }

  start(): void {
    const { tsconfig, preserveWatchOutput = false } = this.options;

    const configPath = ts.findConfigFile(
      path.dirname(path.resolve(tsconfig)),
      ts.sys.fileExists,
      path.basename(tsconfig),
    );

    if (!configPath) {
      throw new Error(`Cannot find TypeScript config file: "${tsconfig}"`);
    }

    const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

    const host = ts.createWatchCompilerHost(
      configPath,
      { preserveWatchOutput },
      ts.sys,
      createProgram,
    );

    // Intercept the official afterProgramCreate lifecycle hook
    const origAfterProgramCreate = host.afterProgramCreate;

    host.afterProgramCreate = (builderProgram) => {
      // Always call original to let TypeScript finalise the watch state
      origAfterProgramCreate?.(builderProgram);

      // Inspect cached incremental diagnostics WITHOUT causing an un-cached full re-check
      const diagnostics = [
        ...builderProgram.getSyntacticDiagnostics(),
        ...builderProgram.getSemanticDiagnostics(),
        ...builderProgram.getOptionsDiagnostics(),
      ];
      const hasErrors = diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error);

      this.emit('compiled', { hasErrors, diagnostics } satisfies CompilationResult);
    };

    this.watchProgram = ts.createWatchProgram(host);
  }

  close(): void {
    this.watchProgram?.close();
    this.watchProgram = null;
  }
}
