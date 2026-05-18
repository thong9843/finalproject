const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend', 'src', 'pages');
const componentsPath = path.join(__dirname, 'frontend', 'src', 'components');

const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it has Modal.confirm
    if (!content.includes('Modal.confirm')) return;

    // Add App as AntApp import
    if (content.includes("from 'antd'")) {
        if (!content.includes('App as AntApp') && !content.includes('AntApp')) {
            content = content.replace(/from\s+'antd'/, ", App as AntApp } from 'antd'");
            content = content.replace(/}\s*,\s*App as AntApp/, ", App as AntApp }");
            // Fix double closing bracket if it happened
            content = content.replace(/}\s*,\s*App as AntApp\s*}/, ", App as AntApp }");
        }
    }

    // Inject const { modal } = AntApp.useApp(); after component declaration
    // We look for "const [something] = useState" or "const form = Form.useForm()" as an anchor
    if (!content.includes('const { modal } = AntApp.useApp()')) {
        content = content.replace(/(const\s+\[[a-zA-Z0-9_]+,\s*set[a-zA-Z0-9_]+\]\s*=\s*useState.*?;)/, "$1\n    const { modal } = AntApp.useApp();");
    }

    // Replace Modal.confirm with modal.confirm
    content = content.replace(/Modal\.confirm/g, 'modal.confirm');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
};

const walkSync = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walkSync(filepath);
        } else if (stats.isFile() && filepath.endsWith('.jsx')) {
            processFile(filepath);
        }
    });
};

walkSync(directoryPath);
walkSync(componentsPath);
console.log('Done');
