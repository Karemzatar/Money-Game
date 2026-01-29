
// Home Page Logic

let companyId = sessionStorage.getItem("companyId");
if (!companyId) window.location.href = "index.html";

async function searchCompanies() {
    const q = document.getElementById('companySearch').value;
    const resDiv = document.getElementById('searchResults');
    if (q.length < 2) { resDiv.style.display = 'none'; return; }

    try {
        const res = await fetch(`/api/companies?q=${q}`);
        const data = await res.json();

        resDiv.innerHTML = '';
        resDiv.style.display = 'block';
        if (data.length === 0) {
            resDiv.innerHTML = '<p style="color: #999;">No results.</p>';
            return;
        }

        data.forEach(c => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.style.cursor = 'pointer';
            div.innerHTML = `<b>${c.company}</b> <span style="float:right; color:green;">$${(c.balance || 0).toLocaleString()}</span><br><small>Level ${c.level || 0}</small>`;
            div.onclick = () => window.location.href = `company-details.html?id=${c.id}`;
            resDiv.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

document.getElementById('notificationBtn').addEventListener('click', function () {
    const panel = document.getElementById('notificationPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', function (event) {
    const panel = document.getElementById('notificationPanel');
    const btn = document.getElementById('notificationBtn');
    if (!panel.contains(event.target) && !btn.contains(event.target)) {
        panel.style.display = 'none';
    }
});

async function loadNotifications() {
    try {
        const res = await fetch(`/data/${companyId}`);
        const data = await res.json();
        let count = 0;
        let listHtml = '';

        if (data.partnershipRequests && data.partnershipRequests.length > 0) {
            count += data.partnershipRequests.length;
            listHtml += `<div style="padding:10px;">${data.partnershipRequests.length} Partnership Requests</div>`;
        }
        if (data.locked) {
            count++;
            listHtml += `<div style="padding:10px; color:red;">Account Frozen</div>`;
        }

        const badge = document.getElementById('notificationBadge');
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'flex';
            document.getElementById('notificationList').innerHTML = listHtml;
        } else {
            badge.style.display = 'none';
            document.getElementById('notificationList').innerHTML = '<div style="padding:15px; text-align:center; color:#999;">No notifications</div>';
        }
    } catch (e) { }
}

setInterval(loadNotifications, 30000);
loadNotifications();

function logout() {
    sessionStorage.removeItem("companyId");
    window.location.href = "/";
}

function reloadPage() {
    const reloadBtn = document.querySelector('.reload-btn');
    reloadBtn.innerHTML = '⏳ Reloading...';
    reloadBtn.style.pointerEvents = 'none';

    setTimeout(() => {
        location.reload();
    }, 500);
}

function openTutorial() {
    try {
        if (window.onboardingSystem) {
            window.onboardingSystem.reset();
            window.onboardingSystem.show();
        } else {
            alert('Tutorial system is loading. Please try again in a moment.');
        }
    } catch (e) {
        console.error('Failed to open tutorial', e);
    }
}
