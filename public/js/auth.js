document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginCard = document.getElementById('loginCard');
    const signupCard = document.getElementById('signupCard');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Toggle between forms         
    showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        loginCard.style.display = 'none';
        signupCard.style.display = 'block';
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        signupCard.style.display = 'none';
        loginCard.style.display = 'block';
    });

    // Login Form Handling
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMessage = document.getElementById('loginErrorMessage');

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirectUrl;
            } else {
                errorMessage.textContent = data.message || 'Login failed';
                errorMessage.style.display = 'block';
            }
        } catch (err) {
            errorMessage.textContent = 'Connection error. Please try again.';
            errorMessage.style.display = 'block';
        }
    });

    // Signup Form Handling
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const role = document.querySelector('input[name="role"]:checked').value;
        const errorMessage = document.getElementById('signupErrorMessage');

        // Client-side validation
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            errorMessage.style.display = 'block';
            return;
        }

        if (password.length < 8) {
            errorMessage.textContent = 'Password must be at least 8 characters';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirectUrl;
            } else {
                errorMessage.textContent = data.message || 'Signup failed';
                errorMessage.style.display = 'block';
            }
        } catch (err) {
            errorMessage.textContent = 'Connection error. Please try again.';
            errorMessage.style.display = 'block';
        }
    });
});
