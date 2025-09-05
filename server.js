const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// Load word pairs from JSON file
const words = JSON.parse(fs.readFileSync("words.json", "utf8"));

// In-memory game state
let game = null;

// Helper: pick random element
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------- ROUTES ----------------

// Start a new game
app.post("/start", (req, res) => {
    const { players } = req.body; // array of player names
    if (!players || players.length < 3) {
        return res
            .status(400)
            .json({ error: "Need at least 3 players to start a game." });
    }

    // Pick one random pair
    const [mainWord, imposterWord] = randomChoice(words);

    // Pick imposter
    const imposter = randomChoice(players);

    // Build player state
    const playerState = {};
    players.forEach((p) => {
        playerState[p] = {
            word: p === imposter ? imposterWord : mainWord,
            seen: false,
        };
    });

    // Save game state
    game = {
        running: true,
        mainWord,
        imposterWord,
        imposter,
        players: playerState,
        endedBy: null,
    };

    res.json({ message: "Game started", players });
});

// Get game status
app.get("/status", (req, res) => {
    if (!game || !game.running) {
        return res.json({ running: false, endedBy: game ? game.endedBy : null });
    }

    // Return list of players + seen status
    const players = Object.entries(game.players).map(([name, data]) => ({
        name,
        seen: data.seen,
    }));

    res.json({
        running: true,
        players,
        endedBy: game.endedBy,
    });
});

// Player requests their word
app.post("/word/:name", (req, res) => {
    if (!game || !game.running) {
        return res.status(400).json({ error: "No game running" });
    }

    const name = req.params.name;
    const player = game.players[name];
    if (!player) {
        return res.status(404).json({ error: "Player not found" });
    }

    if (player.seen) {
        return res.json({ message: "You already saw your word." });
    }

    player.seen = true;
    res.json({
    word: player.word,
    isImposter: name === game.imposter
});
    
});

// End the game
app.post("/end/:name", (req, res) => {
    if (!game || !game.running) {
        return res.status(400).json({ error: "No game running" });
    }

    const endedBy = req.params.name;
    game.running = false;
    game.endedBy = endedBy;

    res.json({
        message: "Game ended",
        endedBy,
        mainWord: game.mainWord,
        imposterWord: game.imposterWord,
        imposter: game.imposter,
        players: game.players,
    });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});