
// Idle Gameplay Effects
console.log('🎮 Idle gameplay system ready');

// Tip mechanism
const tips = [
    "Tip: Offline earnings are calculated based on your Click Income.",
    "Tip: Upgrade companies to increase both Active and Offline income.",
    "Tip: Watch ads to get a temporary multiplier!",
    "Tip: Daily rewards increase with your streak."
];

let tipIndex = 0;

setInterval(() => {
    if (Math.random() > 0.7 && window.notifications) {
        window.notifications.info(tips[tipIndex], 4000);
        tipIndex = (tipIndex + 1) % tips.length;
    }
}, 60000);
