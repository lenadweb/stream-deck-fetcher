import { Script, createContext } from "node:vm";
import { parse } from "node-html-parser";

const TIMEOUT_MS = 300;
const MAX_COMPILED_SCRIPTS = 50;

export interface ScriptLogger {
    (level: "log" | "warn" | "error", args: unknown[]): void;
}

/**
 * Runs a user-supplied handler against a fetched response.
 *
 * The handler is a whole function — `function handler(response) { ... }` or an
 * arrow — executed in a fresh vm context, so it has no access to `process`,
 * `require` or the network. The point of the vm is mostly the `timeout`: it
 * interrupts a runaway loop that would otherwise hang the whole plugin process.
 */
export class ScriptRunner {
    private readonly compiled = new Map<string, Script>();

    constructor(private readonly logger?: ScriptLogger) {}

    run(code: string, text: string): unknown {
        if (!code.trim()) {
            throw new Error("No script");
        }

        const script = this.compile(code);
        const response = this.toResponse(text);

        const globals: Record<string, unknown> = {
            response,
            console: this.makeConsole(),
        };

        // For HTML, also expose the browser-console spelling: `querySelectorAll(...)`
        // and `document.querySelectorAll(...)`, not just `response.querySelectorAll(...)`.
        if (this.isHtmlRoot(response)) {
            const root = response as any;
            globals.document = root;
            globals.querySelector = (selector: string) => root.querySelector(selector);
            globals.querySelectorAll = (selector: string) => root.querySelectorAll(selector);
        }

        const context = createContext(globals);

        try {
            return script.runInContext(context, { timeout: TIMEOUT_MS });
        } catch (err: any) {
            if (err?.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
                throw new Error("Script timeout");
            }
            throw err;
        }
    }

    /** Parsed JSON when the body is JSON, otherwise the parsed HTML root. */
    private toResponse(text: string): unknown {
        try {
            return JSON.parse(text);
        } catch {
            return parse(text);
        }
    }

    private isHtmlRoot(value: unknown): boolean {
        return typeof (value as any)?.querySelectorAll === "function";
    }

    private compile(code: string): Script {
        const cached = this.compiled.get(code);
        if (cached) {
            return cached;
        }

        // Two accepted shapes, tried in order. The wrappers keep the user's code
        // starting on line 1 so error line numbers match the Property Inspector,
        // and they call the handler inside the vm so the timeout covers the call.
        let script: Script;
        try {
            // A single function expression: function (response) {…} or (response) => …
            script = new Script(`"use strict";(` + code + `\n)(response)`, { filename: "handler.js" });
        } catch (exprErr: any) {
            try {
                // Declarations, so helpers can sit next to a named `handler`.
                script = new Script(`"use strict";` + code + `\n;handler(response)`, { filename: "handler.js" });
            } catch {
                throw new Error(`Syntax: ${exprErr?.message || "invalid handler"}`);
            }
        }

        if (this.compiled.size >= MAX_COMPILED_SCRIPTS) {
            this.compiled.clear();
        }
        this.compiled.set(code, script);
        return script;
    }

    private makeConsole(): Record<string, (...args: unknown[]) => void> {
        const forward = (level: "log" | "warn" | "error") => (...args: unknown[]) => {
            this.logger?.(level, args);
        };
        return { log: forward("log"), warn: forward("warn"), error: forward("error") };
    }
}
