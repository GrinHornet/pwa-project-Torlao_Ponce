// Checking if service worker is supported and then registering them if yes
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => console.log("sw registered", reg))
    .catch((err) => console.log("sw not registered", err));
}

// Firebase connection via modular API
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAR43kxrJeTPmJFaajW_LQXaScY0yyafX4",
  authDomain: "converter-pwa.firebaseapp.com",
  projectId: "converter-pwa",
  storageBucket: "converter-pwa.appspot.com",
  messagingSenderId: "530675937922",
  appId: "1:530675937922:web:5a47148b2274ed4c137a9b",
  measurementId: "G-7CKZWQ7NJF",
};

// Initialization
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

const colRef = collection(db, "history");

// Variables needed for conversion and etc.
const inputField = document.getElementById("input-meas");
const fromUnitField = document.getElementById("input-unit");
const toUnitField = document.getElementById("output-unit");
const outputField = document.getElementById("output-meas");
const saveButton = document.getElementById("save-button");
const form = document.getElementById("converter");

// Converter function
function convertTemp(value, fromUnit, toUnit) {
  if (fromUnit === "m") {
    if (toUnit === "k") {
      return value * 1.60934;
    } else if (toUnit === "f") {
      return value * 5280;
    }
    return value;
  }
  if (fromUnit === "k") {
    if (toUnit === "m") {
      return value * 0.621371;
    } else if (toUnit === "f") {
      return value * 3280.84;
    }
    return value;
  }
  if (fromUnit === "f") {
    if (toUnit === "m") {
      return value * 0.000189;
    } else if (toUnit === "k") {
      return value * 0.0003048;
    }
    return value;
  }
  throw new Error("Invalid Unit");
}

// Taking the data from Firestore DB and passing them to the renderHistoryRow function
async function fetchHistory() {
  const querySnapshot = await getDocs(colRef);
  querySnapshot.forEach((doc) => {
    renderHistoryRow(doc);
  });
}

// When you input a value, it does the conversions
form.addEventListener("input", () => {
  const inputMeas = parseFloat(inputField.value);
  const fromUnit = fromUnitField.value;
  const toUnit = toUnitField.value;
  const outputMeas = convertTemp(inputMeas, fromUnit, toUnit);
  outputField.value = Math.round(outputMeas * 100) / 100 + " " + toUnit;
});

// When pressed it passes the entered values to Firestore DB
saveButton.addEventListener("click", (e) => {
  e.preventDefault();

  const newHistoryEntry = {
    inputMeas: parseFloat(inputField.value),
    inputType: fromUnitField.value,
    outputType: toUnitField.value,
    outputMeas: parseFloat(
      Math.round(
        convertTemp(
          parseFloat(inputField.value),
          fromUnitField.value,
          toUnitField.value
        ) * 100
      ) / 100
    ),
  };

  addDoc(colRef, newHistoryEntry)
    .then((docRef) => {
      console.log("Document added with ID: ", docRef.id);
      location.reload();
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    });
});

// Materialize select initialization
document.addEventListener("DOMContentLoaded", function () {
  var elems = document.querySelectorAll("select");
  var instances = M.FormSelect.init(elems);

  // Fetch history on page load
  fetchHistory();
});

// Function displaying the history by taking them from Firestore DB
function renderHistoryRow(doc) {
  const historyTableBody = document.getElementById("historyTableBody");
  const row = document.createElement("tr");

  row.innerHTML = `
      <td>${doc.data().inputMeas}</td>
      <td>${doc.data().inputType}</td>
      <td>${doc.data().outputType}</td>
      <td>${doc.data().outputMeas}</td>
      <td><button class="deleteButton" data-id="${doc.id}">Delete</button></td>
    `;

  historyTableBody.appendChild(row);
}

const historyTableBody = document.getElementById("historyTableBody");

// Event delegation: listening for clicks on the container with the id="historyTableBody"
historyTableBody.addEventListener("click", function (event) {
  const target = event.target;

  // Check if the clicked element is a "Delete" button
  if (target.classList.contains("deleteButton")) {
    // Get the corresponding row
    const row = target.closest("tr");

    // Remove the row from the table
    if (row) {
      row.remove();

      const docId = target.getAttribute("data-id");
      const documentRef = doc(db, "history", docId);

      deleteDoc(documentRef)
        .then(() => console.log("Document Deleted!"))
        .catch((error) => console.error("Error:", error));
    }
  }
});
