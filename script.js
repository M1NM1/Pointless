// ============================================================
  // DATA
  // ============================================================
  let questions = [];
  let currentQIndex = 0;
  let isPlayMode = false;
  let isAnimating = false;

  function loadData() {
    try {
      const stored = localStorage.getItem('pointless_questions');
      questions = stored ? JSON.parse(stored) : [];
    } catch(e) { questions = []; }
  }

  function saveData() {
    localStorage.setItem('pointless_questions', JSON.stringify(questions));
  }

  // ============================================================
  // ADMIN MODE
  // ============================================================
  function addAnswerRow() {
    const container = document.getElementById('answers-container');
    const row = document.createElement('div');
    row.className = 'answer-row';
    row.innerHTML = `
      <input type="text" placeholder="Answer" class="ans-text">
      <input type="number" placeholder="Pts" class="ans-pts" min="0" max="100">
      <button class="btn-remove-answer" onclick="removeAnswerRow(this)">×</button>
    `;
    container.appendChild(row);
  }

  function removeAnswerRow(btn) {
    const rows = document.querySelectorAll('.answer-row');
    if (rows.length <= 1) { showToast('Need at least one answer row'); return; }
    btn.closest('.answer-row').remove();
  }

  function saveQuestion() {
    const title = document.getElementById('q-title').value.trim();
    if (!title) { showToast('Enter a question title!'); return; }

    const rows = document.querySelectorAll('.answer-row');
    const answers = [];
    let valid = true;

    rows.forEach(row => {
      const text = row.querySelector('.ans-text').value.trim();
      const pts  = parseInt(row.querySelector('.ans-pts').value);
      if (text && !isNaN(pts)) {
        answers.push({ text, pts: Math.max(0, Math.min(100, pts)) });
      }
    });

    if (answers.length === 0) { showToast('Add at least one valid answer!'); return; }

    questions.push({ title, answers });
    saveData();
    renderSavedList();

    // Reset form
    document.getElementById('q-title').value = '';
    document.getElementById('answers-container').innerHTML = `
      <div class="answer-row">
        <input type="text" placeholder="Answer" class="ans-text">
        <input type="number" placeholder="Pts" class="ans-pts" min="0" max="100">
        <button class="btn-remove-answer" onclick="removeAnswerRow(this)">×</button>
      </div>`;

    showToast('Question saved!');
  }

  function deleteQuestion(index) {
    questions.splice(index, 1);
    saveData();
    renderSavedList();
  }

  function renderSavedList() {
    const list = document.getElementById('saved-list');
    document.getElementById('q-count').textContent = questions.length;

    if (questions.length === 0) {
      list.innerHTML = '<div class="empty-state">No questions saved yet.</div>';
      return;
    }

    list.innerHTML = questions.map((q, i) => `
      <div class="saved-q-card">
        <div>
          <div class="q-title">${escHtml(q.title)}</div>
          <div class="q-count">${q.answers.length} answer${q.answers.length !== 1 ? 's' : ''}</div>
        </div>
        <button class="btn-del-q" onclick="deleteQuestion(${i})">Delete</button>
      </div>
    `).join('');
  }

  function confirmClearAll() {
    if (questions.length === 0) { showToast('Nothing to clear'); return; }
    if (confirm('Clear ALL saved questions? This cannot be undone.')) {
      questions = [];
      saveData();
      renderSavedList();
      if (isPlayMode) renderPlayMode();
      showToast('All questions cleared');
    }
  }

  // ============================================================
  // MODE TOGGLE
  // ============================================================
  function toggleMode() {
    isPlayMode = !isPlayMode;
    document.getElementById('admin-mode').style.display = isPlayMode ? 'none' : 'block';
    document.getElementById('play-mode').style.display   = isPlayMode ? 'flex' : 'none';
    document.getElementById('mode-badge').textContent = isPlayMode ? 'PLAY' : 'ADMIN';
    document.getElementById('btn-next').style.display = isPlayMode ? 'inline-flex' : 'none';

    if (isPlayMode) {
      currentQIndex = 0;
      renderPlayMode();
    }
  }

  // ============================================================
  // PLAY MODE
  // ============================================================
  function renderPlayMode() {
    const area = document.getElementById('play-q-area');
    resetColumn();

    if (questions.length === 0) {
      area.innerHTML = `
        <div class="no-questions">
          <div class="icon">📋</div>
          <h2>No Questions Yet</h2>
          <p>Switch to Admin Mode and add some questions first.</p>
        </div>`;
      document.getElementById('answer-input').style.display = 'none';
      document.getElementById('btn-submit').style.display = 'none';
      document.getElementById('score-area') && (document.querySelector('.score-area').style.display = 'none');
      return;
    }

    document.getElementById('answer-input').style.display = '';
    document.getElementById('btn-submit').style.display = '';
    document.querySelector('.score-area').style.display = '';

    const q = questions[currentQIndex];
    area.innerHTML = `
      <div class="play-q-label">Question ${currentQIndex + 1} of ${questions.length}</div>
      <div class="play-q-text">${escHtml(q.title)}</div>
      <div class="q-nav">Type an answer and click CHECK</div>
    `;

    document.getElementById('answer-input').value = '';
    document.getElementById('result-display').innerHTML = '';
    document.getElementById('answer-input').focus();

    buildTickMarks();
    buildSideLabels();
    setColumnHeight(0, false);
    document.getElementById('score-display').textContent = '—';
  }

  function buildTickMarks() {
    const container = document.getElementById('tick-marks');
    container.innerHTML = '';
    for (let v = 0; v <= 100; v += 5) {
      const pct = v / 100;
      const tick = document.createElement('div');
      tick.className = 'tick' + (v % 25 === 0 ? ' major' : '');
      tick.style.bottom = (pct * 100) + '%';
      container.appendChild(tick);

      if (v % 25 === 0) {
        const lbl = document.createElement('div');
        lbl.className = 'tick-label';
        lbl.style.bottom = (pct * 100) + '%';
        lbl.textContent = v;
        container.appendChild(lbl);
      }
    }
  }

  function buildSideLabels() {
    const container = document.getElementById('side-labels');
    container.innerHTML = '';
    [100, 75, 50, 25, 0].forEach(v => {
      const lbl = document.createElement('div');
      lbl.className = 'side-label';
      lbl.textContent = v;
      container.appendChild(lbl);
    });
  }

  function resetColumn() {
    const fill = document.getElementById('score-fill');
    fill.style.height = '0%';
    fill.className = 'score-column-fill';
    document.getElementById('col-glow').className = 'col-glow-effect';
    document.getElementById('score-display').textContent = '—';
    document.getElementById('score-display').style.color = '';
  }

  function setColumnHeight(pct, animated) {
    const fill = document.getElementById('score-fill');
    fill.style.transition = animated ? 'height 0.05s linear' : 'none';
    fill.style.height = pct + '%';
  }

  function submitAnswer() {
    if (isAnimating) return;
    if (questions.length === 0) return;

    const input = document.getElementById('answer-input');
    const typed = input.value.trim().toLowerCase();
    if (!typed) { showToast('Type an answer first'); return; }

    const q = questions[currentQIndex];
    const match = q.answers.find(a => a.text.toLowerCase() === typed);

    document.getElementById('btn-submit').disabled = true;
    document.getElementById('answer-input').disabled = true;

    if (!match) {
      // Wrong answer
      animateWrong(typed);
    } else {
      // Correct — animate column
      animateColumn(match.pts, typed);
    }
  }

  function animateColumn(targetScore, answerText) {
    isAnimating = true;
    const fill = document.getElementById('score-fill');
    const scoreNum = document.getElementById('score-display');
    fill.className = 'score-column-fill'; // reset classes

    let current = 100;
    const totalTime = 3500; // ms
    const steps = 80;
    const intervalMs = totalTime / steps;

    setColumnHeight(100, false);
    scoreNum.textContent = '100';

    const diff = current - targetScore;
    const stepSize = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.max(targetScore, 100 - stepSize * step);
      setColumnHeight(current, true);
      scoreNum.textContent = Math.round(current);

      if (Math.round(current) <= targetScore) {
        clearInterval(interval);
        current = targetScore;
        setColumnHeight(current, false);
        scoreNum.textContent = targetScore;
        isAnimating = false;

        // Final state
        if (targetScore === 0) {
          triggerPointless(answerText);
        } else {
          showResult(answerText, targetScore, 'correct');
          document.getElementById('btn-submit').disabled = false;
          document.getElementById('answer-input').disabled = false;
          document.getElementById('answer-input').value = '';
          document.getElementById('answer-input').focus();
        }
      }
    }, intervalMs);
  }

  function animateWrong(answerText) {
    isAnimating = true;
    const fill = document.getElementById('score-fill');
    const scoreNum = document.getElementById('score-display');

    // Quick rise to 100
    fill.className = 'score-column-fill wrong';
    setColumnHeight(100, false);
    setTimeout(() => setColumnHeight(100, false), 10);
    scoreNum.textContent = '×';
    scoreNum.style.color = 'var(--col-red)';

    showResult(answerText, null, 'wrong');
    isAnimating = false;

    setTimeout(() => {
      document.getElementById('btn-submit').disabled = false;
      document.getElementById('answer-input').disabled = false;
      scoreNum.style.color = '';
      document.getElementById('answer-input').value = '';
      setColumnHeight(0, true);
      scoreNum.textContent = '—';
      fill.className = 'score-column-fill';
      document.getElementById('result-display').innerHTML = '';
      document.getElementById('answer-input').focus();
    }, 2200);
  }

  function showResult(answer, score, type) {
    const display = document.getElementById('result-display');

    if (type === 'wrong') {
      display.innerHTML = `
        <div class="wrong-x">✗</div>
        <div class="result-answer" style="color:#ff6666">${escHtml(answer)}</div>
        <div class="result-tag wrong">Not on the board</div>
      `;
    } else if (type === 'correct') {
      display.innerHTML = `
        <div class="result-answer">${escHtml(answer)}</div>
        <div class="result-tag correct">${score} point${score !== 1 ? 's' : ''}</div>
      `;
    }
  }

  function triggerPointless(answerText) {
    const fill = document.getElementById('score-fill');
    fill.className = 'score-column-fill pointless';
    document.getElementById('col-glow').className = 'col-glow-effect active';
    document.getElementById('score-display').textContent = '0';
    document.getElementById('score-display').style.color = 'var(--col-gold)';

    spawnParticles();

    setTimeout(() => {
      document.getElementById('pointless-banner').classList.add('visible');
    }, 400);
  }

  function dismissBanner() {
    document.getElementById('pointless-banner').classList.remove('visible');
    document.getElementById('col-glow').className = 'col-glow-effect';
    document.getElementById('score-fill').className = 'score-column-fill';
    document.getElementById('score-display').style.color = '';
    setColumnHeight(0, false);
    document.getElementById('score-display').textContent = '—';
    document.getElementById('result-display').innerHTML = '';
    document.getElementById('answer-input').value = '';
    document.getElementById('btn-submit').disabled = false;
    document.getElementById('answer-input').disabled = false;
    document.getElementById('answer-input').focus();
    document.getElementById('particles').innerHTML = '';
  }

  function nextQuestion() {
    if (questions.length === 0) return;
    currentQIndex = (currentQIndex + 1) % questions.length;
    renderPlayMode();
  }

  // ============================================================
  // PARTICLES
  // ============================================================
  function spawnParticles() {
    const container = document.getElementById('particles');
    container.innerHTML = '';
    const colors = ['#ffd700', '#ffec6e', '#fff8c0', '#ffaa00', '#ff6600'];

    for (let i = 0; i < 80; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const tx = (Math.random() - 0.5) * 400 + 'px';
      const ty = -(Math.random() * 500 + 100) + 'px';
      const dur = (Math.random() * 2 + 1.5) + 's';
      p.style.cssText = `left:${x}px;top:${y}px;background:${colors[Math.floor(Math.random()*colors.length)]};--tx:${tx};--ty:${ty};--dur:${dur};animation-delay:${Math.random()*0.5}s`;
      container.appendChild(p);
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // Enter key support
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && isPlayMode && !isAnimating) {
      if (document.activeElement === document.getElementById('answer-input')) {
        submitAnswer();
      }
    }
  });

  // ============================================================
  // INIT
  // ============================================================
  loadData();
  renderSavedList();
