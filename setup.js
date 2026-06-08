/**
 * VLU Enterprise Link Manager Setup Script
 * Runs with Node.js standard libraries to bootstrap the project.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m%s\x1b[0m',     // Cyan
        success: '\x1b[32m%s\x1b[0m',  // Green
        warning: '\x1b[33m%s\x1b[0m',  // Yellow
        error: '\x1b[31m%s\x1b[0m'     // Red
    };
    console.log(colors[type] || '%s', message);
}

async function run() {
    log('=== VLU Enterprise Link Manager - Setup Wizard ===\n', 'info');

    // 1. Setup Backend Environment (.env)
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    const backendEnvSamplePath = path.join(__dirname, 'backend', '.envsample');

    if (!fs.existsSync(backendEnvPath)) {
        log('Setting up backend environment (.env)...', 'info');
        if (fs.existsSync(backendEnvSamplePath)) {
            let sampleContent = fs.readFileSync(backendEnvSamplePath, 'utf8');
            
            // Generate a random JWT secret
            const jwtSecret = crypto.randomBytes(32).toString('hex');
            sampleContent = sampleContent.replace('JWT_SECRET=', `JWT_SECRET=${jwtSecret}`);
            
            fs.writeFileSync(backendEnvPath, sampleContent, 'utf8');
            log('✔ Created backend/.env with a generated JWT_SECRET.', 'success');
        } else {
            log('⚠ backend/.envsample not found! Creating default .env.', 'warning');
            const defaultEnv = [
                'PORT=5000',
                'DB_HOST=localhost',
                'DB_USER=root',
                'DB_PASSWORD=',
                'DB_NAME=vlu_enterprise_link',
                `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`,
                'GEMINI_API_KEY=',
                'GEMINI_API_KEYS=',
                'FIREBASE_STORAGE_BUCKET='
            ].join('\n');
            fs.writeFileSync(backendEnvPath, defaultEnv, 'utf8');
            log('✔ Created backend/.env with default settings.', 'success');
        }
    } else {
        log('✔ backend/.env already exists. Skipping setup.', 'success');
    }

    // 2. Setup Frontend Environment (.env)
    const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
    if (!fs.existsSync(frontendEnvPath)) {
        log('Setting up frontend environment (.env)...', 'info');
        fs.writeFileSync(frontendEnvPath, 'VITE_API_URL=\n', 'utf8');
        log('✔ Created frontend/.env with default VITE_API_URL.', 'success');
    } else {
        log('✔ frontend/.env already exists. Skipping setup.', 'success');
    }

    // 3. Install Dependencies
    log('\nInstalling backend dependencies...', 'info');
    try {
        execSync('npm install', { 
            cwd: path.join(__dirname, 'backend'), 
            stdio: 'inherit',
            shell: true
        });
        log('✔ Backend dependencies installed successfully.', 'success');
    } catch (err) {
        log('❌ Failed to install backend dependencies: ' + err.message, 'error');
        process.exit(1);
    }

    log('\nInstalling frontend dependencies...', 'info');
    try {
        execSync('npm install', { 
            cwd: path.join(__dirname, 'frontend'), 
            stdio: 'inherit',
            shell: true
        });
        log('✔ Frontend dependencies installed successfully.', 'success');
    } catch (err) {
        log('❌ Failed to install frontend dependencies: ' + err.message, 'error');
        process.exit(1);
    }

    // 4. Database initialization
    log('\n=== Database Migration & Seeding ===', 'info');
    log('Do you want to initialize the local MySQL database? (This will recreate the database and tables).', 'warning');
    log('Press Ctrl+C to cancel if database server is not running locally.', 'warning');
    log('Initializing database in 3 seconds...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        log('\n[1/2] Running migrations (database.sql)...', 'info');
        execSync('node backend/migrations/run-sql.js', { 
            cwd: __dirname, 
            stdio: 'inherit',
            shell: true
        });
        log('✔ Database and tables set up successfully.', 'success');

        log('\n[2/2] Running consolidated database seeder (seed.js)...', 'info');
        execSync('node backend/seed.js', { 
            cwd: __dirname, 
            stdio: 'inherit',
            shell: true
        });
        log('✔ Database seeded with rich multi-faculty mock data successfully.', 'success');

        log('\n======================================================', 'success');
        log('✔ SETUP COMPLETED SUCCESSFULLY!', 'success');
        log('======================================================', 'success');
        log('\nTo run the application locally:', 'info');
        log('  1. Start backend: npm run dev (in backend folder)', 'info');
        log('  2. Start frontend: npm run dev (in frontend folder)', 'info');
        log('\nTo run the application via Docker Compose:', 'info');
        log('  docker compose up --build -d', 'info');
        log('\nAccess the application at: http://localhost:8080', 'info');
        log('======================================================\n', 'success');

    } catch (dbErr) {
        log('\n⚠ Database setup encountered issues: ' + dbErr.message, 'warning');
        log('Please check your local MySQL connection settings in backend/.env and run steps manually:', 'warning');
        log('  1. node backend/migrations/run-sql.js', 'warning');
        log('  2. node backend/seed.js\n', 'warning');
    }
}

run();
