// Tests have no webpack DefinePlugin; api.js reads process.env.API_URL at
// import time, so this must run before test modules load (jest setupFiles).
process.env.API_URL ??= "http://localhost:3000";
