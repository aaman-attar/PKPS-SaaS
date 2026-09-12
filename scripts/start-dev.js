const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// Find valid python executable
function findPython() {
  const candidates = [
    path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe'),
    path.join(ROOT_DIR, '.venv', 'bin', 'python'),
    path.join(BACKEND_DIR, 'venv', 'Scripts', 'python.exe'),
    path.join(BACKEND_DIR, 'venv', 'bin', 'python'),
    'python',
    'python3',
  ];

  for (const candidate of candidates) {
    if (candidate.endsWith('.exe') || candidate.includes(path.sep)) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } else {
      try {
        execSync(`${candidate} --version`, { stdio: 'ignore' });
        return candidate;
      } catch (e) {
        // Not found
      }
    }
  }
  return 'python';
}

const pythonExec = findPython();
console.log(`\x1b[36m[Orchestrator]\x1b[0m Using Python executable: ${pythonExec}`);

// Step 1: Run Database Migrations
console.log(`\x1b[36m[Orchestrator]\x1b[0m Running backend database migrations...`);
try {
  execSync(`"${pythonExec}" manage.py migrate`, {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
  });
  console.log(`\x1b[32m[Orchestrator]\x1b[0m Database migrations up to date.`);
} catch (err) {
  console.error(`\x1b[31m[Orchestrator]\x1b[0m Migration warning or error. Continuing server startup...`);
}

// Step 2: Spawn Django Backend
console.log(`\x1b[36m[Orchestrator]\x1b[0m Starting Django backend server on port 8000...`);
const backendProcess = spawn(pythonExec, ['manage.py', 'runserver', '8000'], {
  cwd: BACKEND_DIR,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

backendProcess.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[Backend]\x1b[0m ${data.toString()}`);
});

backendProcess.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[34m[Backend]\x1b[0m ${data.toString()}`);
});

let frontendProcess = null;
let backendReady = false;

// Step 3: Poll Backend Health Check
function checkBackendHealth(retries = 0) {
  if (backendReady) return;

  const req = http.get('http://127.0.0.1:8000/api/health/', (res) => {
    if (res.statusCode === 200) {
      backendReady = true;
      console.log(`\n\x1b[32m[Orchestrator] Backend is LIVE and healthy!\x1b[0m`);
      startFrontend();
    } else {
      retryHealthCheck(retries);
    }
  });

  req.on('error', () => {
    retryHealthCheck(retries);
  });

  req.end();
}

function retryHealthCheck(retries) {
  if (retries % 5 === 0) {
    console.log(`\x1b[36m[Orchestrator]\x1b[0m Waiting for backend server readiness... (${retries * 0.5}s)`);
  }
  setTimeout(() => checkBackendHealth(retries + 1), 500);
}

// Step 4: Start Frontend Server when Backend is ready
function startFrontend() {
  console.log(`\x1b[36m[Orchestrator]\x1b[0m Starting React Frontend (Vite)...`);
  frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  frontendProcess.stdout.on('data', (data) => {
    process.stdout.write(`\x1b[35m[Frontend]\x1b[0m ${data.toString()}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    process.stderr.write(`\x1b[35m[Frontend]\x1b[0m ${data.toString()}`);
  });
}

// Start polling
checkBackendHealth();

// Handle graceful process cleanup on exit
function cleanup() {
  console.log(`\n\x1b[36m[Orchestrator]\x1b[0m Shutting down servers...`);
  if (backendProcess) {
    try { process.kill(-backendProcess.pid); } catch (e) { backendProcess.kill(); }
  }
  if (frontendProcess) {
    try { process.kill(-frontendProcess.pid); } catch (e) { frontendProcess.kill(); }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
