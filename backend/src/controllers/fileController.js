const pool = require('../config/db');
const bucket = require('../config/firebase');

// List all files in Firebase Storage and check if they are garbage files (unreferenced in db)
exports.listFiles = async (req, res) => {
    try {
        if (!bucket) {
            return res.status(200).json({ 
                success: false, 
                message: 'Firebase Storage is disabled (missing credentials/configuration).' 
            });
        }

        const [allFiles] = await bucket.getFiles();
        const files = allFiles.filter(file => !file.name.startsWith('docs/') && file.name !== 'docs');
        
        // Query database to check for file references
        // 1. mous.file_url
        // 2. tasks.description
        // 3. notes.content
        const [mous] = await pool.query('SELECT file_url FROM mous WHERE file_url IS NOT NULL AND is_deleted = 0');
        const [tasks] = await pool.query('SELECT description FROM tasks WHERE description IS NOT NULL AND is_deleted = 0');
        const [notes] = await pool.query('SELECT content FROM notes WHERE content IS NOT NULL AND is_deleted = 0');

        const fileList = files.map(file => {
            const encodedName = encodeURIComponent(file.name);
            const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedName}?alt=media`;
            const size = parseInt(file.metadata.size || 0, 10);
            const updated = file.metadata.updated;
            const contentType = file.metadata.contentType;

            // Extract the base filename to search in database, e.g. "1717540234_document.pdf"
            const pathSegments = file.name.split('/');
            const baseName = pathSegments[pathSegments.length - 1]; 

            // Check reference status
            let isReferenced = false;

            // 1. Check in mous table
            if (mous.some(m => m.file_url === url || m.file_url?.includes(encodedName) || (baseName && m.file_url?.includes(baseName)))) {
                isReferenced = true;
            }

            // 2. Check in tasks table (rich text/description)
            if (!isReferenced && tasks.some(t => t.description?.includes(url) || t.description?.includes(file.name) || (baseName && t.description?.includes(baseName)))) {
                isReferenced = true;
            }

            // 3. Check in notes table (content)
            if (!isReferenced && notes.some(n => n.content?.includes(url) || n.content?.includes(file.name) || (baseName && n.content?.includes(baseName)))) {
                isReferenced = true;
            }

            return {
                name: file.name,
                url,
                size,
                contentType,
                updated,
                isReferenced
            };
        });

        res.status(200).json({ success: true, files: fileList });
    } catch (error) {
        console.error('List Firebase files error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a specific file or folder (recursively) in Firebase Storage
exports.deleteFile = async (req, res) => {
    try {
        if (!bucket) {
            return res.status(400).json({ message: 'Firebase Storage is disabled.' });
        }

        const { filePath, isFolder } = req.body;
        if (!filePath) {
            return res.status(400).json({ message: 'Đường dẫn tệp tin hoặc thư mục (filePath) là bắt buộc.' });
        }

        if (filePath.startsWith('docs/') || filePath === 'docs') {
            return res.status(403).json({ message: 'Không thể xóa thư mục hoặc tệp tin thuộc tài liệu (docs).' });
        }

        if (isFolder) {
            // Delete all files with this prefix
            const [files] = await bucket.getFiles({ prefix: filePath + '/' });
            if (files.length === 0) {
                // If folder is empty, just return success
                return res.status(200).json({ success: true, message: `Thư mục ${filePath} trống.` });
            }

            const deleted = [];
            for (const file of files) {
                await file.delete();
                deleted.push(file.name);
            }
            res.status(200).json({ success: true, message: `Đã xóa thư mục ${filePath} và ${deleted.length} tệp tin thành công.` });
        } else {
            const file = bucket.file(filePath);
            const [exists] = await file.exists();
            if (!exists) {
                return res.status(404).json({ message: 'Tệp tin không tồn tại trên Firebase Storage.' });
            }

            await file.delete();
            res.status(200).json({ success: true, message: `Đã xóa tệp tin ${filePath} thành công.` });
        }
    } catch (error) {
        console.error('Delete Firebase file error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Clean up all garbage files (unreferenced files) in Firebase Storage
exports.cleanupGarbage = async (req, res) => {
    try {
        if (!bucket) {
            return res.status(400).json({ message: 'Firebase Storage is disabled.' });
        }

        const [allFiles] = await bucket.getFiles();
        const files = allFiles.filter(file => !file.name.startsWith('docs/') && file.name !== 'docs');

        const [mous] = await pool.query('SELECT file_url FROM mous WHERE file_url IS NOT NULL AND is_deleted = 0');
        const [tasks] = await pool.query('SELECT description FROM tasks WHERE description IS NOT NULL AND is_deleted = 0');
        const [notes] = await pool.query('SELECT content FROM notes WHERE content IS NOT NULL AND is_deleted = 0');

        const deletedFiles = [];
        const errors = [];

        for (const file of files) {
            const encodedName = encodeURIComponent(file.name);
            const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedName}?alt=media`;
            const pathSegments = file.name.split('/');
            const baseName = pathSegments[pathSegments.length - 1];

            let isReferenced = false;
            if (mous.some(m => m.file_url === url || m.file_url?.includes(encodedName) || (baseName && m.file_url?.includes(baseName)))) {
                isReferenced = true;
            }
            if (!isReferenced && tasks.some(t => t.description?.includes(url) || t.description?.includes(file.name) || (baseName && t.description?.includes(baseName)))) {
                isReferenced = true;
            }
            if (!isReferenced && notes.some(n => n.content?.includes(url) || n.content?.includes(file.name) || (baseName && n.content?.includes(baseName)))) {
                isReferenced = true;
            }

            // If file is garbage (not referenced anywhere), delete it
            if (!isReferenced) {
                try {
                    await file.delete();
                    deletedFiles.push(file.name);
                } catch (err) {
                    console.error(`Failed to delete garbage file ${file.name}:`, err.message);
                    errors.push({ name: file.name, error: err.message });
                }
            }
        }

        res.status(200).json({
            success: true,
            deletedCount: deletedFiles.length,
            deletedFiles,
            errors
        });
    } catch (error) {
        console.error('Cleanup garbage files error:', error);
        res.status(500).json({ message: error.message });
    }
};
