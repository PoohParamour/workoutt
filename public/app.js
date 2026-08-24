// State
let state = {
  token: localStorage.getItem('kinetic_token'),
  program: null,
  currentWeek: 1,
  currentDay: 'tue',
  currentZone: 'upper',
  logs: [],
  timerInterval: null
};

const API_HEADERS = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${state.token}`
});

// Elements
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const authForm = document.getElementById('auth-form');
const passcodeInput = document.getElementById('passcode');
const exercisesContainer = document.getElementById('exercises-container');
const timerDisplay = document.getElementById('timer-display');
const restTimer = document.getElementById('rest-timer');
const progressChartCanvas = document.getElementById('progressChart');
let chartInstance = null;

// Initialization
async function init() {
  if (state.token) {
    showMainScreen();
    await loadProgram();
    renderDay();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  authScreen.classList.remove('hidden');
  mainScreen.classList.add('hidden');
}

function showMainScreen() {
  authScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
}

// Auth
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const passcode = passcodeInput.value;
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    const data = await res.json();
    if (data.success) {
      state.token = data.token;
      localStorage.setItem('kinetic_token', data.token);
      showMainScreen();
      await loadProgram();
      renderDay();
    } else {
      alert('INVALID PASSCODE');
    }
  } catch (err) {
    console.error(err);
  }
});

// Navigation
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-tab').forEach(b => {
      b.classList.remove('text-accent', 'border-b-4', 'border-accent');
      b.classList.add('text-muted-foreground');
    });
    e.target.classList.remove('text-muted-foreground');
    e.target.classList.add('text-accent', 'border-b-4', 'border-accent');
    
    document.getElementById('view-program').classList.add('hidden');
    document.getElementById('view-progress').classList.add('hidden');
    document.getElementById('view-nutrition').classList.add('hidden');
    
    const tab = e.target.dataset.tab;
    document.getElementById(`view-${tab}`).classList.remove('hidden');
    
    if (tab === 'progress') {
      renderProgressSelect();
    }
  });
});

document.querySelectorAll('.week-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.week-btn').forEach(b => {
      b.classList.remove('bg-accent', 'text-accent-foreground');
    });
    e.target.classList.add('bg-accent', 'text-accent-foreground');
    state.currentWeek = parseInt(e.target.dataset.week);
    renderDay();
  });
});

document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Find closest day-btn in case click was on child element
    const btnEl = e.target.closest('.day-btn');
    document.querySelectorAll('.day-btn').forEach(b => {
      b.classList.remove('text-accent');
    });
    btnEl.classList.add('text-accent');
    state.currentDay = btnEl.dataset.day;
    state.currentZone = ['tue', 'thu'].includes(state.currentDay) ? 'upper' : 'lower';
    renderDay();
  });
});

// Data Loading
async function loadProgram() {
  const res = await fetch('/api/program', { headers: API_HEADERS() });
  state.program = await res.json();
}

async function loadLogsForCurrentView() {
  const exercises = state.program[state.currentZone];
  state.logs = {};
  
  // Load current week logs
  for (const ex of exercises) {
    const res = await fetch(`/api/logs?week=${state.currentWeek}&exercise_id=${ex.id}`, { headers: API_HEADERS() });
    state.logs[ex.id] = await res.json();
  }
  
  // Load previous week logs for progression logic (if not week 1)
  if (state.currentWeek > 1) {
    state.prevLogs = {};
    for (const ex of exercises) {
      const res = await fetch(`/api/logs?week=${state.currentWeek - 1}&exercise_id=${ex.id}`, { headers: API_HEADERS() });
      state.prevLogs[ex.id] = await res.json();
    }
  }
}

// Rendering
async function renderDay() {
  exercisesContainer.innerHTML = '<div class="text-2xl animate-pulse font-bold tracking-tighter">LOADING...</div>';
  await loadLogsForCurrentView();
  
  const exercises = state.program[state.currentZone];
  exercisesContainer.innerHTML = '';
  
  exercises.forEach(ex => {
    const logs = state.logs[ex.id] || [];
    let progressionBadge = '';
    
    if (state.currentWeek > 1 && state.prevLogs && state.prevLogs[ex.id]) {
      const prevLogs = state.prevLogs[ex.id];
      if (prevLogs.length === ex.sets) {
        // Check if all sets hit max reps
        const maxReps = ex.rep_range[1];
        const allHitMax = prevLogs.every(l => l.reps >= maxReps);
        if (allHitMax) {
          progressionBadge = `<div class="bg-accent text-black text-xs md:text-sm font-bold px-3 py-1 uppercase tracking-tighter self-start mt-4 inline-block">RECOMMENDED: +5lbs</div>`;
        } else {
          progressionBadge = `<div class="bg-muted text-foreground border border-border text-xs md:text-sm font-bold px-3 py-1 uppercase tracking-tighter self-start mt-4 inline-block">RECOMMENDED: INCREASE REPS</div>`;
        }
      }
    }

    const card = document.createElement('div');
    card.className = 'border-2 border-border p-8 md:p-12 bg-background hover:bg-accent hover:border-accent transition-colors duration-300 relative overflow-hidden group kinetic-card-container';
    
    let setsHtml = '';
    for (let i = 1; i <= ex.sets; i++) {
      const log = logs.find(l => l.set_number === i) || { weight_lbs: '', reps: '' };
      setsHtml += `
        <div class="flex flex-col md:flex-row gap-4 items-start md:items-end mb-8 md:mb-4 relative z-10 transition-colors duration-300 border-b border-border md:border-0 pb-6 md:pb-0">
          <div class="w-full md:w-12 text-2xl font-bold text-muted-foreground group-hover:text-accent-foreground transition-colors duration-300">S${i}</div>
          <div class="flex w-full md:flex-1 gap-4">
            <div class="flex-1">
              <label class="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-accent-foreground transition-colors duration-300">LBS</label>
              <input type="number" step="0.5" data-ex="${ex.id}" data-set="${i}" data-type="weight" value="${log.weight_lbs}" class="w-full h-14 bg-transparent border-b-2 border-border text-3xl font-bold px-2 focus:outline-none focus:border-accent group-hover:border-accent-foreground group-hover:text-accent-foreground placeholder:text-muted transition-colors duration-300">
            </div>
            <div class="flex-1">
              <label class="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-accent-foreground transition-colors duration-300">REPS</label>
              <input type="number" data-ex="${ex.id}" data-set="${i}" data-type="reps" value="${log.reps}" class="w-full h-14 bg-transparent border-b-2 border-border text-3xl font-bold px-2 focus:outline-none focus:border-accent group-hover:border-accent-foreground group-hover:text-accent-foreground placeholder:text-muted transition-colors duration-300">
            </div>
          </div>
          <button onclick="saveLog('${ex.id}', ${i}, ${ex.rest_seconds})" class="kinetic-btn w-full md:w-auto h-14 px-8 bg-border text-foreground font-bold hover:bg-accent hover:text-black uppercase tracking-tighter text-xl">LOG</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="absolute -right-8 -top-8 text-[12rem] font-bold text-muted opacity-20 pointer-events-none select-none transition-colors duration-300 group-hover:text-accent-foreground">${ex.sets}</div>
      <div class="relative z-10 flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h3 class="text-5xl md:text-6xl font-bold uppercase tracking-tighter mb-2 transition-colors duration-300 group-hover:text-accent-foreground">${ex.name}</h3>
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-lg md:text-xl text-muted-foreground uppercase font-bold tracking-tight transition-colors duration-300 group-hover:text-accent-foreground/80">
            <span>${ex.sets} × ${ex.rep_range[0]}-${ex.rep_range[1]}</span>
            <span class="text-border group-hover:text-accent-foreground hidden md:inline">•</span>
            <span>REST ${ex.rest_seconds}S</span>
            <span class="text-border group-hover:text-accent-foreground hidden md:inline">•</span>
            <span>${ex.type}</span>
          </div>
          ${progressionBadge}
        </div>
      </div>
      <div class="space-y-4 mt-8">
        ${setsHtml}
      </div>
    `;
    exercisesContainer.appendChild(card);
  });
}

window.saveLog = async function(exercise_id, set_number, rest_seconds) {
  const weightInput = document.querySelector(`input[data-ex="${exercise_id}"][data-set="${set_number}"][data-type="weight"]`);
  const repsInput = document.querySelector(`input[data-ex="${exercise_id}"][data-set="${set_number}"][data-type="reps"]`);
  
  const weight_lbs = parseFloat(weightInput.value);
  const reps = parseInt(repsInput.value);
  
  if (isNaN(weight_lbs) || isNaN(reps)) {
    alert('Please enter valid weight and reps');
    return;
  }
  
  // Highlight as saved
  weightInput.classList.add('text-accent');
  repsInput.classList.add('text-accent');
  setTimeout(() => {
    weightInput.classList.remove('text-accent');
    repsInput.classList.remove('text-accent');
  }, 500);

  try {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: API_HEADERS(),
      body: JSON.stringify({
        week: state.currentWeek,
        day: state.currentDay,
        exercise_id,
        set_number,
        weight_lbs,
        reps
      })
    });
    
    if (res.status === 401) {
      alert("Session expired");
      localStorage.removeItem('kinetic_token');
      window.location.reload();
      return;
    }
    
    startTimer(rest_seconds);
  } catch (err) {
    console.error(err);
    alert('Failed to save log');
  }
}

// Timer
function startTimer(seconds) {
  restTimer.classList.remove('hidden');
  restTimer.scrollIntoView({ behavior: 'smooth' });
  
  let timeLeft = seconds;
  if (state.timerInterval) clearInterval(state.timerInterval);
  
  const updateDisplay = () => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
  };
  
  updateDisplay();
  
  state.timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
      clearInterval(state.timerInterval);
      timerDisplay.textContent = 'GO';
      setTimeout(() => {
        restTimer.classList.add('hidden');
      }, 5000);
    }
  }, 1000);
}

// Progress View
function renderProgressSelect() {
  const select = document.getElementById('progress-exercise-select');
  select.innerHTML = '';
  if (!state.program) return;
  
  ['upper', 'lower'].forEach(zone => {
    const group = document.createElement('optgroup');
    group.label = zone.toUpperCase();
    state.program[zone].forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = ex.name;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
  
  select.addEventListener('change', (e) => loadProgressChart(e.target.value));
  loadProgressChart(select.value);
}

async function loadProgressChart(exercise_id) {
  const res = await fetch(`/api/progress/${exercise_id}`, { headers: API_HEADERS() });
  const data = await res.json();
  
  const labels = [1, 2, 3, 4].map(w => `WK ${w}`);
  const weightData = [null, null, null, null];
  
  data.forEach(d => {
    if (d.week >= 1 && d.week <= 4) {
      weightData[d.week - 1] = d.max_weight;
    }
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(progressChartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'MAX WEIGHT (LBS)',
        data: weightData,
        borderColor: '#DFE104',
        backgroundColor: '#DFE104',
        borderWidth: 4,
        pointRadius: 8,
        pointBackgroundColor: '#09090B',
        pointBorderColor: '#DFE104',
        pointBorderWidth: 4,
        tension: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: '#3F3F46' },
          ticks: { color: '#A1A1AA', font: { family: 'Space Grotesk', size: 14, weight: 'bold' } }
        },
        x: {
          grid: { color: '#3F3F46' },
          ticks: { color: '#A1A1AA', font: { family: 'Space Grotesk', size: 14, weight: 'bold' } }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#FAFAFA', font: { family: 'Space Grotesk', size: 16, weight: 'bold' } }
        }
      }
    }
  });
}

init();
