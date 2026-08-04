// [e8] The JSON-Schema walker, re-exported.
//
// The walker itself moved to `tools/driver/run/schema.ts`: a shipped CLI
// (`tools/driver/run/validate.mjs`) validates with it, and a tool that imports
// its validator out of `tests/**` does not ship — `cp -R src tools data <dir>`
// then running the driver failed on a missing `tests/runloop/schema.ts`.
//
// One definition site, and the import direction is tests → tools. This file
// exists so e8's suites keep their local specifier; there is nothing to see
// here beyond the re-export.
export * from '../../tools/driver/run/schema.ts'
