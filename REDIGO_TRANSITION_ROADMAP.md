# Redigo Deep Cleanup & Transition Roadmap

This document outlines the step-by-step plan for removing the legacy Reddit OAuth integration and transitioning fully to the Extension-based model.

## Phase 1: Backend Sanitization
- [x] **Remove OAuth Routes**: Delete `/api/auth/reddit/url` and `/api/auth/reddit/callback` from `server/index.js`.
- [x] **Cleanup Token Logic**: Remove `userRedditTokens` memory management and the `getValidToken` helper function.
- [x] **Data Model Update**: Update `server/models.js` and `server/index.js` to stop using `connectedAccounts`.
- [x] **Verification**: Ensure the server restarts successfully and no other API endpoints are broken.

## Phase 2: Admin Panel Evolution
- [ ] **Reddit Configuration Pivot**: 
    - Remove `clientId`, `clientSecret`, `redirectUri` from the Admin UI.
    - Add `redditFetchCooldown` field to the Global Settings/AI Configuration section.
- [ ] **Plan Management Cleanup**: Remove the `Max Accounts` field from the Plan editing modal and table.
- [ ] **Verification**: Confirm that Admin settings save correctly to MongoDB and reflect the new schema.

## Phase 3: User Interface Transformation
- [ ] **Settings Page Cleanup**:
    - Remove the "Connect Reddit Account" button and the red "Reddit Not Linked" alerts.
    - Implement the "Extension Status" card that checks for extension connectivity (Ping/Pong).
- [ ] **Dashboard Cleanup**: Remove any UI elements showing linked Reddit accounts/icons.
- [ ] **Verification**: Ensure the user experience is focused entirely on the extension status.

## Phase 4: Dynamic Search Integration
- [ ] **Comments Page Update**:
    - Fetch the `redditFetchCooldown` value from the backend settings.
    - Replace the hardcoded 30-second cooldown in `pages/Comments.tsx` with the dynamic value from the server.
- [ ] **Verification**: Test the search button cooldown to ensure it follows the Admin-defined limit.

## Phase 5: Final Verification & Audit
- [ ] **Code Audit**: Search the entire codebase for any remaining `reddit` API strings or unused OAuth variables.
- [ ] **E2E Testing**: Perform a full "Search -> Generate -> Post" flow to ensure the new model works perfectly without the old backend dependencies.
- [ ] **Final Report**: Generate a summary of all changes and confirmed stability.

---
> [!IMPORTANT]
> Each step must be followed by a manual check of the terminal logs and browser console to ensure zero regressions.
