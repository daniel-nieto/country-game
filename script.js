// Initialize the map
var map = L.map('map').setView([20, 0], 2);

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var players = [];
var currentPlayerIndex = 0;
var playerColors = ['red', 'blue'];
var playerMarkers = [[], []];
var lastCountry = '';
var scores = [0, 0];
var historicalEntriesTableBody = document.getElementById('historical-entries').getElementsByTagName('tbody')[0];
var scoreTableBody = document.getElementById('score-table').getElementsByTagName('tbody')[0];

function startGame() {
    var player1Name = document.getElementById('player1-name').value.trim();
    var player2Name = document.getElementById('player2-name').value.trim();

    if (!player1Name || !player2Name) {
        alert("🛑 Please enter names for both players.");
        return;
    }

    players = [player1Name, player2Name];
    currentPlayerIndex = 0;
    lastCountry = '';
    scores = [0, 0];

    document.getElementById('current-player').textContent = players[currentPlayerIndex] + "'s turn ⬇️";
    document.getElementById('game-controls').style.display = 'block';
    historicalEntriesTableBody.innerHTML = ''; // Clear previous entries
    updateScoreTable(); // Clear and update score table
}

function locateCountry() {
    var countryName = document.getElementById('country-input').value.trim();

    if (!countryName) {
        alert("Please enter a country name.");
        return;
    }

    // Check if the country name follows the rule
    if (lastCountry && countryName[0].toLowerCase() !== lastCountry.slice(-1).toLowerCase()) {
        addHistoricalEntry(players[currentPlayerIndex], countryName, false);
        subtractScore(currentPlayerIndex); // Subtract score for incorrect entry
        alert("🛑 Country name must start with the last letter of the previous country.");
        switchTurn();
        return;
    }

    // Use an API to get the country's geographical coordinates
    fetch(`https://nominatim.openstreetmap.org/search?country=${countryName}&format=json&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                addHistoricalEntry(players[currentPlayerIndex], countryName, false);
                subtractScore(currentPlayerIndex); // Subtract score for incorrect entry
                alert("🛑 Country not found. You lose a point.");
                switchTurn();
                return;
            }

            var lat = data[0].lat;
            var lon = data[0].lon;

            // Set the map view to the country's coordinates
            map.setView([lat, lon], 2);

            // Add a marker to the map at the country's coordinates with player-specific color
            var marker = L.circleMarker([lat, lon], {
                color: playerColors[currentPlayerIndex]
            }).addTo(map)
                .bindPopup(`<b>${countryName}</b>`)
                .openPopup();

            // Store the marker in the player's marker list
            playerMarkers[currentPlayerIndex].push(marker);

            // Update the last country
            lastCountry = countryName;

            // Add to historical entries
            addHistoricalEntry(players[currentPlayerIndex], countryName, true);
            addScore(currentPlayerIndex); // Add score for correct entry

            switchTurn();
        })
        .catch(error => {
            console.error('Error fetching country data:', error);
            alert("An error occurred. Please try again.");
        });
}

function switchTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    document.getElementById('current-player').textContent = players[currentPlayerIndex] + "'s turn ⬇️";
    document.getElementById('country-input').value = '';
}

function addScore(playerIndex) {
    scores[playerIndex]++;
    updateScoreTable();
}

function subtractScore(playerIndex) {
    scores[playerIndex]--;
    updateScoreTable();
}

function updateScoreTable() {
    scoreTableBody.innerHTML = '';
    var newRow = scoreTableBody.insertRow();
    var player1ScoreCell = newRow.insertCell(0);
    var player2ScoreCell = newRow.insertCell(1);
    player1ScoreCell.textContent = `${players[0]}: ${scores[0]}`;
    player2ScoreCell.textContent = `${players[1]}: ${scores[1]}`;
}

function addHistoricalEntry(player, country, isCorrect) {
    var newRow = historicalEntriesTableBody.insertRow();
    var playerCell = newRow.insertCell(0);
    var countryCell = newRow.insertCell(1);
    var resultCell = newRow.insertCell(2);
    playerCell.textContent = player;
    countryCell.textContent = country;
    resultCell.textContent = isCorrect ? '✅' : '❌';
}
