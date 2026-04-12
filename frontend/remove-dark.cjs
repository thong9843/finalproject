const fs = require('fs');
const path = require('path');

const traverseAndReplace = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseAndReplace(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalContent = content;
            // Remove 'dark:xxx' classes
            content = content.replace(/\s*dark:[a-zA-Z0-9\-\[\]\#\_]+/g, '');
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
};

traverseAndReplace(path.join(__dirname, 'src'));
console.log('Done.');