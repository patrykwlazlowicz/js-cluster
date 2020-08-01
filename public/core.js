let points = [];
let animations = [];
let pointsImage = undefined;
const CANVAS_SIZE = 600;
const POINT_GROUPS = 20;
const POINT_GROUP_SIZE = 15000;
const POINT_GROUP_MIN_DISTANCE = 100;
const POINT_RANDOM = 50000;
const POINT_STD_DEVIATION = 30;
const CLUSTERS = 20;
const PROGRESS_CIRCLE_MAX_SIZE = 50;
const DEFAULT_EPOCH_COUNTER = 100;
const DEFAULT_DIFFERENCE_THRESHOLD = 100;

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
    if (animations.length) {
        animations.forEach(animation => {
            animation.stop();
            animation.refreshWorkerPreview = false;
        });
        animations = [];
    }
    processAlgorithm('k-means', 'k-means-worker.js', showPreview);
    processAlgorithm('kohonen', 'kohonen-worker.js', showPreview);
}

function processAlgorithm(canvasId, workerName, showPreview) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const epochCounter = parseValue('epochCounter', DEFAULT_EPOCH_COUNTER, parseInt);
    const differenceThreshold = parseValue('differenceThreshold', DEFAULT_DIFFERENCE_THRESHOLD, parseFloat);
    const progressAnimation = {
        circle: {
            inner: 0,
            outer: 0
        },
        workerCtx: ctx,
        intervalId: undefined,
        refreshWorkerPreview: true,
        stop: function () {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }
        },
        start: function () {
            this.intervalId = setInterval(this.refresh.bind(this), 10);
        },
        refresh: function () {
            drawProgressAnimation(this.workerCtx, this.circle);
            if (this.circle.inner !== PROGRESS_CIRCLE_MAX_SIZE) {
                ++this.circle.inner;
            } else if (this.circle.inner === PROGRESS_CIRCLE_MAX_SIZE
                && this.circle.outer !== PROGRESS_CIRCLE_MAX_SIZE) {
                ++this.circle.outer;
            } else {
                this.circle.inner = 0;
                this.circle.outer = 0;
            }
        }
    }
    progressAnimation.start();
    animations.push(progressAnimation);
    const worker = new Worker(workerName);
    worker.onmessage = processBatch(ctx, progressAnimation);
    worker.postMessage({
        numberOfCluster: CLUSTERS,
        canvasSize: CANVAS_SIZE,
        points,
        showPreview,
        epochCounter,
        differenceThreshold
    });
}

function parseValue(id, defaultValue, parser) {
    const value = parser(document.getElementById(id).value);
    return !!value ? value : defaultValue;
}

function processBatch(ctx, progressAnimation) {
    return (event) => {
        progressAnimation.stop();
        if (progressAnimation.refreshWorkerPreview) {
            ctx.putImageData(pointsImage, 0, 0);
            for (let cluster of event.data.clusters) {
                drawClusterPoint(ctx, cluster, event.data.done);
            }
            drawEpoch(ctx, event.data.epoch)
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

function drawProgressAnimation(ctx, circle) {
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

function drawEpoch(ctx, epoch) {
    ctx.font = "50px Arial";
    ctx.fillStyle = '#0000FF';
    ctx.textBaseline = 'top';
    ctx.fillText(epoch, 10, 10);
}
