const points = [];
let loaderIntervalId;
const CANVAS_SIZE = 620;
const POINT_GROUPS = 40;
const POINT_GROUP_SIZE = 10000;
const POINT_RANDOM = 10000;
const POINT_STD_DEVIATION = 25;
const CLUSTERS = 30;
const PROGRESS_CIRCLE_MAX_SIZE = 50;

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
    points.length = 0;
    for (let i = 0; i < POINT_GROUPS; ++i) {
        const gX = Math.random() * CANVAS_SIZE;
        const gY = Math.random() * CANVAS_SIZE;
        for (let j = 0; j < POINT_GROUP_SIZE; ++j) {
            const x = randomGaussian(gX, POINT_STD_DEVIATION);
            const y = randomGaussian(gY, POINT_STD_DEVIATION);
            points.push({x, y});
        }
    }
    for (let i = 0; i < POINT_RANDOM; ++i) {
        const x = Math.random() * CANVAS_SIZE;
        const y = Math.random() * CANVAS_SIZE;
        points.push({x, y});
    }
    drawPoints(ctx);
}

function startProcessing() {
    if (loaderIntervalId) {
        clearInterval(loaderIntervalId);
    }
    const workerCanvas = document.getElementById('webWorker');
    const workerCtx = workerCanvas.getContext('2d');
    const assemblyCanvas = document.getElementById('webAssembly');
    const assemblyCtx = assemblyCanvas.getContext('2d');
    const progress = {
        displayWebWorkerProgress: true,
        displayWebAssemblyProgress: true,
        stopProgress: function() {
            if (!this.displayWebWorkerProgress && !this.displayWebAssemblyProgress) {
                clearInterval(loaderIntervalId);
            }
        }
    }
    const circle = {inner: 0, outer: 0};
    loaderIntervalId = setInterval(refresh(progress, circle, workerCtx, assemblyCtx), 10);
    const clusterWorker = new Worker('cluster-worker.js');
    clusterWorker.onmessage = processComplete(workerCtx, progress, 'displayWebWorkerProgress');
    const assemblyWorker = new Worker('assembly-worker.js');
    assemblyWorker.onmessage = () => {
        assemblyWorker.onmessage = processComplete(assemblyCtx, progress, 'displayWebAssemblyProgress');
        clusterWorker.postMessage({
            numberOfCluster: CLUSTERS,
            canvasSize: CANVAS_SIZE,
            points
        });
        assemblyWorker.postMessage({
            numberOfCluster: CLUSTERS,
            canvasSize: CANVAS_SIZE,
            points
        });
    }
}

function refresh(progress, circle, workerCtx, assemblyCtx) {
    return () => {
        if (progress.displayWebWorkerProgress) {
            showProgress(workerCtx, circle);
        }
        if (progress.displayWebAssemblyProgress) {
            showProgress(assemblyCtx, circle);
        }
        if (circle.inner !== PROGRESS_CIRCLE_MAX_SIZE) {
            ++circle.inner;
        } else if (circle.inner === PROGRESS_CIRCLE_MAX_SIZE && circle.outer !== PROGRESS_CIRCLE_MAX_SIZE) {
            ++circle.outer;
        } else {
            circle.inner = 0;
            circle.outer = 0;
        }
    };
}

function processComplete(ctx, progress, display) {
    return (event) => {
        progress[display] = false;
        progress.stopProgress();
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        drawPoints(ctx);
        for (let cluster of event.data) {
            drawClusterPoint(ctx, cluster);
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

function drawClusterPoint(ctx, cluster) {
    ctx.beginPath();
    ctx.fillStyle = "#FF0000";
    ctx.arc(cluster.x, cluster.y, 10, 0, 2 * Math.PI);
    ctx.fill();

}
