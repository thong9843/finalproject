const fs = require('fs');
const path = require('path');
const dirs = ['frontend/src/pages', 'frontend/src/components'];

dirs.forEach(dir => {
    const fullDir = path.join(__dirname, dir);
    const files = fs.readdirSync(fullDir);
    files.forEach(file => {
        if (file.endsWith('.jsx')) {
            const fp = path.join(fullDir, file);
            let c = fs.readFileSync(fp, 'utf8');
            let updated = false;

            // Fix "} } from 'antd'"
            if (c.includes("} } from 'antd'") || c.includes("} } from \"antd\"")) {
                c = c.replace(/}\s*}\s*from\s*['"]antd['"]/, "} from 'antd'");
                updated = true;
            }

            // Also fix ", App as AntApp } }" if it exists
            if (c.includes(", App as AntApp } }")) {
                c = c.replace(/,\s*App as AntApp\s*}\s*}/, ", App as AntApp }");
                updated = true;
            }

            // Also check for ", App as AntApp } } from"
            if (c.includes(", App as AntApp } } from")) {
                c = c.replace(/,\s*App as AntApp\s*}\s*}\s*from/, ", App as AntApp } from");
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(fp, c, 'utf8');
                console.log('Fixed', fp);
            }
        }
    });
});
