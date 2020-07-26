function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function randomPointInCanvasFunction(canvasSize) {
    return () => {
        return {x: Math.random() * canvasSize, y: Math.random() * canvasSize};
    }
}

function reduceToSumOfPointCoords(prev, current) {
    return {x: prev.x + current.x, y: prev.y + current.y};
}

onmessage = function (event) {
    let clusters = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    for (let i = 0; i < 20; ++i) {
        const pointsInCluster = Array.from({length: event.data.numberOfCluster}, () => []);
        for (let point of event.data.points) {
            const closesCluster = {cluster: 0, distance: distance(point, clusters[0])};
            clusters.forEach((clusterPoint, idx) => {
                const distanceToCluster = distance(point, clusterPoint);
                if (closesCluster.distance > distanceToCluster) {
                    closesCluster.distance = distanceToCluster;
                    closesCluster.cluster = idx;
                }
            });
            pointsInCluster[closesCluster.cluster].push(point);
        }
        clusters = Array.from({length: event.data.numberOfCluster}, (v, idx) => {
            const sumOfCoords = pointsInCluster[idx].reduce(reduceToSumOfPointCoords, {x: 0, y: 0});
            return {
                x: sumOfCoords.x / pointsInCluster[idx].length,
                y: sumOfCoords.y / pointsInCluster[idx].length
            }
        });
    }
    postMessage(clusters);
}
