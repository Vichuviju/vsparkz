const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('c:/xampp/htdocs/vsparkz/admin/src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Find all className="..." or className={`...`} that contain 'fixed inset-0'
    // Regex matches className=" ... fixed inset-0 ... "
    content = content.replace(/className=(["'`])([^"'`]*fixed inset-0[^"'`]*)\1/g, (match, quote, classesStr) => {
        let classes = classesStr.split(/\s+/);
        
        // Strip old problematic classes
        classes = classes.filter(c => 
            !c.match(/^z-\d+$/) && 
            !c.match(/^z-\[\d+\]$/) && 
            !c.match(/^bg-black\/\d+$/) &&
            !c.match(/^bg-slate-900\/\d+$/) &&
            c !== 'backdrop-blur-sm'
        );
        
        // Add premium modal classes
        classes.push('z-[9999]', 'bg-slate-900/60', 'backdrop-blur-sm');
        
        // Deduplicate classes
        classes = [...new Set(classes)];
        
        return `className=${quote}${classes.join(' ')}${quote}`;
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Fixed:', file);
    }
});

console.log('Total files updated:', changedCount);
