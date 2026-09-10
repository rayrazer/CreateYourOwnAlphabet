// Script principal - v2
const $ = (id) => document.getElementById(id);

const GRID_COLS = 7;
const BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Alfabetos predefinidos (conjuntos de caracteres selecionáveis)
const PRESET_ALPHABETS = [
    { id: 'latino', name: 'Alfabeto Normal', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
    { id: 'mexicano', name: 'Mexicano', chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('') },
    { id: 'grego', name: 'Grego', chars: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'.split('') },
    { id: 'russo', name: 'Russo (Cirílico)', chars: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('') },
    { id: 'japones', name: 'Japonês (Katakana)', chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('') },
    { id: 'arabe', name: 'Árabe', chars: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('') }
];

// Elementos da interface
const home = $('home');
const modal = $('modal');
const modalClose = $('modalClose');
const viewAlphabet = $('view-alphabet');
const viewEditor = $('view-editor');
const viewImport = $('view-import');
const alphabetList = $('alphabetList');
const editorTitle = $('editorTitle');
const letterLabel = $('letterLabel');
const referencePanel = $('referencePanel');

const showCanvas = $('show_letter');
const drawCanvas = $('draw_letter');
const showCtx = showCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');

const prevBtn = $('previus');
const nextBtn = $('next');
const saveBtn = $('save');
const saveLetterBtn = $('saveLetter');
const clearBtn = $('clear');
const addLetterBtn = $('addLetter');
const deleteLetterBtn = $('deleteLetter');
const toolBrush = $('toolBrush');
const toolEraser = $('toolEraser');
const colorInput = $('color');
const lineWidthInput = $('lineWidth');
const transparentInput = $('transparent');
const importFileInput = $('importFile');
const importZipBtn = $('importZip');
const importAndEditBtn = $('importAndEdit');
const importStatus = $('importStatus');

// Estado da aplicação
const state = {
    mode: null,          // 'preset' | 'custom' | 'import'
    alphabet: null,      // { name, letters: [{ char, draws, bg, work }] }
    currentIndex: 0,
    tool: 'brush'
};

let drawing = false;
let currentStroke = null;
let lastPoint = null;

/* ---------------------- Utilitários de canvas ---------------------- */

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
}

function paintObject(ctx, obj, w, h) {
    if (obj.points.length === 1) {
        ctx.beginPath();
        ctx.arc(obj.points[0].x * w, obj.points[0].y * h,
            Math.max(1, (obj.width / 2) * w), 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x * w, obj.points[0].y * h);
        for (let i = 1; i < obj.points.length; i++) {
            ctx.lineTo(obj.points[i].x * w, obj.points[i].y * h);
        }
        ctx.stroke();
    }
}

// Desenha objetos vetoriais (strokes) num canvas de tamanho w x h.
// Coordenadas são normalizadas (0..1); a borracha usa destination-out.
function drawAllObjects(ctx, objects, w, h) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const obj of objects) {
        ctx.save();
        if (obj.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000';
            ctx.fillStyle = '#000';
        } else {
            ctx.strokeStyle = obj.color;
            ctx.fillStyle = obj.color;
        }
        ctx.lineWidth = Math.max(1, obj.width * w);
        paintObject(ctx, obj, w, h);
        ctx.restore();
    }
}

function currentLetter() {
    return state.alphabet.letters[state.currentIndex];
}

/* ---------------------- Renderização ---------------------- */

function drawShowLetter() {
    if (state.mode !== 'preset') return;
    resizeCanvas(showCanvas);
    showCtx.clearRect(0, 0, showCanvas.width, showCanvas.height);

    const letter = currentLetter();
    const size = Math.min(showCanvas.width, showCanvas.height) * 0.7;
    showCtx.font = `bold ${size}px sans-serif`;
    showCtx.fillStyle = '#3f51b5';
    showCtx.textAlign = 'center';
    showCtx.textBaseline = 'middle';
    showCtx.fillText(
        letter.char,
        showCanvas.width / 2,
        showCanvas.height / 2 + (size * 0.05)
    );
}

function redrawDrawCanvas() {
    resizeCanvas(drawCanvas);
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    const letter = currentLetter();
    const w = drawCanvas.width;
    const h = drawCanvas.height;

    if (state.mode === 'import') {
        if (!letter.work) initWork(letter);
        drawCtx.drawImage(letter.work, 0, 0, w, h);
    } else {
        drawAllObjects(drawCtx, letter.draws, w, h);
    }
}

function render() {
    const letters = state.alphabet.letters;
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = state.currentIndex === letters.length - 1;

    const letter = letters[state.currentIndex];
    letterLabel.textContent = `Letra ${letter.char} (${state.currentIndex + 1}/${letters.length})`;
    drawShowLetter();
    redrawDrawCanvas();
}

function changeLetter(dir) {
    state.currentIndex += dir;
    render();
}

/* ---------------------- Desenho (vetorial) ---------------------- */

function getPos(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height
    };
}

function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    lastPoint = pos;

    if (state.mode === 'import') {
        const letter = currentLetter();
        if (!letter.work) initWork(letter);
        paintWorkDot(pos);
        return;
    }

    currentStroke = {
        type: state.tool === 'eraser' ? 'eraser' : 'stroke',
        color: colorInput.value,
        width: parseFloat(lineWidthInput.value) / drawCanvas.width,
        points: [{ x: pos.x, y: pos.y }]
    };
    currentLetter().draws.push(currentStroke);
    redrawDrawCanvas();
}

function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);

    if (state.mode === 'import') {
        paintWorkSegment(pos);
        lastPoint = pos;
        return;
    }

    currentStroke.points.push({ x: pos.x, y: pos.y });
    redrawDrawCanvas();
}

function endDraw() {
    drawing = false;
    currentStroke = null;
}

/* ---------------------- Desenho (raster - importação) ---------------------- */

// Prepara o canvas de trabalho de uma letra importada a partir da imagem original.
function initWork(letter) {
    const size = letter.bg ? letter.bg.width : 200;
    letter.work = makeCanvas(size, size);
    const wctx = letter.work.getContext('2d');
    if (letter.bg) wctx.drawImage(letter.bg, 0, 0);
}

function workCtx() {
    const letter = currentLetter();
    if (!letter.work) initWork(letter);
    return { ctx: letter.work.getContext('2d'), w: letter.work.width, h: letter.work.height };
}

// Escala entre o canvas de trabalho (pixels) e o canvas visível.
// A largura do traço é definida em relação ao canvas que o usuário vê.
function workPixelWidth() {
    const letter = currentLetter();
    if (!letter.work) initWork(letter);
    const w = letter.work.width;
    return parseFloat(lineWidthInput.value) * (w / (drawCanvas.width || w));
}

function paintWorkSegment(pos) {
    const { ctx, w, h } = workCtx();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = state.tool === 'eraser' ? '#000' : colorInput.value;
    ctx.lineWidth = Math.max(1, workPixelWidth());
    ctx.beginPath();
    ctx.moveTo(lastPoint.x * w, lastPoint.y * h);
    ctx.lineTo(pos.x * w, pos.y * h);
    ctx.stroke();
    ctx.restore();
    redrawDrawCanvas();
}

function paintWorkDot(pos) {
    const { ctx, w, h } = workCtx();
    ctx.save();
    ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = state.tool === 'eraser' ? '#000' : colorInput.value;
    const r = Math.max(1, workPixelWidth() / 2);
    ctx.beginPath();
    ctx.arc(pos.x * w, pos.y * h, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    redrawDrawCanvas();
}

/* ---------------------- Eventos de desenho ---------------------- */

drawCanvas.addEventListener('mousedown', startDraw);
drawCanvas.addEventListener('mousemove', moveDraw);
drawCanvas.addEventListener('mouseup', endDraw);
drawCanvas.addEventListener('mouseleave', endDraw);
drawCanvas.addEventListener('touchstart', startDraw);
drawCanvas.addEventListener('touchmove', moveDraw);
drawCanvas.addEventListener('touchend', endDraw);

prevBtn.addEventListener('click', () => changeLetter(-1));
nextBtn.addEventListener('click', () => changeLetter(1));

clearBtn.addEventListener('click', () => {
    if (state.mode === 'import') {
        initWork(currentLetter());
    } else {
        currentLetter().draws = [];
    }
    redrawDrawCanvas();
});

toolBrush.addEventListener('click', () => {
    state.tool = 'brush';
    toolBrush.classList.add('active');
    toolEraser.classList.remove('active');
});

toolEraser.addEventListener('click', () => {
    state.tool = 'eraser';
    toolEraser.classList.add('active');
    toolBrush.classList.remove('active');
});

addLetterBtn.addEventListener('click', () => {
    const n = state.alphabet.letters.length;
    const char = n < BASE_CHARS.length ? BASE_CHARS[n] : `#${n + 1}`;
    state.alphabet.letters.push({ char, draws: [], bg: null });
    state.currentIndex = state.alphabet.letters.length - 1;
    render();
});

deleteLetterBtn.addEventListener('click', () => {
    if (state.alphabet.letters.length <= 1) return;
    state.alphabet.letters.splice(state.currentIndex, 1);
    if (state.currentIndex >= state.alphabet.letters.length) {
        state.currentIndex = state.alphabet.letters.length - 1;
    }
    render();
});

/* ---------------------- Exportação ---------------------- */

// Renderiza os traços (com borracha) numa camada transparente,
// para que a borracha apague apenas o rastro do pincel, nunca o fundo.
function drawStrokeLayer(objects, size) {
    const layer = makeCanvas(size, size);
    const lctx = layer.getContext('2d');
    drawAllObjects(lctx, objects, size, size);
    return layer;
}

function getLetterImage(letter, cellSize) {
    const img = makeCanvas(cellSize, cellSize);
    const ctx = img.getContext('2d');

    if (state.mode === 'import') {
        if (!letter.work) initWork(letter);
        if (!transparentInput.checked) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, cellSize, cellSize);
        }
        ctx.drawImage(letter.work, 0, 0, cellSize, cellSize);
    } else {
        const layer = drawStrokeLayer(letter.draws, cellSize);
        if (!transparentInput.checked) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, cellSize, cellSize);
        }
        ctx.drawImage(layer, 0, 0);
    }
    return img;
}

function buildGridCanvas(cellSize) {
    const rows = Math.max(1, Math.ceil(state.alphabet.letters.length / GRID_COLS));
    const img = makeCanvas(GRID_COLS * cellSize, rows * cellSize);
    const ctx = img.getContext('2d');

    if (!transparentInput.checked) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, img.width, img.height);
    }

    state.alphabet.letters.forEach((letter, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        if (state.mode === 'import') {
            if (!letter.work) initWork(letter);
            ctx.drawImage(letter.work, col * cellSize, row * cellSize, cellSize, cellSize);
        } else {
            ctx.drawImage(drawStrokeLayer(letter.draws, cellSize), col * cellSize, row * cellSize);
        }
    });

    return img;
}

function downloadDataURL(dataURL, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
}

function sanitizeName(name) {
    return (name || 'meu-alfabeto')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'meu-alfabeto';
}

saveLetterBtn.addEventListener('click', () => {
    const img = getLetterImage(currentLetter(), 200);
    downloadDataURL(img.toDataURL('image/png'), `letra-${currentLetter().char}.png`);
});

saveBtn.addEventListener('click', () => {
    const img = buildGridCanvas(200);
    downloadDataURL(img.toDataURL('image/png'), `${sanitizeName(state.alphabet.name)}.png`);
});

/* ---------------------- Importação ---------------------- */

// Calcula a grade de corte de uma imagem no formato 7 colunas.
// As células são quadradas (largura da imagem ÷ 7). As linhas são
// derivadas da altura: rows = floor(altura da imagem ÷ tamanho da célula).
// Assim alfabetos maiores que 28 caracteres também são cortados por completo.
function computeGrid(img) {
    const cols = GRID_COLS;
    const size = Math.max(1, Math.floor(img.width / cols));
    const rows = Math.max(1, Math.floor(img.height / size));
    const offsetX = Math.floor((img.width - size * cols) / 2);
    const offsetY = Math.floor((img.height - size * rows) / 2);
    return { cols, rows, size, offsetX, offsetY, total: cols * rows };
}

function extractCells(img) {
    const { cols, rows, size, offsetX, offsetY, total } = computeGrid(img);
    const cells = [];
    for (let i = 0; i < total; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cell = makeCanvas(size, size);
        const cctx = cell.getContext('2d');
        cctx.drawImage(img, offsetX + col * size, offsetY + row * size, size, size, 0, 0, size, size);
        cells.push(cell);
    }
    return cells;
}

function readImageFile(file, onOk, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => onOk(img);
        img.onerror = () => onError('Não foi possível carregar a imagem.');
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

importZipBtn.addEventListener('click', () => {
    const file = importFileInput.files[0];
    if (!file) {
        setImportStatus('Selecione uma imagem primeiro.', true);
        return;
    }

    setImportStatus('Processando...');
    readImageFile(file, (img) => {
        const cells = extractCells(img);
        const zip = new JSZip();
        cells.forEach((cell, i) => {
            const dataURL = cell.toDataURL('image/png');
            zip.file(`${String(i + 1).padStart(2, '0')}.png`, dataURL.split(',')[1], { base64: true });
        });
        zip.generateAsync({ type: 'blob' }).then((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'letras.zip';
            link.click();
            URL.revokeObjectURL(url);
            setImportStatus('ZIP gerado com sucesso!');
        });
    }, (msg) => setImportStatus(msg, true));
});

importAndEditBtn.addEventListener('click', () => {
    const file = importFileInput.files[0];
    if (!file) {
        setImportStatus('Selecione uma imagem primeiro.', true);
        return;
    }

    setImportStatus('Processando...');
    readImageFile(file, (img) => {
        const cells = extractCells(img);
        const letters = cells.map((bg, i) => ({ char: String(i + 1), draws: [], bg }));
        setImportStatus('');
        openEditor({ name: 'Alfabeto Importado', letters }, 'import');
    }, (msg) => setImportStatus(msg, true));
});

function setImportStatus(msg, isError) {
    importStatus.textContent = msg;
    importStatus.classList.toggle('error', !!isError);
}

/* ---------------------- Navegação / Views ---------------------- */

function switchView(name) {
    viewAlphabet.classList.toggle('hidden', name !== 'alphabet');
    viewEditor.classList.toggle('hidden', name !== 'editor');
    viewImport.classList.toggle('hidden', name !== 'import');
}

function openEditor(alphabet, mode) {
    state.mode = mode;
    state.alphabet = alphabet;
    state.currentIndex = 0;
    state.tool = 'brush';
    toolBrush.classList.add('active');
    toolEraser.classList.remove('active');

    referencePanel.classList.toggle('hidden', mode !== 'preset');
    addLetterBtn.classList.toggle('hidden', mode !== 'custom');
    deleteLetterBtn.classList.toggle('hidden', mode !== 'custom');
    editorTitle.textContent = alphabet.name || 'Alfabeto';

    switchView('editor');
    render();
}

function buildPresetAlphabet(preset) {
    return {
        name: preset.name,
        letters: preset.chars.map((char) => ({ char, draws: [], bg: null }))
    };
}

function buildCustomAlphabet() {
    return {
        name: 'Alfabeto Personalizado',
        letters: [{ char: 'A', draws: [], bg: null }]
    };
}

function renderAlphabetList() {
    alphabetList.innerHTML = '';
    PRESET_ALPHABETS.forEach((preset) => {
        const card = document.createElement('div');
        card.className = 'alphabet-card';
        const preview = preset.chars.slice(0, 8).join(' ');
        card.innerHTML =
            `<strong>${preset.name}</strong>` +
            `<span>${preset.chars.length} letras &middot; ${preview}…</span>`;
        card.addEventListener('click', () => openEditor(buildPresetAlphabet(preset), 'preset'));
        alphabetList.appendChild(card);
    });

    const customCard = document.createElement('div');
    customCard.className = 'alphabet-card custom-card';
    customCard.innerHTML =
        `<strong>Alfabeto Personalizado</strong>` +
        `<span>Crie do zero — adicione e apague letras</span>`;
    customCard.addEventListener('click', () => openEditor(buildCustomAlphabet(), 'custom'));
    alphabetList.appendChild(customCard);
}

$('openCreate').addEventListener('click', () => {
    renderAlphabetList();
    switchView('alphabet');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
});

$('openImport').addEventListener('click', () => {
    importFileInput.value = '';
    setImportStatus('');
    switchView('import');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
});

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

/* ---------------------- Inicialização ---------------------- */
if (typeof JSZip === 'undefined') {
    console.warn('JSZip não carregado: corte de ZIP indisponível.');
}