// Tests have no webpack DefinePlugin; api.js reads process.env.API_URL at
// import time, so this must run before test modules load (jest setupFiles).
process.env.API_URL ??= "http://localhost:3000";

// Jest's jsdom environment doesn't expose Node's TextEncoder/TextDecoder,
// which react-router requires at import time.
const { TextDecoder, TextEncoder } = require("node:util");
globalThis.TextEncoder ??= TextEncoder;
globalThis.TextDecoder ??= TextDecoder;
