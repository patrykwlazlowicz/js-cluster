let points = [];
let pointsImage = undefined;
let worker = undefined;
let numberOfCluster = 0;
let epochCounter = 0;
let differenceThreshold = 0;
let learningRate = 0;
let winnerTakeAll = true;
let disappearanceRate = 0;
const CANVAS_SIZE = 800;
const POINT_GROUPS = 10;
const POINT_GROUP_SIZE = 20000;
const POINT_STD_DEVIATION = 25;
const POINT_RANDOM = 1000;
const CLUSTERS = 10;
const EPOCH_COUNTER = 1000;
const DIFFERENCE_THRESHOLD = 0.01;
const LEARNING_RATE = 0.01;
const DISAPPEARANCE_RATE = 0.1;

function randomGaussian(mean, sd) {
    let y, x1, x2, w;
    do {
        x1 = Math.random() * 2 - 1;
        x2 = Math.random() * 2 - 1;
        w = x1 * x1 + x2 * x2;
    } while (w >= 1);
    w = Math.sqrt(-2 * Math.log(w) / w);
    y = x1 * w;
    const m = mean || 0;
    const s = sd || 1;
    return y * s + m;
}

function generatePoints() {
    const groups = parseValue('groups', POINT_GROUPS, parseInt);
    const groupsSize = parseValue('groupsSize', POINT_GROUP_SIZE, parseInt);
    const groupsDispersion = parseValue('groupsDispersion', POINT_STD_DEVIATION, parseInt);
    const random = parseValue('random', POINT_RANDOM, parseInt);
    const originalCanvas = document.getElementById('original');
    const ctx = originalCanvas.getContext('2d');
    points = [];
    for (let i = 0; i < groups; ++i) {
        const gX = Math.random() * CANVAS_SIZE;
        const gY = Math.random() * CANVAS_SIZE;
        for (let j = 0; j < groupsSize; ++j) {
            const x = randomGaussian(gX, groupsDispersion);
            const y = randomGaussian(gY, groupsDispersion);
            points.push({x, y});
        }
    }
    for (let i = 0; i < random; ++i) {
        const x = Math.random() * CANVAS_SIZE;
        const y = Math.random() * CANVAS_SIZE;
        points.push({x, y});
    }
    drawPoints(ctx);
    pointsImage = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function savePoints() {
    if (points.length) {
        const a = document.createElement('a');
        const file = new Blob([JSON.stringify(points)], {type: 'text/plain'});
        a.href = URL.createObjectURL(file);
        a.download = 'points.json';
        a.click();
    }
}

function loadPoints(file) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        points = JSON.parse(event.target.result);
        const originalCanvas = document.getElementById('original');
        const ctx = originalCanvas.getContext('2d');
        drawPoints(ctx);
        pointsImage = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    });
    reader.readAsText(file);
}

function chooseAlgorithm() {
    if (!points.length) {
        generatePoints();
    }
    document.getElementById('setupPoints').classList.add('hide');
    document.getElementById('chooseAlgorithm').classList.remove('hide');
}

function parseValue(id, defaultValue, parser) {
    const value = parser(document.getElementById(id).value);
    return !!value ? value : defaultValue;
}

function readCommonSetup() {
    numberOfCluster = parseValue('clusterAmount', CLUSTERS, parseInt);
    epochCounter = parseValue('epochCounter', EPOCH_COUNTER, parseInt);
    differenceThreshold = parseValue('differenceThreshold', DIFFERENCE_THRESHOLD, parseFloat);
    document.getElementById('chooseAlgorithm').classList.add('hide');
}

function startKmeans() {
    readCommonSetup();
    document.getElementById('cluster').classList.remove('hide');
    const canvas = document.getElementById('cluster');
    const ctx = canvas.getContext('2d');
    worker = new Worker('k-means-worker.js');
    worker.onmessage = processBatch(ctx);
    worker.postMessage({
        canvasSize: CANVAS_SIZE,
        numberOfCluster,
        points,
        epochCounter,
        differenceThreshold
    });
    document.getElementById('startOver').classList.remove('hide');
}

function setupKohonen() {
    readCommonSetup();
    document.getElementById('kohonenSetup').classList.remove('hide');
}

function startKohonen() {
    learningRate = parseValue('learningRate', LEARNING_RATE, parseFloat);
    winnerTakeAll = document.getElementById('winnerTakeAll').checked;
    disappearanceRate = parseValue('disappearanceRate', DISAPPEARANCE_RATE, parseFloat);
    document.getElementById('kohonenSetup').classList.add('hide');
    document.getElementById('cluster').classList.remove('hide');
    const canvas = document.getElementById('cluster');
    const ctx = canvas.getContext('2d');
    worker = new Worker('kohonen-worker.js');
    worker.onmessage = processBatch(ctx);
    worker.postMessage({
        canvasSize: CANVAS_SIZE,
        numberOfCluster,
        points,
        epochCounter,
        differenceThreshold,
        learningRate,
        winnerTakeAll,
        disappearanceRate
    });
    document.getElementById('startOver').classList.remove('hide');
}

function startOver() {
    worker.terminate();
    document.getElementById('startOver').classList.add('hide');
    document.getElementById('cluster').classList.add('hide');
    document.getElementById('setupPoints').classList.remove('hide');
}

function processBatch(ctx) {
    return function (event) {
        ctx.putImageData(pointsImage, 0, 0);
        for (let cluster of event.data.clusters) {
            drawClusterPoint(ctx, cluster, event.data.done);
        }
        drawEpoch(ctx, event.data.epoch)
    }
}

function drawPoints(ctx) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (let point of points) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(point.x, point.y, 1, 1);
    }
}

function drawClusterPoint(ctx, cluster, done) {
    ctx.beginPath();
    ctx.fillStyle = done ? '#00FF00' : '#FF0000';
    ctx.arc(cluster.x, cluster.y, 10, 0, 2 * Math.PI);
    ctx.fill();
}

function drawEpoch(ctx, epoch) {
    ctx.font = "50px Arial";
    ctx.fillStyle = '#0000FF';
    ctx.textBaseline = 'top';
    ctx.fillText(epoch, 10, 10);
}
