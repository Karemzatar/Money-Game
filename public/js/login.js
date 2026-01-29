
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            errorDiv.innerText = data.error;
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.innerText = 'Something went wrong.';
        errorDiv.style.display = 'block';
    }
});
