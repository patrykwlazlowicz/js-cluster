let points = [];
let animationsIntervalId = [];
let pointsImage = undefined;
const CANVAS_SIZE = 600;
const POINT_GROUPS = 20;
const POINT_GROUP_SIZE = 15000;
const POINT_GROUP_MIN_DISTANCE = 100;
const POINT_RANDOM = 50000;
const POINT_STD_DEVIATION = 30;
const CLUSTERS = 20;
const PROGRESS_CIRCLE_MAX_SIZE = 50;
const DEFAULT_EPOCH_COUNTER = 50;

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
    const originalCanvas = document.getElementById('original');
    const ctx = originalCanvas.getContext('2d');
    points = [];
    const generatedGroups = [];
    for (let i = 0; i < POINT_GROUPS; ++i) {
        const gX = Math.random() * CANVAS_SIZE;
        const gY = Math.random() * CANVAS_SIZE;
        let distances = generatedGroups.map(({x, y}) => Math.sqrt(Math.pow(x - gX, 2) + Math.pow(y - gY, 2)));
        distances = distances.sort((a, b) => a - b);
        if (distances[0] <= POINT_GROUP_MIN_DISTANCE) {
            --i;
        } else {
            generatedGroups.push({x: gX, y: gY});
            for (let j = 0; j < POINT_GROUP_SIZE; ++j) {
                const x = randomGaussian(gX, POINT_STD_DEVIATION);
                const y = randomGaussian(gY, POINT_STD_DEVIATION);
                points.push({x, y});
            }
        }
    }
    for (let i = 0; i < POINT_RANDOM; ++i) {
        const x = Math.random() * CANVAS_SIZE;
        const y = Math.random() * CANVAS_SIZE;
        points.push({x, y});
    }
    drawPoints(ctx);
    pointsImage = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function startProcessing(showPreview) {
    if (animationsIntervalId.length) {
        animationsIntervalId.forEach(id => clearInterval(id));
        animationsIntervalId = [];
    }
    processAlgorithm('k-means', 'k-means-worker.js', showPreview);
}

function processAlgorithm(canvasId, workerName, showPreview) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const epoch = parseInt(document.getElementById('epochCounter').value);
    const epochCounter = !!epoch ? epoch : DEFAULT_EPOCH_COUNTER;
    const progressAnimation = {
        circle: {
            inner: 0,
            outer: 0
        },
        workerCtx: ctx,
        intervalId: undefined,
        stop: function () {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        }
    }
    progressAnimation.intervalId = setInterval(refresh(progressAnimation), 10);
    animationsIntervalId.push(progressAnimation.intervalId);
    const kMeansWorker = new Worker(workerName);
    kMeansWorker.onmessage = processBatch(ctx, progressAnimation);
    kMeansWorker.postMessage({
        numberOfCluster: CLUSTERS,
        canvasSize: CANVAS_SIZE,
        points,
        showPreview,
        epochCounter
    });
}

function refresh(progressAnimation) {
    return () => {
        showProgress(progressAnimation.workerCtx, progressAnimation.circle);
        if (progressAnimation.circle.inner !== PROGRESS_CIRCLE_MAX_SIZE) {
            ++progressAnimation.circle.inner;
        } else if (progressAnimation.circle.inner === PROGRESS_CIRCLE_MAX_SIZE
            && progressAnimation.circle.outer !== PROGRESS_CIRCLE_MAX_SIZE) {
            ++progressAnimation.circle.outer;
        } else {
            progressAnimation.circle.inner = 0;
            progressAnimation.circle.outer = 0;
        }
    };
}

function processBatch(ctx, progressAnimation) {
    return (event) => {
        progressAnimation.stop();
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.putImageData(pointsImage, 0, 0);
        for (let cluster of event.data.clusters) {
            drawClusterPoint(ctx, cluster, event.data.done);
        }
    }
}

function drawPoints(ctx) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (let point of points) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(point.x, point.y, 1, 1);
    }
}

function showProgress(ctx, circle) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, circle.inner, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, circle.outer, 0, 2 * Math.PI);
    ctx.fill();
}

function drawClusterPoint(ctx, cluster, done) {
    ctx.beginPath();
    ctx.fillStyle = done ? '#00FF00' : '#FF0000';
    ctx.arc(cluster.x, cluster.y, 10, 0, 2 * Math.PI);
    ctx.fill();
}
