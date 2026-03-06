const fs = require('fs');
let code = fs.readFileSync('pages/LeadFinder.tsx', 'utf8');

// The main goal is to remove the state variables and their effect hooks
const statesToRemove = [
    'const [isGenerating, setIsGenerating] = useState(false);',
    'const [isGeneratingImage, setIsGeneratingImage] = useState(false);',
    'const [generatedReply, setGeneratedReply] = useState<GeneratedReply | null>(null);',
    'const [editedComment, setEditedComment] = useState(\'\');',
    'const [commentImagePrompt, setCommentImagePrompt] = useState(\'\');',
    'const [commentImageUrl, setCommentImageUrl] = useState(\'\');',
    'const [imageLoaded, setImageLoaded] = useState(false);',
    'const [includeImage, setIncludeImage] = useState(false);',
    'const [isPosting, setIsPosting] = useState(false);',
    'const [isWizardOpen, setIsWizardOpen] = useState(false);',
    'const [wizardStep, setWizardStep] = useState(1);',
    'const [showRegenConfirm, setShowRegenConfirm] = useState(false);',
    'const [regenMode, setRegenMode] = useState<\'text\' | \'image\' | \'both\'>(\'text\');',
    'const [refinePrompt, setRefinePrompt] = useState(\'\');',
    'const [activeIntentFilter, setActiveIntentFilter] = useState<string>(\'All\');',
];

statesToRemove.forEach(st => {
    code = code.replace(st + '\n', '');
    code = code.replace(st + '\r\n', '');
    code = code.replace(st, '');
});

// We can remove the handles because they are no longer used anywhere in the JSX since it's deleted.
// `triggerCommentImageGeneration`, `handleGenerate`, `handleRefine`, `handlePost`, `handleDownloadImage`.
const functionsToRemove = [
    'triggerCommentImageGeneration',
    'handleGenerate',
    'handleRefine',
    'handlePost',
    'handleDownloadImage'
];

functionsToRemove.forEach(fn => {
    const startMatch = `const ${fn} = async `;
    let startIdx = code.indexOf(startMatch);
    if (startIdx !== -1) {
        let stack = 0;
        let endIdx = -1;
        // simple brace matching
        for (let i = startIdx; i < code.length; i++) {
            if (code[i] === '{') stack++;
            else if (code[i] === '}') {
                stack--;
                if (stack === 0) {
                    endIdx = i + 1;
                    break;
                }
            }
        }
        if (endIdx !== -1) {
            code = code.substring(0, Math.max(0, startIdx - 1)) + code.substring(endIdx);
        }
    }
});

fs.writeFileSync('pages/LeadFinder.tsx', code);
console.log('Removed dead states and functions.');
