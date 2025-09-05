async function fetchStatus() {
  const res = await fetch("/status");
  const data = await res.json();
  renderGame(data);
}

async function startGame() {
  const names = prompt(
    "Enter player names separated by commas (e.g. Alice,Bob,Charlie):"
  );
  if (!names) return;

  const players = names.split(",").map((n) => n.trim()).filter(Boolean);

  const res = await fetch("/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players }),
  });

  const data = await res.json();
  alert("Game started with players: " + data.players.join(", "));
  fetchStatus();
}

async function seeWord(name) {
  const res = await fetch(`/word/${encodeURIComponent(name)}`, {
    method: "POST",
  });
  const data = await res.json();
  if (data.word) {
    alert(`Your word is: ${data.word}`);
  } else {
    alert(data.message || "Error");
  }
  fetchStatus();
}

async function endGame(name) {
  const res = await fetch(`/end/${encodeURIComponent(name)}`, {
    method: "POST",
  });
  const data = await res.json();

  let msg = `Game ended by ${data.endedBy}\n\nMain word: ${data.mainWord}\nImposter word: ${data.imposterWord}\nImposter: ${data.imposter}\n\nPlayers:\n`;
  for (const [p, info] of Object.entries(data.players)) {
    msg += `${p} → ${info.word}\n`;
  }
  alert(msg);
  fetchStatus();
}

function renderGame(data) {
  const container = document.getElementById("game");
  container.innerHTML = "";

  if (!data.running) {
    const btn = document.createElement("button");
    btn.textContent = "Start New Game";
    btn.onclick = startGame;
    container.appendChild(btn);

    if (data.endedBy) {
      const p = document.createElement("p");
      p.textContent = `Last game ended by ${data.endedBy}`;
      container.appendChild(p);
    }
    return;
  }

  const h2 = document.createElement("h2");
  h2.textContent = "Game is running!";
  container.appendChild(h2);

  const list = document.createElement("div");
  data.players.forEach((p) => {
    const div = document.createElement("div");
    div.className = "player";
    div.textContent = `${p.name} - ${p.seen ? "Seen" : "Not seen"}`;

    if (!p.seen) {
      const btn = document.createElement("button");
      btn.textContent = "See Word";
      btn.onclick = () => seeWord(p.name);
      div.appendChild(btn);
    }

    container.appendChild(div);
  });

  const endBtn = document.createElement("button");
  endBtn.textContent = "End Game";
  endBtn.onclick = () => {
    const name = prompt("Enter your name to end the game:");
    if (name) endGame(name);
  };
  container.appendChild(endBtn);
}

// Poll status every 2 seconds
setInterval(fetchStatus, 2000);
fetchStatus();