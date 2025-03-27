document.addEventListener('DOMContentLoaded', function() {
    // Add button loading state animations
    const verifyButton = document.getElementById('verify-button');
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email');
    
    // Dark mode toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use the system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        updateToggleIcon(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateToggleIcon(false);
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        updateToggleIcon(isDarkMode);
        
        // Add toggle animation
        const thumb = themeToggle.querySelector('.toggle-thumb');
        thumb.style.animation = 'none';
        // Force reflow
        void thumb.offsetWidth;
        thumb.style.animation = 'toggleIn 0.3s';
    });
    
    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                updateToggleIcon(true);
            } else {
                document.body.classList.remove('dark-mode');
                updateToggleIcon(false);
            }
        }
    });
    
    function updateToggleIcon(isDarkMode) {
        const iconElement = themeToggle.querySelector('.toggle-icon');
        if (isDarkMode) {
            iconElement.classList.remove('fa-sun');
            iconElement.classList.add('fa-moon');
        } else {
            iconElement.classList.remove('fa-moon');
            iconElement.classList.add('fa-sun');
        }
    }
    
    // Add focus animation for input
    emailInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    emailInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
    
    // Form submission handler
    emailForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = emailInput.value;
        
        if (validateEmail(email)) {
            animateButtonToLoading();
            verifyEmail(email);
        } else {
            displayResult('Invalid email format. Please check and try again.', 'error');
            shakeElement(emailInput.parentElement);
        }
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    
    function animateButtonToLoading() {
        verifyButton.disabled = true;
        verifyButton.innerHTML = '<span class="loading-text">Verifying <span class="dots">...</span></span>';
        verifyButton.classList.add('loading');
        
        // Add animated dots
        const dots = document.querySelector('.dots');
        let dotCount = 0;
        
        const dotInterval = setInterval(() => {
            dots.textContent = '.'.repeat((dotCount % 3) + 1);
            dotCount++;
        }, 300);
        
        // Store the interval ID on the button to clear it later
        verifyButton.dotInterval = dotInterval;
    }
    
    function resetButton() {
        // Clear the dot animation interval if it exists
        if (verifyButton.dotInterval) {
            clearInterval(verifyButton.dotInterval);
        }
        
        verifyButton.disabled = false;
        verifyButton.innerHTML = '<span>Verify Email</span><i class="fas fa-arrow-right"></i>';
        verifyButton.classList.remove('loading');
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
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            resetButton();
            
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
            
            // If there are additional details, display them with a slight delay for animation
            if (data.details) {
                setTimeout(() => {
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
                }, 300);
            }
        })
        .catch(error => {
            resetButton();
            displayResult('Error verifying email: ' + error.message, 'error');
            console.error('Error:', error);
        });
    }

    function displayResult(message, resultClass) {
        const resultsDiv = document.getElementById('results');
        
        // First, clear any previous content and classes
        resultsDiv.innerHTML = '';
        resultsDiv.className = '';
        
        // Add appropriate class for styling
        if (resultClass) {
            resultsDiv.classList.add(resultClass);
        }
        
        // Handle loading state
        if (resultClass === 'loading') {
            resultsDiv.innerHTML = `
                <div class="loading-indicator">
                    <span class="loading-text">${message}</span>
                </div>
            `;
        } else {
            // For other states, create more detailed output
            let icon = '';
            
            switch(resultClass) {
                case 'success':
                    icon = '<i class="fas fa-check-circle"></i> ';
                    break;
                case 'error':
                    icon = '<i class="fas fa-times-circle"></i> ';
                    break;
                case 'warning':
                    icon = '<i class="fas fa-exclamation-triangle"></i> ';
                    break;
                case 'info':
                    icon = '<i class="fas fa-info-circle"></i> ';
                    break;
            }
            
            resultsDiv.innerHTML = `
                <div class="result-content">
                    ${icon}<strong>${message}</strong>
                </div>
            `;
        }
        
        // Show the results div with animation
        resultsDiv.style.display = 'block';
        
        // Force a reflow before adding the fade-in class
        void resultsDiv.offsetWidth;
        
        // If results were previously hidden, animate them in
        if (resultsDiv.classList.contains('hidden')) {
            resultsDiv.classList.remove('hidden');
        }
    }
    
    function appendDetails(detailsHtml) {
        const resultsDiv = document.getElementById('results');
        const detailsDiv = document.createElement('div');
        detailsDiv.innerHTML = detailsHtml;
        detailsDiv.style.opacity = '0';
        resultsDiv.appendChild(detailsDiv);
        
        // Animate the details in
        setTimeout(() => {
            detailsDiv.style.transition = 'opacity 0.3s ease';
            detailsDiv.style.opacity = '1';
        }, 10);
    }
    
    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
    
    // Add keyframe animation for shake effect if not already in CSS
    if (!document.querySelector('#shake-animation')) {
        const style = document.createElement('style');
        style.id = 'shake-animation';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            .shake {
                animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add interactive animations for features
    const features = document.querySelectorAll('.feature');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                featureObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    features.forEach(feature => {
        featureObserver.observe(feature);
    });
});
