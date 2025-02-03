document.getElementById('emailForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData();
    formData.append('emails', document.getElementById('emails').value);
    formData.append('subject', document.getElementById('subject').value);
    formData.append('content', document.getElementById('content').value);
    
    const csvFile = document.getElementById('csvFile').files[0];
    if (csvFile) {
        formData.append('csvFile', csvFile);
    }

    // Basic validation
    if (!formData.get('emails') && !csvFile) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please enter emails or upload a CSV file',
            confirmButtonColor: '#da22ff'
        });
        return;
    }

    // Show loading state
    const sendButton = document.getElementById('sendButton');
    sendButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
    sendButton.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/send-email', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Emails have been sent successfully',
                confirmButtonColor: '#da22ff'
            });
        } else {
            throw new Error(result.message || 'Failed to send emails');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to send emails',
            confirmButtonColor: '#da22ff'
        });
    } finally {
        sendButton.innerHTML = 'Send Email';
        sendButton.disabled = false;
    }
}); 