// Initialize form elements
let editModal, editForm, editPrisonerId, editFirstName, editLastName, editAge, editGender, editCellNumber, editCrime, editSentence, editSeverity;

function initializeFormElements() {
    console.log('Initializing form elements...');
    
    // Get modal and form elements
    editModal = document.getElementById('editPrisonerModal');
    editForm = document.getElementById('editPrisonerForm');
    
    if (!editModal || !editForm) {
        console.error('Edit modal or form not found');
        return false;
    }
    
    // Get form fields
    editPrisonerId = document.getElementById('editPrisonerId');
    editFirstName = document.getElementById('editFirstName');
    editLastName = document.getElementById('editLastName');
    editAge = document.getElementById('editAge');
    editGender = document.getElementById('editGender');
    editCellNumber = document.getElementById('editCellNumber');
    editCrime = document.getElementById('editCrime');
    editSentence = document.getElementById('editSentence');
    editSeverity = document.getElementById('editSeverity');
    
    // Check if all form fields are found
    const formFields = [
        editPrisonerId, editFirstName, editLastName, editAge,
        editGender, editCellNumber, editCrime, editSentence, editSeverity
    ];
    
    const missingFields = formFields.filter(field => !field);
    if (missingFields.length > 0) {
        console.error('Some form fields are missing:', missingFields.map(field => field?.id));
        return false;
    }
    
    // Add form submit handler
    editForm.addEventListener('submit', handleEditSubmit);
    
    console.log('Form elements initialized successfully');
    return true;
}

// Retry initialization with a maximum number of attempts
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 10;

function retryInitialization() {
    if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
        console.error('Maximum initialization attempts reached. Please check if the modal HTML is properly loaded.');
        return;
    }
    
    initializationAttempts++;
    console.log(`Initializing form elements (attempt ${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS})...`);
    
    if (!initializeFormElements()) {
        console.log(`Failed to initialize form elements (attempt ${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS}), retrying in 100ms...`);
        setTimeout(retryInitialization, 100);
    } else {
        initializationAttempts = 0; // Reset attempts counter on success
    }
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', retryInitialization);

// Fetch and display prisoners
async function fetchAndDisplayPrisoners() {
    try {
        const response = await fetch('http://localhost:3000/api/prisoners');
        const prisoners = await response.json();
        
        const tableBody = document.querySelector('#prisonerTable tbody');
        tableBody.innerHTML = '';
        
        prisoners.forEach(prisoner => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2">${prisoner.prisonerId || prisoner._id}</td>
                <td class="px-4 py-2">${prisoner.firstName} ${prisoner.lastName}</td>
                <td class="px-4 py-2">${calculateAge(prisoner.dateOfBirth)}</td>
                <td class="px-4 py-2">${prisoner.gender}</td>
                <td class="px-4 py-2">${prisoner.cellNumber}</td>
                <td class="px-4 py-2">${prisoner.crime}</td>
                <td class="px-4 py-2">${prisoner.sentence}</td>
                <td class="px-4 py-2">
                    <button onclick="editPrisoner('${prisoner._id}')" class="btn-info mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deletePrisoner('${prisoner._id}')" class="btn-info bg-red-600 hover:bg-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching prisoners:', error);
    }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

// Edit prisoner
function editPrisoner(id) {
    console.log('Redirecting to edit page for prisoner:', id);
    window.location.href = `edit-prisoner.html?id=${id}`;
}

// Edit staff member
function editStaff(id) {
    console.log('Redirecting to edit page for staff member:', id);
    window.location.href = `edit-staff.html?id=${id}`;
}

// Handle edit form submission
async function handleEditSubmit(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = 'Saving...';
    
    try {
        const prisonerId = editPrisonerId.value;
        const response = await fetch(`http://localhost:3000/api/prisoners/${prisonerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: editFirstName.value,
                lastName: editLastName.value,
                age: parseInt(editAge.value),
                gender: editGender.value,
                cellNumber: editCellNumber.value,
                crime: editCrime.value,
                sentence: editSentence.value,
                severity: editSeverity.value
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update prisoner');
        }
        
        // Close modal and refresh list
        closeEditModal();
        fetchAndDisplayPrisoners();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
        successMessage.textContent = 'Prisoner updated successfully';
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
        console.error('Error updating prisoner:', error);
        alert('Error updating prisoner. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Changes';
    }
}

// Delete prisoner
async function deletePrisoner(id) {
    if (!confirm('Are you sure you want to delete this prisoner?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/prisoners/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete prisoner');
        }
        
        // Refresh list
        fetchAndDisplayPrisoners();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
        successMessage.textContent = 'Prisoner deleted successfully';
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
        console.error('Error deleting prisoner:', error);
        alert('Error deleting prisoner. Please try again.');
    }
}

// Initial load
fetchAndDisplayPrisoners(); 