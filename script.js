// Initialize IndexedDB
let db;
const request = indexedDB.open('NoteAppDB', 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadNotes();
};

request.onerror = (event) => {
    showStatus('Failed to initialize database: ' + event.target.error);
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saveButton').addEventListener('click', () => {
        const noteInput = document.getElementById('noteInput');
        const noteText = noteInput.value.trim();
        if (noteText) {
            saveNote(noteText);
            noteInput.value = '';
        } else {
            showStatus('Please enter a note.');
        }
    });

    document.getElementById('clearButton').addEventListener('click', () => {
        clearNotes();
    });

    document.getElementById('exportButton').addEventListener('click', () => {
        exportNotes();
    });

    document.getElementById('importInput').addEventListener('change', (event) => {
        importNotes(event.target.files[0]);
    });
});

// Function to save a note to IndexedDB
function saveNote(note) {
    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');
    const noteData = { text: note, timestamp: new Date().toLocaleString() };
    const request = store.add(noteData);

    request.onsuccess = () => {
        loadNotes();
        showStatus('Note saved successfully.');
    };
    request.onerror = () => {
        showStatus('Failed to save note: ' + request.error);
    };
}

// Function to load and display notes
function loadNotes() {
    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const request = store.getAll();

    request.onsuccess = () => {
        const notes = request.result;
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';
        notes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note';
            noteDiv.innerHTML = `<strong>${note.timestamp}</strong><p>${note.text}</p>`;
            notesList.appendChild(noteDiv);
        });
    };
    request.onerror = () => {
        showStatus('Failed to load notes: ' + request.error);
    };
}

// Function to clear all notes
function clearNotes() {
    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');
    const request = store.clear();

    request.onsuccess = () => {
        loadNotes();
        showStatus('All notes cleared.');
    };
    request.onerror = () => {
        showStatus('Failed to clear notes: ' + request.error);
    };
}

// Function to export notes as JSON file
function exportNotes() {
    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const request = store.getAll();

    request.onsuccess = () => {
        const notes = request.result;
        const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showStatus('Notes exported successfully.');
    };
    request.onerror = () => {
        showStatus('Failed to export notes: ' + request.error);
    };
}

// Function to import notes from JSON file
function importNotes(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const notes = JSON.parse(event.target.result);
            const transaction = db.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');
            let successCount = 0;

            notes.forEach(note => {
                const request = store.add({ text: note.text, timestamp: note.timestamp || new Date().toLocaleString() });
                request.onsuccess = () => {
                    successCount++;
                    if (successCount === notes.length) {
                        loadNotes();
                        showStatus('Notes imported successfully.');
                    }
                };
                request.onerror = () => {
                    showStatus('Failed to import some notes: ' + request.error);
                };
            });
        } catch (e) {
            showStatus('Invalid JSON file: ' + e.message);
        }
    };
    reader.onerror = () => {
        showStatus('Failed to read file.');
    };
    reader.readAsText(file);
}

// Function to show status messages
function showStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    setTimeout(() => { status.textContent = ''; }, 3000);
}