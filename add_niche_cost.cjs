const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'Admin.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the line with the Deep Scan closing /> (around line 2686)
// We look for the pattern: a line with just spaces + '/>' followed by '</label>' then '</div>'
let insertAfterIndex = -1;
for (let i = 2680; i < 2700; i++) {
    const trimmed = (lines[i] || '').trim();
    const nextTrimmed = (lines[i + 1] || '').trim();
    const nextNextTrimmed = (lines[i + 2] || '').trim();
    if (trimmed === '/>' && nextTrimmed === '</label>' && nextNextTrimmed === '</div>') {
        insertAfterIndex = i + 1; // after </label>
        break;
    }
}

if (insertAfterIndex === -1) {
    console.error('Could not find insertion point');
    process.exit(1);
}

const indent = '                                                                     ';
const indentInner = indent + '    ';
const newLines = [
    indent + '<label className="block">',
    indentInner + '<span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Explore Niches \uD83C\uDF10</span>',
    indentInner + '<input',
    indentInner + '    type="number"',
    indentInner + '    min="0"',
    indentInner + '    step="0.5"',
    indentInner + '    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-sm"',
    indentInner + '    value={aiSettings.creditCosts?.nicheExplore ?? 0}',
    indentInner + '    onChange={(e) => {',
    indentInner + '        const val = parseFloat(e.target.value) || 0;',
    indentInner + '        setAiSettings({',
    indentInner + '            ...aiSettings,',
    indentInner + '            creditCosts: {',
    indentInner + '                comment: 1, post: 2, image: 5, fetch: 1, deepScan: 0.5,',
    indentInner + '                ...aiSettings.creditCosts,',
    indentInner + '                nicheExplore: val',
    indentInner + '            }',
    indentInner + '        });',
    indentInner + '    }}',
    indentInner + '/>',
    indentInner + '<p className="text-[9px] text-slate-400 font-medium mt-1">Set 0 to make niche search free</p>',
    indent + '</label>',
];

lines.splice(insertAfterIndex, 0, ...newLines);
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done! Inserted Explore Niches field at line', insertAfterIndex + 1);
