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
            
            // Explicit error conditions
            if (data.valid === false || 
                data.disposable === true || 
                (data.details && (!data.details.mxRecords || !data.details.smtpCheck))) {
                resultClass = 'error';
                console.log('Setting error class for:', data);
            } else if (data.valid === true) {
                resultClass = 'success';
            } else if (data.valid === 'risky') {
                resultClass = 'warning';
            } else {
                resultClass = 'info';
            }
            
            displayResult(data.message, resultClass);
            
            // If there are additional details, display them
            if (data.details) {
                const detailsHtml = `
                    <div class="details">
                        <p>${resultClass === 'error' ? '❌' : resultClass === 'warning' ? '⚠️' : '✓'} Score: ${data.score || 'N/A'}</p>
                        ${data.details.disposable ? `<p class="detail-${resultClass}">⚠️ Disposable email detected</p>` : ''}
                        ${data.details.webmail ? '<p>📧 Webmail address</p>' : ''}
                        ${!data.details.mxRecords ? `<p class="detail-error">❌ No MX records found</p>` : ''}
                        ${!data.details.smtpCheck ? `<p class="detail-error">❌ Failed SMTP check</p>` : ''}
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
        
        // First, clear any previous content and classes
        resultsDiv.innerHTML = '';
        resultsDiv.className = '';
        
        // Create a strong element for the message
        const messageElement = document.createElement('strong');
        messageElement.textContent = message;
        resultsDiv.appendChild(messageElement);
        
        // Add appropriate class - force it to be applied
        if (resultClass) {
            resultsDiv.classList.add(resultClass);
            console.log('Applied class:', resultClass); // Debug output
            
            // For errors, add an extra visual indicator
            if (resultClass === 'error') {
                const icon = document.createElement('span');
                icon.innerHTML = '❌ ';
                icon.style.color = '#dc3545';
                resultsDiv.insertBefore(icon, messageElement);
            }
        }
    }
    
    function appendDetails(detailsHtml) {
        const resultsDiv = document.getElementById('results');
        const detailsDiv = document.createElement('div');
        detailsDiv.innerHTML = detailsHtml;
        resultsDiv.appendChild(detailsDiv);
    }
});
