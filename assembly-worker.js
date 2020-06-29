self.importScripts("api.js");
setTimeout(() => postMessage(''), 100);
onmessage = function (event) {
    const result = Module.ccall(
        'cluster',
        'number',
        ['number', 'number', 'number', 'Object'],
        [event.data.numberOfCluster, event.data.canvasSize, event.data.points.length, event.data.points]
    );
    const clusters = [];
    for (let v = 0; v < event.data.numberOfCluster * 2; v += 2) {
        clusters.push({
            x: Module.HEAPF32[result / Float32Array.BYTES_PER_ELEMENT + v],
            y: Module.HEAPF32[result / Float32Array.BYTES_PER_ELEMENT + (v + 1)]
        })
    }
    console.log(clusters);
}
