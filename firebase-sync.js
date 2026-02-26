// Shared Firebase sync helper loaded by every page that needs cloud sync
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAUMCrxqwTM0UbuT1kPxasKVYDOa5d8LEQ",
    authDomain: "petty-cash-tudawe.firebaseapp.com",
    databaseURL: "https://petty-cash-tudawe-default-rtdb.firebaseio.com",
    projectId: "petty-cash-tudawe",
    storageBucket: "petty-cash-tudawe.firebasestorage.app",
    messagingSenderId: "181379897640",
    appId: "1:181379897640:web:f39b401623de1e3633981d",
    measurementId: "G-LJZMFCM779"
};

// initialize firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function getCurrentUser() {
    return localStorage.getItem('_pettycash_currentUser');
}

function getStorageKey(key) {
    const user = getCurrentUser();
    return user ? `${user}_${key}` : key;
}

// write full snapshot for the current user
window.syncToFirebase = function() {
    const user = getCurrentUser();
    if (!user) return;

    const userRef = ref(db, `users/${user}`);
    const syncData = {
        ious: JSON.parse(localStorage.getItem(getStorageKey('ious')) || '[]'),
        expenses: JSON.parse(localStorage.getItem(getStorageKey('expenses')) || '[]'),
        invoices: JSON.parse(localStorage.getItem(getStorageKey('invoices')) || '[]'),
        cashCounts: JSON.parse(localStorage.getItem(getStorageKey('cashCounts')) || '[]'),
        lastSyncDate: new Date().toISOString()
    };

    return set(userRef, syncData)
        .then(() => console.log('Data synced to Firebase successfully'))
        .catch(err => console.error('Sync error:', err));
};

// listen for remote updates and merge into localstorage
window.listenToFirebaseUpdates = function() {
    const user = getCurrentUser();
    if (!user) return;

    const userRef = ref(db, `users/${user}`);
    onValue(userRef, (snapshot) => {
        const remoteData = snapshot.val();
        if (remoteData && remoteData.lastSyncDate) {
            localStorage.setItem(getStorageKey('ious'), JSON.stringify(remoteData.ious || []));
            localStorage.setItem(getStorageKey('expenses'), JSON.stringify(remoteData.expenses || []));
            localStorage.setItem(getStorageKey('invoices'), JSON.stringify(remoteData.invoices || []));
            localStorage.setItem(getStorageKey('cashCounts'), JSON.stringify(remoteData.cashCounts || []));
            console.log('Local data updated from Firebase');

            // notify any listeners on the page so they can refresh their UI
            window.dispatchEvent(new Event('firebaseDataUpdated'));
        }
    });
};

// start periodic push
setInterval(() => {
    if (getCurrentUser()) {
        window.syncToFirebase();
    }
}, 30000);

// kick off listening immediately (will no-op if not logged in)
window.listenToFirebaseUpdates();
