document.addEventListener('DOMContentLoaded', () => {
    const dashBtn = document.getElementById('open-dashboard');

    dashBtn.addEventListener('click', () => {
        // Open localhost and production (try both or just localhost for dev)
        chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
    });
});
