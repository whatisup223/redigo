const fs = require('fs');
let code = fs.readFileSync('pages/LeadFinder.tsx', 'utf8');

console.log("Original length:", code.length);

// 1. Fix the handleSendToAI key
code = code.replace(/localStorage\.setItem\('redigo_current_lead',/g, "localStorage.setItem('redditgo_current_lead',");

// 2. Update the Wizard Reply button to only use handleSendToAI
code = code.replace(/setSelectedPost\(post\);\s*setIsWizardOpen\(true\);/g, "setSelectedPost(post); handleSendToAI(post);");

// 3. Update the Wizard Reply button text to 'Reply with AI Agent'
code = code.replace(
    /<span>Wizard Reply<\/span>/g,
    '<span>Draft with AI Agent</span>'
);

// Delete the React fragment wrapping the reply wizard Modal?
// The Wizard Overlay is between {/* Reply Wizard Overlay */} and {/* Daily Limit Modal */}
const modalStart = code.indexOf('{/* Reply Wizard Overlay */}');
const limitStart = code.indexOf('{/* Daily Limit Modal */}');
if (modalStart !== -1 && limitStart !== -1) {
    code = code.substring(0, modalStart) + code.substring(limitStart);
    console.log("Removed Wizard Modal Overlay");
}

// The Reply Assistant is within <div className="xl:col-span-4">
const assistantStart = code.indexOf('<div className="xl:col-span-4">');
if (assistantStart !== -1) {
    console.log("Found xl:col-span-4");
    // Find the end of this div manually
    let stack = 0;
    let assistantEnd = -1;
    const matchStr = '<div className="xl:col-span-4">';
    let i = assistantStart + +matchStr.length - 1; // Start inside the tag
    while (i < code.length) {
        if (code.substr(i, 4) === '<div') {
            stack++;
            i += 3;
        } else if (code.substr(i, 6) === '</div') {
            stack--;
            i += 5;
            if (stack === -1) {
                assistantEnd = i + 1;
                break;
            }
        }
        i++;
    }
    if (assistantEnd !== -1) {
        code = code.substring(0, assistantStart) + code.substring(assistantEnd);
        console.log("Removed Reply Assistant");
    }
}

// Optional: fix the grid layout
code = code.replace(/<div className="grid grid-cols-1 xl:grid-cols-12 gap-10">/, '<div className="flex justify-center w-full max-w-5xl mx-auto">');
code = code.replace(/className="xl:col-span-8 space-y-6"/, 'className="space-y-6 w-full"');

fs.writeFileSync('pages/LeadFinder.tsx', code);
console.log("New length:", code.length);
