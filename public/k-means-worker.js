function distance(p1x, p2x, p1y, p2y) {
    const dx = p1x - p2x;
    const dy = p1y - p2y;
    return Math.sqrt(dx * dx + dy * dy);
}

function randomPointInCanvasFunction(canvasSize) {
    return () => {
        return {x: Math.random() * canvasSize, y: Math.random() * canvasSize};
    }
}

function initSumPointsInCluster() {
    return {
        xSum: 0,
        ySum: 0,
        total: 0
    }
}

function newCluster(sumPointInCluster) {
    return {
        x: sumPointInCluster.xSum / sumPointInCluster.total,
        y: sumPointInCluster.ySum / sumPointInCluster.total
    }
}

onmessage = function (event) {
    let epoch = 0;
    const startTime = Date.now();
    const points = event.data.points;
    let clusters = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    postMessage({clusters, done: false, epoch, epochTime: (Date.now() - startTime)});
    for (let thresholdStop = false; epoch < event.data.epochCounter && !thresholdStop; ++epoch) {
        const sumPointsInCluster = Array.from({length: event.data.numberOfCluster}, () => initSumPointsInCluster());
        for (let i = 0; i < points.length; ++i) {
            const point = points[i];
            const closesCluster = {clusterIdx: 0, distance: distance(point.x, clusters[0].x, point.y, clusters[0].y)};
            for (let j = 0; j < clusters.length; ++j) {
                const cluster = clusters[j];
                const distanceToCluster = distance(point.x, cluster.x, point.y, cluster.y);
                if (closesCluster.distance > distanceToCluster) {
                    closesCluster.distance = distanceToCluster;
                    closesCluster.clusterIdx = j;
                }
            }
            sumPointsInCluster[closesCluster.clusterIdx].xSum += point.x;
            sumPointsInCluster[closesCluster.clusterIdx].ySum += point.y;
            ++sumPointsInCluster[closesCluster.clusterIdx].total;
        }
        const newClusters = Array.from({length: event.data.numberOfCluster}, (v, idx) => newCluster(sumPointsInCluster[idx]));
        thresholdStop = true;
        for (let i = 0; i < clusters.length; ++i) {
            if (distance(clusters[i].x, newClusters[i].x, clusters[i].y, newClusters[i].y) > event.data.differenceThreshold) {
                thresholdStop = false;
            }
        }
        clusters = newClusters;
        postMessage({clusters, done: false, epoch: epoch + 1, epochTime: (Date.now() - startTime) / (epoch + 1)});
    }
    postMessage({clusters, done: true, epoch, epochTime: (Date.now() - startTime) / epoch});
}
