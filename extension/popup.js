document.addEventListener('DOMContentLoaded', () => {
    const dashBtn = document.getElementById('open-dashboard');

    dashBtn.addEventListener('click', () => {
        // Check if we are on localhost or production - default to production for users
        const dashboardUrl = 'https://redditgo.online/dashboard';
        chrome.tabs.create({ url: dashboardUrl });
    });
});
