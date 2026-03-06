const fs = require('fs');
let code = fs.readFileSync('pages/LeadFinder.tsx', 'utf8');

// The main goal is to remove the unused leftover states and hooks
const statesToRemove = [
    'const [showDraftBanner, setShowDraftBanner] = useState(false);',
    'const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);',
    'const [showBrandOverride, setShowBrandOverride] = useState(false);',
    'const [brandProfile, setBrandProfile] = useState<BrandProfile>({});',
    'const [language, setLanguage] = useState(\'English\');',
    'const [activeTone, setActiveTone] = useState<\'helpful_peer\' | \'thought_leader\' | \'skeptic\' | \'storyteller\'>(\'helpful_peer\');',
    'const [includeBrandName, setIncludeBrandName] = useState(true);',
    'const [includeLink, setIncludeLink] = useState(true);',
    'const [useTracking, setUseTracking] = useState(false);'
];

statesToRemove.forEach(st => {
    code = code.replace(new RegExp(st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n?', 'g'), '');
});

// Remove wizardData state
code = code.replace(/const \[wizardData, setWizardData\] = useState[\s\S]*?\}\);/m, '');

// Remove completely the Extension bridge listener for DEPLOY_RESPONSE
code = code.replace(/\/\/ Extension bridge listener[\s\S]*?window\.removeEventListener\('message', handleMessage\);\s*\}, \[\]\);/m, '');

// Remove Auto-save effect
code = code.replace(/\/\/ Auto-save effect[\s\S]*?useTracking\]\);/m, '');

// Remove handleResumeDraft
code = code.replace(/const handleResumeDraft = \(\) => \{[\s\S]*?syncUser\(\); \/\/ Sync usage state after resuming\s*\}\s*\n\s*\};/m, '');

// Remove handleDiscardDraft block perfectly
const handleDiscardStart = code.indexOf('const handleDiscardDraft = () => {');
if (handleDiscardStart !== -1) {
    let bracketStack = 0;
    let endIdx = -1;
    for (let i = handleDiscardStart; i < code.length; i++) {
        if (code[i] === '{') bracketStack++;
        else if (code[i] === '}') {
            bracketStack--;
            if (bracketStack === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }
    if (endIdx !== -1) {
        code = code.substring(0, handleDiscardStart) + code.substring(endIdx);
    }
}

// Remove the JSX components for Discard Draft Banner/Modal
const discardModalStart = code.indexOf('{/* Discard Draft Confirmation Modal */}');
if (discardModalStart !== -1) {
    const discardModalEndStr = '  )}';
    let endIdx = code.indexOf(discardModalEndStr, discardModalStart);
    if (endIdx !== -1) {
        code = code.substring(0, discardModalStart) + code.substring(endIdx + discardModalEndStr.length + 1);
    }
}

const draftBannerStart = code.indexOf('{/* Draft Banner */}');
if (draftBannerStart !== -1) {
    const creditsBannerStart = code.indexOf('{/* Credits */}');
    if (creditsBannerStart !== -1) {
        code = code.substring(0, draftBannerStart) + code.substring(creditsBannerStart);
    }
}

fs.writeFileSync('pages/LeadFinder.tsx', code);
console.log('Removed leftover drafts, settings, and unused states.');
