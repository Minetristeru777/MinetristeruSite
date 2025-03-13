let currentUser = null;  // To store the current logged-in user (null if guest)

// Function to open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('vUKRideoDB', 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'username' });
            }
            if (!db.objectStoreNames.contains('videos')) {
                db.createObjectStore('videos', { autoIncrement: true });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject('Error opening database');
        };
    });
}

// Function to register a new user
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    const db = await openDB();
    const transaction = db.transaction('users', 'readwrite');
    const usersStore = transaction.objectStore('users');

    // Check if the user already exists
    const existingUser = await new Promise((resolve, reject) => {
        const request = usersStore.get(username);
        request.onsuccess = function() {
            resolve(request.result);
        };
        request.onerror = function() {
            reject();
        };
    });

    if (existingUser) {
        alert('This username is already taken');
        return;
    }

    const newUser = { username, password };
    usersStore.add(newUser);
    alert('Registration successful! Please log in.');
    toggleForms('login');
}

// Function to log in a user
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    const db = await openDB();
    const transaction = db.transaction('users', 'readonly');
    const usersStore = transaction.objectStore('users');

    const user = await new Promise((resolve, reject) => {
        const request = usersStore.get(username);
        request.onsuccess = function() {
            resolve(request.result);
        };
        request.onerror = function() {
            reject();
        };
    });

    if (user && user.password === password) {
        currentUser = user;
        alert('Login successful!');
        toggleForms('upload');
    } else {
        alert('Incorrect username or password');
    }
}

// Function to log in as guest
function guestLogin() {
    currentUser = null;  // No user logged in
    alert('Logged in as guest');
    toggleForms('upload');
}

// Function to toggle between registration, login, and upload sections
function toggleForms(form) {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('upload-section').style.display = 'none';

    if (form === 'register') {
        document.getElementById('register-form').style.display = 'block';
    } else if (form === 'login') {
        document.getElementById('login-form').style.display = 'block';
    } else if (form === 'upload') {
        document.getElementById('upload-section').style.display = 'block';
        loadVideos();
    }
}

// Function to upload a video
async function uploadVideo() {
    if (!currentUser) {
        alert('You need to log in to upload videos');
        return;
    }

    const videoFile = document.getElementById('video-upload').files[0];
    if (!videoFile) {
        alert('Please select a video');
        return;
    }

    const db = await openDB();
    const transaction = db.transaction('videos', 'readwrite');
    const videosStore = transaction.objectStore('videos');

    const video = {
        name: videoFile.name,
        size: videoFile.size,
        file: URL.createObjectURL(videoFile),
    };

    videosStore.add(video);
    alert('Video uploaded successfully!');
    loadVideos();
}

// Function to delete a video
async function deleteVideo(videoId) {
    const db = await openDB();
    const transaction = db.transaction('videos', 'readwrite');
    const videosStore = transaction.objectStore('videos');

    videosStore.delete(videoId);
    alert('Video deleted successfully!');
    loadVideos();
}

// Function to load all videos
async function loadVideos() {
    const db = await openDB();
    const transaction = db.transaction('videos', 'readonly');
    const videosStore = transaction.objectStore('videos');

    const request = videosStore.getAll();
    request.onsuccess = function() {
        const videos = request.result;
        const videoList = document.getElementById('video-list-items');
        videoList.innerHTML = '';

        videos.forEach((video) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${video.name}</strong><br>
                <video width="200" controls>
                    <source src="${video.file}" type="video/mp4">
                </video>
                <button onclick="deleteVideo(${video.id})">Delete</button>
            `;
            videoList.appendChild(li);
        });
    };
}

// Initial form setup
toggleForms('register');  // Show registration form on page load
