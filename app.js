const games = [
  {
    id: "memory",
    title: "記憶力チャレンジ",
    desc: "同じ絵柄のペアを見つけよう",
    icon: "◈",
    type: "brain",
    color: "red",
    unit: "手",
  },
  {
    id: "reaction",
    title: "反射神経テスト",
    desc: "緑になった瞬間を逃すな",
    icon: "⚡",
    type: "speed",
    color: "yellow",
    unit: "ms",
  },
  {
    id: "timer",
    title: "ピッタリタイム",
    desc: "感覚だけで10秒を当てよう",
    icon: "◷",
    type: "speed",
    color: "blue",
    unit: "秒差",
  },
  {
    id: "numbers",
    title: "数字順タップ",
    desc: "1から25まで最速でタップ",
    icon: "25",
    type: "speed",
    color: "green",
    unit: "秒",
  },
  {
    id: "color",
    title: "色あて",
    desc: "文字ではなく色を見抜こう",
    icon: "彩",
    type: "brain",
    color: "blue",
    unit: "点",
  },
  {
    id: "math",
    title: "暗算スピードバトル",
    desc: "30秒でどこまで解ける？",
    icon: "＋",
    type: "brain",
    color: "red",
    unit: "問",
  },
  {
    id: "puzzle",
    title: "数字パズル",
    desc: "バラバラの数字を元どおりに",
    icon: "▦",
    type: "classic",
    color: "yellow",
    unit: "手",
  },
  {
    id: "breakout",
    title: "ブロック崩し",
    desc: "ボールを弾いて全部こわせ",
    icon: "▰",
    type: "classic",
    color: "green",
    unit: "点",
  },
];
const $ = (s) => document.querySelector(s),
  bests = JSON.parse(localStorage.getItem("yokoBests") || "{}");
let cleanup = () => {},
  sound = true,
  played = +(localStorage.getItem("yokoPlayed") || 0),
  audio,
  difficulty = "normal",
  currentGame = null,
  rankDifficulty = "normal";
const rankings = JSON.parse(localStorage.getItem("yokoRankings") || "{}"),
  diffNames = { easy: "やさしい", normal: "ふつう", hard: "むずかしい" },
  diffBonus = { easy: 1, normal: 1.5, hard: 2 };
$("#playedCount").textContent = played;
function beep(freq = 440, d = 0.07) {
  if (!sound) return;
  audio ??= new AudioContext();
  const o = audio.createOscillator(),
    g = audio.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.08, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + d);
}
function scoreKey(g, d = difficulty) {
  return `${g.id}_${d}`;
}
function bestText(g, d = difficulty) {
  const value =
    bests[scoreKey(g, d)] ?? (d === "normal" ? bests[g.id] : undefined);
  return value === undefined ? "未挑戦" : `${value}${g.unit}`;
}
function renderCards(filter = "all") {
  $("#gameGrid").innerHTML = games
    .filter((g) => filter === "all" || g.type === filter)
    .map(
      (g, i) =>
        `<article class="game-card" data-game="${g.id}" data-color="${g.color}"><div class="card-top"><span class="game-icon">${g.icon}</span><span class="game-number">0${games.indexOf(g) + 1}</span></div><h3>${g.title}</h3><p>${g.desc}</p><div class="card-bottom"><span class="card-best">BEST<b>${bestText(g)}</b></span><span class="play-arrow">→</span></div></article>`,
    )
    .join("");
  document
    .querySelectorAll("[data-game]")
    .forEach((x) => (x.onclick = () => openGame(x.dataset.game)));
}
renderCards();
document.querySelectorAll(".filter").forEach(
  (b) =>
    (b.onclick = () => {
      document.querySelector(".filter.active").classList.remove("active");
      b.classList.add("active");
      renderCards(b.dataset.filter);
    }),
);
document.querySelectorAll("[data-home]").forEach((b) => (b.onclick = home));
$("#soundBtn").onclick = () => {
  sound = !sound;
  $("#soundBtn").classList.toggle("muted", !sound);
  $("#soundBtn").textContent = sound ? "♪" : "×";
};
$("#difficultySelect").onchange = () => {
  if (!currentGame) return;
  cleanup();
  difficulty = $("#difficultySelect").value;
  $("#bestScore").textContent = bestText(currentGame);
  runners[currentGame.id](currentGame);
};
function showRanking() {
  if (!currentGame) return;
  const key = scoreKey(currentGame, rankDifficulty),
    list = rankings[key] || [];
  $("#rankTitle").textContent =
    `${currentGame.title}｜${diffNames[rankDifficulty]}`;
  $("#rankList").innerHTML = list.length
    ? list
        .map(
          (r, i) =>
            `<li><strong>${i + 1}</strong><span><b>${r.name}</b><small>${r.date}</small></span><b>${r.label}</b></li>`,
        )
        .join("")
    : '<li class="empty-rank">まだ記録がありません。<br>最初の挑戦者になろう！</li>';
}
$("#rankBtn").onclick = () => {
  rankDifficulty = difficulty;
  document
    .querySelectorAll("[data-rank-diff]")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.rankDiff === rankDifficulty),
    );
  showRanking();
  $("#rankDialog").showModal();
};
$("#rankClose").onclick = () => $("#rankDialog").close();
document.querySelectorAll("[data-rank-diff]").forEach(
  (b) =>
    (b.onclick = () => {
      rankDifficulty = b.dataset.rankDiff;
      document
        .querySelectorAll("[data-rank-diff]")
        .forEach((x) => x.classList.toggle("active", x === b));
      showRanking();
    }),
);
function home() {
  cleanup();
  $("#gameView").classList.remove("active");
  $("#homeView").classList.add("active");
  renderCards(document.querySelector(".filter.active").dataset.filter);
  scrollTo(0, 0);
}
function openGame(id) {
  cleanup();
  const g = games.find((x) => x.id === id);
  currentGame = g;
  difficulty = $("#difficultySelect").value;
  $("#homeView").classList.remove("active");
  $("#gameView").classList.add("active");
  $("#gameKicker").textContent = `GAME 0${games.indexOf(g) + 1}`;
  $("#gameTitle").textContent = g.title;
  $("#gameDescription").textContent = g.desc;
  $("#bestScore").textContent = bestText(g);
  scrollTo(0, 0);
  runners[id](g);
}
function setBest(g, value, lower = false) {
  played++;
  localStorage.setItem("yokoPlayed", played);
  $("#playedCount").textContent = played;
  const key = scoreKey(g),
    old = bests[key],
    better = old === undefined || (lower ? value < old : value > old);
  if (better) {
    bests[key] = value;
    localStorage.setItem("yokoBests", JSON.stringify(bests));
    $("#bestScore").textContent = bestText(g);
  }
  return better;
}
function addRank(g, name, value, label, lower) {
  const key = scoreKey(g),
    list = (rankings[key] ??= []);
  list.push({
    name: (name || "ななし").slice(0, 10),
    value,
    label,
    date: new Date().toLocaleDateString("ja-JP"),
  });
  list.sort((a, b) => (lower ? a.value - b.value : b.value - a.value));
  rankings[key] = list.slice(0, 10);
  localStorage.setItem("yokoRankings", JSON.stringify(rankings));
  beep(900, 0.12);
}
function result(g, label, value, lower = false, extra = "") {
  const isBest = setBest(g, value, lower);
  $("#gameArea").innerHTML =
    `<div class="result-card"><span class="difficulty-badge">${diffNames[difficulty]} ×${diffBonus[difficulty]}</span><p>${isBest ? "★ NEW BEST!" : "RESULT"}</p><div class="big">${label}</div><p>${extra}</p><div class="name-entry"><input id="rankName" maxlength="10" placeholder="名前（10文字まで）"><button class="secondary-btn" id="rankSave">記録を登録</button></div><button class="primary-btn" id="again">もう一度</button><button class="secondary-btn" data-home>一覧へ</button></div>`;
  let saved = false;
  $("#rankSave").onclick = () => {
    if (saved) return;
    addRank(g, $("#rankName").value, value, label, lower);
    saved = true;
    $("#rankSave").textContent = "登録しました ✓";
  };
  $("#again").onclick = () => runners[g.id](g);
  $("#gameArea [data-home]").onclick = home;
  beep(isBest ? 880 : 520, 0.15);
}
const runners = {
  memory(g) {
    const pairGoal = { easy: 6, normal: 8, hard: 10 }[difficulty],
      icons = ["🍋", "🍒", "🍉", "🍇", "🍊", "🥝", "🍓", "🍍", "🍎", "🥥"].slice(0, pairGoal),
      cards = [...icons, ...icons].sort(() => Math.random() - 0.5);
    let open = [],
      matched = 0,
      moves = 0,
      lock = false;
    $("#gameArea").innerHTML =
      `<div class="game-status"><div class="stat"><span>MOVES</span><strong id="moves">0</strong></div><div class="stat"><span>PAIRS</span><strong id="pairs">0/${pairGoal}</strong></div></div><div class="memory-grid" style="grid-template-columns:repeat(${difficulty === "hard" ? 5 : 4},1fr)">${cards.map((x, i) => `<button class="memory-card" data-i="${i}">${x}</button>`).join("")}</div>`;
    document.querySelectorAll(".memory-card").forEach(
      (c) =>
        (c.onclick = () => {
          if (
            lock ||
            c.classList.contains("open") ||
            c.classList.contains("matched")
          )
            return;
          c.classList.add("open");
          open.push(c);
          beep(400);
          if (open.length === 2) {
            moves++;
            $("#moves").textContent = moves;
            if (open[0].textContent === open[1].textContent) {
              open.forEach((x) => x.classList.add("matched"));
              open = [];
              matched++;
              $("#pairs").textContent = `${matched}/${pairGoal}`;
              beep(700);
              if (matched === pairGoal)
                setTimeout(
                  () =>
                    result(
                      g,
                      `${moves}手`,
                      moves,
                      true,
                      "すべてのペアを発見！",
                    ),
                  500,
                );
            } else {
              lock = true;
              setTimeout(() => {
                open.forEach((x) => x.classList.remove("open"));
                open = [];
                lock = false;
              }, 700);
            }
          }
        }),
    );
  },
  reaction(g) {
    let state = "start",
      timer,
      start;
    $("#gameArea").innerHTML =
      `<div class="reaction-pad"><div>クリックしてスタート<br><small>緑になったら、もう一度クリック！</small></div></div>`;
    const p = $(".reaction-pad");
    if (difficulty === "hard") { p.style.width = "320px"; p.style.height = "210px"; }
    p.onclick = () => {
      if (state === "start") {
        state = "wait";
        p.className = "reaction-pad wait";
        p.innerHTML = "まだ押さないで…";
        timer = setTimeout(
          () => {
            state = "go";
            start = performance.now();
            p.className = "reaction-pad go";
            p.textContent = "いま！";
            beep(800);
          },
          ({ easy: 1000, normal: 1500, hard: 500 }[difficulty]) + Math.random() * ({ easy: 1800, normal: 3000, hard: 4500 }[difficulty]),
        );
      } else if (state === "wait") {
        clearTimeout(timer);
        state = "start";
        p.className = "reaction-pad";
        p.innerHTML = "フライング！<br><small>クリックしてやり直す</small>";
        beep(150);
      } else {
        const ms = Math.round(performance.now() - start);
        result(
          g,
          `${ms} ms`,
          ms,
          true,
          ms < 250
            ? "超人級の反応！"
            : ms < 350
              ? "かなり速い！"
              : "もう一回いける！",
        );
      }
    };
    cleanup = () => clearTimeout(timer);
  },
  timer(g) {
    const target = { easy: 5, normal: 10, hard: 15 }[difficulty];
    let running = false,
      start,
      raf,
      stopped = false;
    $("#gameArea").innerHTML =
      `<p class="instruction">スタート後、表示が消えます。<br>「${target}秒だ！」と思った瞬間にストップ。</p><div class="timer-display">0.00</div><button class="primary-btn" id="timerBtn">スタート</button>`;
    const display = $(".timer-display"),
      btn = $("#timerBtn");
    btn.onclick = () => {
      if (!running) {
        running = true;
        start = performance.now();
        btn.textContent = "ストップ！";
        const tick = () => {
          const t = (performance.now() - start) / 1000;
          display.textContent = t < Math.min(3, target / 2) ? t.toFixed(2) : "？？？";
          raf = requestAnimationFrame(tick);
        };
        tick();
      } else if (!stopped) {
        stopped = true;
        cancelAnimationFrame(raf);
        const t = (performance.now() - start) / 1000,
          diff = +Math.abs(target - t).toFixed(2);
        display.textContent = t.toFixed(2);
        setTimeout(
          () =>
            result(
              g,
              `${diff}秒差`,
              diff,
              true,
              `止めた時間：${t.toFixed(2)}秒`,
            ),
          400,
        );
      }
    };
    cleanup = () => cancelAnimationFrame(raf);
  },
  numbers(g) {
    const goal = { easy: 16, normal: 25, hard: 36 }[difficulty], cols = Math.sqrt(goal);
    let nums = Array.from({ length: goal }, (_, i) => i + 1).sort(
        () => Math.random() - 0.5,
      ),
      next = 1,
      start;
    $("#gameArea").innerHTML =
      `<div class="game-status"><div class="stat"><span>NEXT</span><strong id="nextNum">1</strong></div><div class="stat"><span>TIME</span><strong id="numTime">0.00</strong></div></div><div class="number-grid" style="grid-template-columns:repeat(${cols},1fr)">${nums.map((n) => `<button class="number-cell">${n}</button>`).join("")}</div>`;
    start = performance.now();
    let raf;
    const tick = () => {
      $("#numTime").textContent = ((performance.now() - start) / 1000).toFixed(
        2,
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    document.querySelectorAll(".number-cell").forEach(
      (c) =>
        (c.onclick = () => {
          if (+c.textContent !== next) {
            beep(160);
            return;
          }
          c.classList.add("done");
          beep(350 + next * 12);
          next++;
          if (next <= goal) $("#nextNum").textContent = next;
          else {
            const sec = +((performance.now() - start) / 1000).toFixed(2);
            cancelAnimationFrame(raf);
            result(g, `${sec}秒`, sec, true, `${goal}までコンプリート！`);
          }
        }),
    );
    cleanup = () => cancelAnimationFrame(raf);
  },
  color(g) {
    let colors = [
      ["あか", "#e84437"],
      ["あお", "#3569d4"],
      ["きいろ", "#eeb518"],
      ["みどり", "#34a267"],
    ];
    if (difficulty === "easy") colors = colors.slice(0, 3);
    let score = 0,
      q = 0,
      combo = 0,
      time = { easy: 25, normal: 20, hard: 15 }[difficulty],
      interval;
    $("#gameArea").innerHTML =
      `<div class="game-status"><div class="stat"><span>SCORE</span><strong id="colorScore">0</strong></div><div class="stat"><span>TIME</span><strong id="colorTime">${time}</strong></div></div><div class="combo-pop" id="colorCombo"></div><p class="instruction">文字の意味ではなく、文字の「色」を答えてね</p><div id="colorQuiz"></div>`;
    function ask() {
      const word = colors[(Math.random() * colors.length) | 0],
        ink = colors[(Math.random() * colors.length) | 0];
      $("#colorQuiz").innerHTML =
        `<div class="color-word" style="color:${ink[1]}">${word[0]}</div><div class="color-grid">${[
          ...colors,
        ]
          .sort(() => Math.random() - 0.5)
          .map(
            (c) =>
              `<button class="color-choice" data-a="${c[0]}">${c[0]}</button>`,
          )
          .join("")}</div>`;
      document.querySelectorAll(".color-choice").forEach(
        (b) =>
          (b.onclick = () => {
            q++;
            if (b.dataset.a === ink[0]) {
              combo++;
              score += difficulty === "hard" && combo >= 3 ? 2 : 1;
              $("#colorCombo").textContent = combo >= 3 ? `${combo} COMBO!` : "";
              beep(650);
            } else { combo = 0; $("#colorCombo").textContent = ""; beep(150); }
            $("#colorScore").textContent = score;
            ask();
          }),
      );
    }
    ask();
    interval = setInterval(() => {
      time--;
      $("#colorTime").textContent = time;
      if (!time) {
        clearInterval(interval);
        result(g, `${score}点`, score, false, `${q}回チャレンジ・コンボボーナス込み`);
      }
    }, 1000);
    cleanup = () => clearInterval(interval);
  },
  math(g) {
    const limit = { easy: 40, normal: 30, hard: 25 }[difficulty];
    let score = 0,
      combo = 0,
      time = limit,
      answer,
      interval;
    $("#gameArea").innerHTML =
      `<div class="game-status"><div class="stat"><span>SCORE</span><strong id="mathScore">0</strong></div><div class="stat"><span>TIME</span><strong id="mathTime">${time}</strong></div></div><div class="combo-pop" id="mathCombo"></div><div class="math-problem" id="problem"></div><form id="mathForm"><input class="math-input" id="mathInput" inputmode="numeric" autocomplete="off" placeholder="答え"><button class="primary-btn">決定</button></form>`;
    const next = () => {
      const max = { easy: 15, normal: 30, hard: 60 }[difficulty];
      let a = (2 + Math.random() * max) | 0,
        b = (2 + Math.random() * (difficulty === "hard" ? 12 : max * .65)) | 0,
        op = difficulty === "hard" && Math.random() < .28 ? "×" : (Math.random() < 0.5 ? "+" : "−");
      if (op === "−" && b > a) [a, b] = [b, a];
      answer = op === "+" ? a + b : op === "−" ? a - b : a * b;
      $("#problem").textContent = `${a} ${op} ${b}`;
      $("#mathInput").value = "";
      $("#mathInput").focus();
    };
    $("#mathForm").onsubmit = (e) => {
      e.preventDefault();
      if (+$(`#mathInput`).value === answer) {
        combo++;
        score += difficulty === "hard" && combo >= 3 ? 2 : 1;
        $("#mathCombo").textContent = combo >= 3 ? `${combo} COMBO!` : "";
        $("#mathScore").textContent = score;
        beep(700);
      } else { combo = 0; $("#mathCombo").textContent = ""; beep(160); }
      next();
    };
    next();
    interval = setInterval(() => {
      time--;
      $("#mathTime").textContent = time;
      if (!time) {
        clearInterval(interval);
        result(g, `${score}点`, score, false, `${limit}秒間・コンボボーナス込み`);
      }
    }, 1000);
    cleanup = () => clearInterval(interval);
  },
  puzzle(g) {
    let arr = [...Array(15)].map((_, i) => i + 1).concat(0),
      moves = 0;
    for (let k = 0; k < ({ easy: 35, normal: 160, hard: 420 }[difficulty]); k++) {
      let z = arr.indexOf(0),
        opts = [
          z - 4,
          z + 4,
          z % 4 ? z - 1 : -1,
          z % 4 < 3 ? z + 1 : -1,
        ].filter((x) => x >= 0 && x < 16),
        n = opts[(Math.random() * opts.length) | 0];
      [arr[z], arr[n]] = [arr[n], arr[z]];
    }
    $("#gameArea").innerHTML =
      `<div class="game-status"><div class="stat"><span>MOVES</span><strong id="pMoves">0</strong></div></div><div class="puzzle-grid" id="pGrid"></div>`;
    function draw() {
      $("#pGrid").innerHTML = arr
        .map(
          (n, i) =>
            `<button class="puzzle-tile ${n ? "" : "empty"}" data-i="${i}">${n || ""}</button>`,
        )
        .join("");
      document.querySelectorAll(".puzzle-tile").forEach(
        (b) =>
          (b.onclick = () => {
            let i = +b.dataset.i,
              z = arr.indexOf(0);
            if (
              Math.abs(i - z) === 4 ||
              (Math.abs(i - z) === 1 && Math.floor(i / 4) === Math.floor(z / 4))
            ) {
              [arr[i], arr[z]] = [arr[z], arr[i]];
              moves++;
              beep(350);
              $("#pMoves").textContent = moves;
              draw();
              if (arr.slice(0, 15).every((n, j) => n === j + 1))
                setTimeout(
                  () => result(g, `${moves}手`, moves, true, "パズル完成！"),
                  300,
                );
            }
          }),
      );
    }
    draw();
  },
  breakout(g) {
    const settings = { easy: { speed: 3, life: 5, rows: 4 }, normal: { speed: 4, life: 3, rows: 5 }, hard: { speed: 5.5, life: 2, rows: 6 } }[difficulty];
    $("#gameArea").innerHTML =
      `<div class="game-status"><div class="stat"><span>SCORE</span><strong id="bScore">0</strong></div><div class="stat"><span>LIFE</span><strong id="bLife">${settings.life}</strong></div></div><canvas class="breakout" width="660" height="430"></canvas><p class="instruction">マウス・指・← → キーでバーを動かそう</p>`;
    const c = $(".breakout"),
      x = c.getContext("2d");
    let paddle = 280,
      ball = { x: 330, y: 350, vx: settings.speed, vy: -settings.speed },
      score = 0,
      life = settings.life,
      raf,
      keys = {};
    let bricks = [];
    for (let r = 0; r < settings.rows; r++)
      for (let col = 0; col < 10; col++)
        bricks.push({
          x: 15 + col * 64,
          y: 20 + r * 32,
          on: true,
          color: ["#ef4938", "#f5bd31", "#39a66b", "#3569d4", "#ef4938", "#a35bd4"][r],
        });
    const move = (e) => {
      const rect = c.getBoundingClientRect(),
        client = e.touches ? e.touches[0].clientX : e.clientX;
      paddle = Math.max(
        0,
        Math.min(560, ((client - rect.left) * 660) / rect.width - 50),
      );
    };
    c.onmousemove = move;
    c.ontouchmove = (e) => {
      e.preventDefault();
      move(e);
    };
    onkeydown = (e) => (keys[e.key] = 1);
    onkeyup = (e) => (keys[e.key] = 0);
    function loop() {
      if (keys.ArrowLeft) paddle -= 7;
      if (keys.ArrowRight) paddle += 7;
      paddle = Math.max(0, Math.min(560, paddle));
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.x < 8 || ball.x > 652) ball.vx *= -1;
      if (ball.y < 8) ball.vy *= -1;
      if (
        ball.y > 388 &&
        ball.y < 410 &&
        ball.x > paddle &&
        ball.x < paddle + 100
      ) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - (paddle + 50)) * 0.03;
        beep(420);
      }
      for (const b of bricks)
        if (
          b.on &&
          ball.x > b.x &&
          ball.x < b.x + 55 &&
          ball.y > b.y &&
          ball.y < b.y + 22
        ) {
          b.on = false;
          ball.vy *= -1;
          score += 10;
          $("#bScore").textContent = score;
          beep(650);
          break;
        }
      if (ball.y > 440) {
        life--;
        $("#bLife").textContent = life;
        if (!life) {
          cancelAnimationFrame(raf);
          result(g, `${score}点`, score, false, "次は全消しを狙おう！");
          return;
        }
        ball = {
          x: 330,
          y: 350,
          vx: settings.speed * (Math.random() < 0.5 ? -1 : 1),
          vy: -settings.speed,
        };
      }
      x.fillStyle = "#17191e";
      x.fillRect(0, 0, 660, 430);
      for (const b of bricks)
        if (b.on) {
          x.fillStyle = b.color;
          x.fillRect(b.x, b.y, 55, 22);
        }
      x.fillStyle = "#fff";
      x.fillRect(paddle, 400, 100, 12);
      x.beginPath();
      x.arc(ball.x, ball.y, 8, 0, 7);
      x.fill();
      if (!bricks.some((b) => b.on)) {
        cancelAnimationFrame(raf);
        result(g, `${score + 100}点`, score + 100, false, "ALL CLEAR!");
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
    cleanup = () => {
      cancelAnimationFrame(raf);
      onkeydown = null;
      onkeyup = null;
    };
  },
};

