/**
 * Patch for typeorm-uml
 * 
 * This script fixes an issue where `relationMetadata` can be undefined, causing the diagram generation to fail when running `yarn db:diagram`.
 * It handles the error: TypeError: Cannot read properties of undefined (reading 'isOneToOne')
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/typeorm-uml/lib/builder/uml-builder.class.js');

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const target = 'if (columns.length === 1 && columns[0].relationMetadata.isOneToOne)';
    const replacement = 'if (columns.length === 1 && columns[0].relationMetadata && columns[0].relationMetadata.isOneToOne)';

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully patched typeorm-uml.');
    } else {
        if (content.includes(replacement)) {
            console.log('typeorm-uml already patched.');
        } else {
            console.log('Target string not found in typeorm-uml.');
            // Fallback for potential whitespace differences
            const looseTarget = /if\s*\(\s*columns\.length\s*===\s*1\s*&&\s*columns\[0\]\.relationMetadata\.isOneToOne\s*\)/;
            if (looseTarget.test(content)) {
                content = content.replace(looseTarget, (match) => {
                    return match.replace('columns[0].relationMetadata.isOneToOne', 'columns[0].relationMetadata && columns[0].relationMetadata.isOneToOne');
                });
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Successfully patched typeorm-uml (loose match).');
            } else {
                console.log('Target string really not found.');
            }
        }
    }
} else {
    console.log('typeorm-uml file not found.');
}
