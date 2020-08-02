function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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
    let clusters = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    postMessage({clusters, done: false, epoch, epochTime: (Date.now() - startTime)});
    for (let thresholdStop = false; epoch < event.data.epochCounter && !thresholdStop; ++epoch) {
        const sumPointsInCluster = Array.from({length: event.data.numberOfCluster}, () => initSumPointsInCluster());
        for (let point of event.data.points) {
            const closesCluster = {cluster: 0, distance: distance(point, clusters[0])};
            clusters.forEach((clusterPoint, idx) => {
                const distanceToCluster = distance(point, clusterPoint);
                if (closesCluster.distance > distanceToCluster) {
                    closesCluster.distance = distanceToCluster;
                    closesCluster.cluster = idx;
                }
            });
            sumPointsInCluster[closesCluster.cluster].xSum += point.x;
            sumPointsInCluster[closesCluster.cluster].ySum += point.y;
            ++sumPointsInCluster[closesCluster.cluster].total;
        }
        const maxDifference = sumPointsInCluster.reduce((prev, current, idx) => {
            const difference = distance(clusters[idx], {
                x: current.xSum / current.total,
                y: current.ySum / current.total
            });
            return difference > prev ? difference : prev;
        }, event.data.differenceThreshold);
        clusters = Array.from({length: event.data.numberOfCluster}, (v, idx) => newCluster(sumPointsInCluster[idx]));
        if (maxDifference <= event.data.differenceThreshold) {
            thresholdStop = true;
        }
        postMessage({clusters, done: false, epoch: epoch + 1, epochTime: (Date.now() - startTime) / (epoch + 1)});
    }
    postMessage({clusters, done: true, epoch, epochTime: (Date.now() - startTime) / epoch});
}
