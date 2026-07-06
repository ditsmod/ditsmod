import ts from 'typescript';
import { EventEmitter } from 'node:events';
import path from 'node:path';

export interface WatchCompilerOptions {
  tsconfig: string;
  preserveWatchOutput?: boolean;
  verbose?: boolean;
}

export interface CompilationResult {
  hasErrors: boolean;
  diagnostics: readonly ts.Diagnostic[];
  errorCount?: number;
  duration?: number;
}

/**
 * Wraps the TypeScript Compiler API for incremental watch-mode compilation.
 *
 * Emits the following events:
 * - `buildStart` — when compilation starts.
 * - `compiled` (result: CompilationResult) — after each compilation cycle completes.
 * - `error` (err: Error) — on internal failures.
 */
declare module 'typescript' {
  export const Diagnostics: {
    Found_0_errors_Watching_for_file_changes: { code: number };
    Found_1_error_Watching_for_file_changes: { code: number };
    Starting_compilation_in_watch_mode: { code: number };
    File_change_detected_Starting_incremental_compilation: { code: number };
  };
  export function createWatchStatusReporter(system: ts.System, pretty?: boolean): ts.WatchStatusReporter;
  export function createDiagnosticReporter(system: ts.System, pretty?: boolean): ts.DiagnosticReporter;
  export interface SolutionBuilder<T extends ts.BuilderProgram> {
    close(): void;
  }
}

const watchCompletionCodes = new Set<number>([
  ts.Diagnostics.Found_0_errors_Watching_for_file_changes.code,
  ts.Diagnostics.Found_1_error_Watching_for_file_changes.code,
]);

const watchStartCodes = new Set<number>([
  ts.Diagnostics.Starting_compilation_in_watch_mode.code,
  ts.Diagnostics.File_change_detected_Starting_incremental_compilation.code,
]);

export class WatchCompiler extends EventEmitter {
  private solutionBuilder: ts.SolutionBuilder<ts.EmitAndSemanticDiagnosticsBuilderProgram> | null = null;

  constructor(private readonly options: WatchCompilerOptions) {
    super();
  }

  start(): void {
    const { tsconfig, preserveWatchOutput = false, verbose = false } = this.options;

    const configPath = ts.findConfigFile(
      path.dirname(path.resolve(tsconfig)),
      ts.sys.fileExists,
      path.basename(tsconfig),
    );

    if (!configPath) {
      throw new Error(`Cannot find TypeScript config file: "${tsconfig}"`);
    }

    this.emit('buildStart');

    const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

    // TypeScript's default watch status reporter appends double newlines to status messages.
    // We wrap system.write to normalize multiple trailing newlines to a single newline.
    const watchStatusSystem: ts.System = {
      ...ts.sys,
      write(msg: string) {
        ts.sys.write(msg.replace(/(\r?\n){2,}$/, ts.sys.newLine));
      },
    };

    let startTime = Date.now();
    let currentDiagnostics: ts.Diagnostic[] = [];
    const defaultWatchStatusReporter = ts.createWatchStatusReporter(watchStatusSystem, true);
    const defaultDiagnosticReporter = ts.createDiagnosticReporter(watchStatusSystem, true);

    const host = ts.createSolutionBuilderWithWatchHost(
      watchStatusSystem,
      createProgram,
      (diagnostic) => {
        defaultDiagnosticReporter(diagnostic);
        currentDiagnostics.push(diagnostic);
      },
      undefined,
      (watchStatusDiagnostic, newLine, options, errorCount) => {
        if (verbose) {
          defaultWatchStatusReporter(watchStatusDiagnostic, newLine, options, errorCount);
        }

        const code = watchStatusDiagnostic.code;
        if (watchCompletionCodes.has(code)) {
          const hasErrors = currentDiagnostics.some((d) => d.category === ts.DiagnosticCategory.Error);
          const computedErrorCount = currentDiagnostics.filter(
            (d) => d.category === ts.DiagnosticCategory.Error,
          ).length;
          const diagnostics = [...currentDiagnostics];
          currentDiagnostics = [];
          const duration = Date.now() - startTime;
          this.emit('compiled', {
            hasErrors,
            diagnostics,
            errorCount: computedErrorCount,
            duration,
          } satisfies CompilationResult);
        } else if (watchStartCodes.has(code)) {
          startTime = Date.now();
          currentDiagnostics = [];
          this.emit('buildStart');
        }
      },
    );

    if (verbose) {
      host.reportSolutionBuilderStatus = (diagnostic) => {
        defaultDiagnosticReporter(diagnostic);
      };
    }

    this.solutionBuilder = ts.createSolutionBuilderWithWatch(host, [configPath], { preserveWatchOutput });

    this.solutionBuilder.build();
  }

  close(): void {
    if (this.solutionBuilder) {
      this.solutionBuilder.close();
      this.solutionBuilder = null;
    }
  }
}
