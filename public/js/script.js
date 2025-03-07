document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('email-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        if (validateEmail(email)) {
            verifyEmail(email);
        } else {
            displayResult('Invalid email format', 'error');
        }
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function verifyEmail(email) {
        // Show loading state
        displayResult('Verifying email...', 'loading');
        
        fetch('/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            let resultClass;
            
            if (data.valid === true) {
                resultClass = 'success';
            } else if (data.valid === 'risky') {
                resultClass = 'warning';
            } else if (data.valid === 'unknown') {
                resultClass = 'info';
            } else {
                resultClass = 'error';
            }
            
            displayResult(data.message, resultClass);
            
            // If there are additional details, display them
            if (data.details) {
                const detailsHtml = `
                    <div class="details">
                        <p>Score: ${data.score || 'N/A'}</p>
                        ${data.details.disposable ? '<p>⚠️ Disposable email</p>' : ''}
                        ${data.details.webmail ? '<p>Webmail address</p>' : ''}
                        ${!data.details.mxRecords ? '<p>⚠️ No MX records</p>' : ''}
                    </div>
                `;
                appendDetails(detailsHtml);
            }
        })
        .catch(error => {
            displayResult('Error verifying email', 'error');
            console.error('Error:', error);
        });
    }

    function displayResult(message, resultClass) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.textContent = message;
        
        // Reset classes
        resultsDiv.classList.remove('success', 'warning', 'error', 'info', 'loading');
        
        // Add appropriate class
        if (resultClass) {
            resultsDiv.classList.add(resultClass);
        }
    }
    
    function appendDetails(detailsHtml) {
        const resultsDiv = document.getElementById('results');
        const detailsDiv = document.createElement('div');
        detailsDiv.innerHTML = detailsHtml;
        resultsDiv.appendChild(detailsDiv);
    }
});
