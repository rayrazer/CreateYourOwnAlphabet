// Script principal
const showCanvas = document.getElementById('show_letter');
const drawCanvas = document.getElementById('draw_letter');
const showCtx = showCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');
const prevBtn = document.getElementById('previus');
const nextBtn = document.getElementById('next');
const saveBtn = document.getElementById('save');
const saveLetterBtn = document.getElementById('saveLetter');
const clearBtn = document.getElementById('clear');
const colorInput = document.getElementById('color');
const lineWidthInput = document.getElementById('lineWidth');
const transparentInput = document.getElementById('transparent');
const importFileInput = document.getElementById('importFile');
const importZipBtn = document.getElementById('importZip');
const importStatus = document.getElementById('importStatus');

// Alfabeto (A-Z)
const alphabet = [];
for (let i = 65; i <= 90; i++) {
    alphabet.push(String.fromCharCode(i));
}

// Grade de exportação (7 colunas x 4 linhas)
const GRID_COLS = 7;
const GRID_ROWS = 4;

let currentIndex = 0;
let drawing = false;
let lastX = 0;
let lastY = 0;

// armazena os desenhos de cada letra (array de objetos por letra)
let storedDraws = alphabet.map(() => []);

function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function drawShowLetter() {
    resizeCanvas(showCanvas);
    showCtx.clearRect(0, 0, showCanvas.width, showCanvas.height);

    const letter = alphabet[currentIndex];
    const size = Math.min(showCanvas.width, showCanvas.height) * 0.7;
    showCtx.font = `bold ${size}px Arial, sans-serif`;
    showCtx.fillStyle = '#3f51b5';
    showCtx.textAlign = 'center';
    showCtx.textBaseline = 'middle';
    showCtx.fillText(
        letter,
        showCanvas.width / 2,
        showCanvas.height / 2 + (size * 0.05)
    );
}

function redrawDrawCanvas() {
    resizeCanvas(drawCanvas);
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    drawAllObjects(drawCtx, storedDraws[currentIndex], 1);
}

function drawAllObjects(ctx, objects, scale) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const obj of objects) {
        if (obj.type === 'dot') {
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.arc(obj.x * scale, obj.y * scale, (obj.size / 2) * scale, 0, Math.PI * 2);
            ctx.fill();
        } else if (obj.points.length === 1) {
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.arc(obj.points[0].x * scale, obj.points[0].y * scale, (obj.width / 2) * scale, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.width * scale;
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x * scale, obj.points[0].y * scale);
            for (let i = 1; i < obj.points.length; i++) {
                ctx.lineTo(obj.points[i].x * scale, obj.points[i].y * scale);
            }
            ctx.stroke();
        }
    }
}

function getPos(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

let currentStroke = null;

function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    currentStroke = {
        type: 'stroke',
        color: colorInput.value,
        width: parseFloat(lineWidthInput.value),
        points: [{ x: pos.x, y: pos.y }]
    };
    storedDraws[currentIndex].push(currentStroke);
    redrawDrawCanvas();
}

function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    currentStroke.points.push({ x: pos.x, y: pos.y });
    lastX = pos.x;
    lastY = pos.y;
    redrawDrawCanvas();
}

function endDraw() {
    drawing = false;
    currentStroke = null;
}

// Eventos de desenho (mouse)
drawCanvas.addEventListener('mousedown', startDraw);
drawCanvas.addEventListener('mousemove', moveDraw);
drawCanvas.addEventListener('mouseup', endDraw);
drawCanvas.addEventListener('mouseleave', endDraw);
// Touch
drawCanvas.addEventListener('touchstart', startDraw);
drawCanvas.addEventListener('touchmove', moveDraw);
drawCanvas.addEventListener('touchend', endDraw);

function render() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === alphabet.length - 1;
    drawShowLetter();
    redrawDrawCanvas();
}

function changeLetter(dir) {
    currentIndex += dir;
    render();
}

prevBtn.addEventListener('click', () => changeLetter(-1));
nextBtn.addEventListener('click', () => changeLetter(1));

clearBtn.addEventListener('click', () => {
    storedDraws[currentIndex] = [];
    redrawDrawCanvas();
});

function buildGridCanvas(cellSize) {
    const img = document.createElement('canvas');
    img.width = GRID_COLS * cellSize;
    img.height = GRID_ROWS * cellSize;
    const ctx = img.getContext('2d');

    if (!transparentInput.checked) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, img.width, img.height);
    }

    const sourceSize = drawCanvas.width || drawCanvas.height || 100;
    // desenhos foram feitos no canvas quadrado do draw_letter
    const scale = cellSize / sourceSize;

    for (let i = 0; i < alphabet.length; i++) {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);

        ctx.save();
        ctx.translate(col * cellSize, row * cellSize);
        drawAllObjects(ctx, storedDraws[i], scale);
        ctx.restore();
    }

    return img;
}

function downloadDataURL(dataURL, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
}

saveBtn.addEventListener('click', () => {
    const cellSize = 200;
    const img = buildGridCanvas(cellSize);
    downloadDataURL(img.toDataURL('image/png'), 'meu-alfabeto.png');
});

saveLetterBtn.addEventListener('click', () => {
    const cellSize = 200;
    const img = document.createElement('canvas');
    img.width = cellSize;
    img.height = cellSize;
    const ctx = img.getContext('2d');

    if (!transparentInput.checked) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cellSize, cellSize);
    }

    const sourceSize = drawCanvas.width || drawCanvas.height || 100;
    const scale = cellSize / sourceSize;
    drawAllObjects(ctx, storedDraws[currentIndex], scale);

    downloadDataURL(img.toDataURL('image/png'), `letra-${alphabet[currentIndex]}.png`);
});

// Importar imagem (grade 7x4) e cortar em letras -> ZIP
importZipBtn.addEventListener('click', () => {
    const file = importFileInput.files[0];
    if (!file) {
        importStatus.textContent = 'Selecione uma imagem primeiro.';
        return;
    }

    importStatus.textContent = 'Processando...';

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const cellW = img.width / GRID_COLS;
            const cellH = img.height / GRID_ROWS;

            // menor lado define o tamanho da célula quadrada para não deformar
            const size = Math.floor(Math.min(cellW, cellH));
            // desloca para centralizar a grade
            const offsetX = Math.floor((img.width - size * GRID_COLS) / 2);
            const offsetY = Math.floor((img.height - size * GRID_ROWS) / 2);

            const zip = new JSZip();

            for (let i = 0; i < alphabet.length; i++) {
                const col = i % GRID_COLS;
                const row = Math.floor(i / GRID_COLS);

                const cell = document.createElement('canvas');
                cell.width = size;
                cell.height = size;
                const cctx = cell.getContext('2d');
                cctx.drawImage(
                    img,
                    offsetX + col * size,
                    offsetY + row * size,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                const dataURL = cell.toDataURL('image/png');

                // remove prefixo data:image/png;base64,
                const base64 = dataURL.split(',')[1];
                zip.file(`${alphabet[i]}.png`, base64, { base64: true });
            }

            zip.generateAsync({ type: 'blob' }).then((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'letras.zip';
                link.click();
                URL.revokeObjectURL(url);
                importStatus.textContent = 'ZIP gerado com sucesso!';
            });
        };
        img.onerror = () => {
            importStatus.textContent = 'Não foi possível carregar a imagem.';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

render();
