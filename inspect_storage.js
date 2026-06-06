require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/src/config/db');
const bucket = require('./backend/src/config/firebase');

async function inspect() {
    try {
        if (!bucket) {
            console.error('Firebase Storage not configured.');
            process.exit(1);
        }
        
        console.log('Fetching files from Firebase Storage bucket:', bucket.name);
        const [files] = await bucket.getFiles();
        console.log(`Found ${files.length} files in Firebase Storage.`);

        const [mous] = await pool.query('SELECT file_url, mou_code FROM mous WHERE is_deleted = 0');
        const [tasks] = await pool.query('SELECT description, title FROM tasks WHERE is_deleted = 0');
        const [notes] = await pool.query('SELECT content, title FROM notes WHERE is_deleted = 0');
        const [activities] = await pool.query('SELECT detail, title FROM activities WHERE is_deleted = 0');

        console.log('\n--- MOUs in DB ---');
        mous.forEach(m => console.log(`Code: ${m.mou_code}, URL: ${m.file_url}`));

        console.log('\n--- Firebase Files Check ---');
        files.forEach(file => {
            const encodedName = encodeURIComponent(file.name);
            const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedName}?alt=media`;
            const pathSegments = file.name.split('/');
            const baseName = pathSegments[pathSegments.length - 1];

            let isReferenced = false;
            let refInfo = '';

            // Check MOU
            const mouRef = mous.find(m => m.file_url === url || m.file_url?.includes(encodedName) || (baseName && m.file_url?.includes(baseName)));
            if (mouRef) {
                isReferenced = true;
                refInfo += `[MOU: ${mouRef.mou_code}] `;
            }

            // Check Task
            const taskRef = tasks.find(t => t.description?.includes(url) || t.description?.includes(file.name) || (baseName && t.description?.includes(baseName)));
            if (taskRef) {
                isReferenced = true;
                refInfo += `[Task: ${taskRef.title}] `;
            }

            // Check Note
            const noteRef = notes.find(n => n.content?.includes(url) || n.content?.includes(file.name) || (baseName && n.content?.includes(baseName)));
            if (noteRef) {
                isReferenced = true;
                refInfo += `[Note: ${noteRef.title}] `;
            }

            // Check Activity
            const actRef = activities.find(a => a.detail?.includes(url) || a.detail?.includes(file.name) || (baseName && a.detail?.includes(baseName)));
            if (actRef) {
                isReferenced = true;
                refInfo += `[Activity: ${actRef.title}] `;
            }

            console.log(`- ${file.name} (Size: ${file.metadata.size} B): ${isReferenced ? 'REFERENCED ' + refInfo : 'GARBAGE'}`);
        });

        process.exit(0);
    } catch (e) {
        console.error('Inspection error:', e);
        process.exit(1);
    }
}

inspect();
