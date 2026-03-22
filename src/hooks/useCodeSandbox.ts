import { useState, useCallback, useRef } from "react";

export interface CodeExecutionResult {
  output: string;
  error?: string;
  duration_ms: number;
  language: string;
}

/**
 * Hook for executing code in the browser.
 * - JavaScript: uses Function() constructor in a sandboxed scope
 * - Python: uses Pyodide (loaded on first use)
 */
export function useCodeSandbox() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef<any>(null);

  /** Load Pyodide from CDN (lazy, only on first Python execution). */
  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;

    // Dynamically load Pyodide script
    if (!(window as any).loadPyodide) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
      script.async = true;
      document.head.appendChild(script);
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
      });
    }

    const pyodide = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    });
    pyodideRef.current = pyodide;
    setPyodideReady(true);
    return pyodide;
  }, []);

  /** Execute JavaScript code in a sandboxed scope. */
  const executeJavaScript = useCallback(
    async (code: string, timeoutMs = 5000): Promise<CodeExecutionResult> => {
      const start = Date.now();
      const output: string[] = [];

      // Create sandboxed console
      const sandboxConsole = {
        log: (...args: any[]) => output.push(args.map(String).join(" ")),
        error: (...args: any[]) => output.push(`[ERROR] ${args.map(String).join(" ")}`),
        warn: (...args: any[]) => output.push(`[WARN] ${args.map(String).join(" ")}`),
        info: (...args: any[]) => output.push(args.map(String).join(" ")),
      };

      try {
        // Wrap in a timeout
        const result = await Promise.race([
          new Promise<any>((resolve, reject) => {
            try {
              // Create sandboxed function with custom console
              const fn = new Function(
                "console",
                "setTimeout",
                "setInterval",
                "fetch",
                `"use strict";\n${code}`
              );
              const returnVal = fn(sandboxConsole, undefined, undefined, undefined);
              resolve(returnVal);
            } catch (err) {
              reject(err);
            }
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);

        if (result !== undefined) {
          output.push(`=> ${String(result)}`);
        }

        return {
          output: output.join("\n").slice(0, 10000),
          duration_ms: Date.now() - start,
          language: "javascript",
        };
      } catch (err) {
        return {
          output: output.join("\n").slice(0, 10000),
          error: String(err),
          duration_ms: Date.now() - start,
          language: "javascript",
        };
      }
    },
    []
  );

  /** Execute Python code using Pyodide. */
  const executePython = useCallback(
    async (code: string, timeoutMs = 10000): Promise<CodeExecutionResult> => {
      const start = Date.now();

      try {
        const pyodide = await Promise.race([
          loadPyodide(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Pyodide load timed out")), 15000)
          ),
        ]);

        // Redirect stdout
        pyodide.runPython(`
import sys
from io import StringIO
_stdout_capture = StringIO()
sys.stdout = _stdout_capture
`);

        // Execute with timeout
        const result = await Promise.race([
          (async () => {
            const returnVal = pyodide.runPython(code);
            const stdout = pyodide.runPython("_stdout_capture.getvalue()");
            // Restore stdout
            pyodide.runPython("sys.stdout = sys.__stdout__");
            return { returnVal, stdout };
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);

        const output: string[] = [];
        if (result.stdout) output.push(result.stdout);
        if (result.returnVal !== undefined && result.returnVal !== null) {
          output.push(`=> ${String(result.returnVal)}`);
        }

        return {
          output: output.join("\n").slice(0, 10000),
          duration_ms: Date.now() - start,
          language: "python",
        };
      } catch (err) {
        return {
          output: "",
          error: String(err),
          duration_ms: Date.now() - start,
          language: "python",
        };
      }
    },
    [loadPyodide]
  );

  /** Execute code in the appropriate sandbox. */
  const execute = useCallback(
    async (code: string, language: string, timeoutMs?: number): Promise<CodeExecutionResult> => {
      setIsExecuting(true);
      try {
        if (language === "python") {
          return await executePython(code, timeoutMs);
        }
        return await executeJavaScript(code, timeoutMs);
      } finally {
        setIsExecuting(false);
      }
    },
    [executeJavaScript, executePython]
  );

  return {
    execute,
    isExecuting,
    pyodideReady,
  };
}
