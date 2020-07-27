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
    let clusters = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    if (event.data.showPreview) {
        postMessage({clusters, done: false});
    }
    for (let i = 0; i < event.data.epochCounter; ++i) {
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
        clusters = Array.from({length: event.data.numberOfCluster}, (v, idx) => newCluster(sumPointsInCluster[idx]));
        if (event.data.showPreview) {
            postMessage({clusters, done: false});
        }
    }
    postMessage({clusters, done: true});
}
