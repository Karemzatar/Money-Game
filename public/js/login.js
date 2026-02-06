const form = document.getElementById('loginForm');
const errorDiv = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }) // استخدم username هنا
        });

        const data = await res.json();

        if (!res.ok) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = data.error || 'Login failed';
            return;
        }

        // إذا تسجيل الدخول ناجح، روح للصفحة الرئيسية أو لوحة الأدمن حسب الدور
        if (data.success) {
            window.location.href = '/'; // أو '/admin.html' إذا admin
        }

    } catch (err) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Server error. Try again later.';
        console.error(err);
    }
});
