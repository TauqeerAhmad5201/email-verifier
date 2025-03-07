document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('email-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        if (validateEmail(email)) {
            verifyEmail(email);
        } else {
            displayResult('Invalid email format');
        }
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function verifyEmail(email) {
        fetch('/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            displayResult(data.message);
        })
        .catch(error => {
            displayResult('Error verifying email');
            console.error('Error:', error);
        });
    }

    function displayResult(message) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.textContent = message;
    }
});
