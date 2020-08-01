const LEARNING_RATE = 0.5; // 0.1 > x > 0.7
const DISAPPEARANCE_RATE = 0.9;

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function randomPointInCanvasFunction(canvasSize) {
    return () => {
        return {x: Math.random() * canvasSize, y: Math.random() * canvasSize};
    }
}

function neighborhood(distance, lambda) {
    return lambda;
    // return Math.exp(-(distance * distance) / (2 * lambda * lambda));
}

onmessage = function (event) {
    let epoch = 0;
    let lambda = 1;
    let neurons = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    if (event.data.showPreview) {
        postMessage({clusters: neurons, done: false, epoch});
    }
    for (let thresholdStop = false; epoch < event.data.epochCounter && !thresholdStop; ++epoch) {
        let maxDifference = event.data.differenceThreshold;
        for (let point of event.data.points) {
            const closes = {
                neuron: neurons[0],
                distance: distance(point, neurons[0])
            };
            for (let neuron of neurons) {
                const distanceToNeuron = distance(point, neuron);
                if (closes.distance < distanceToNeuron) {
                    closes.neuron = neuron;
                    closes.distance = distanceToNeuron;
                }
            }
            const newNeuronPosition = {
                x: closes.neuron.x + LEARNING_RATE * neighborhood(closes.distance, lambda) * (point.x - closes.neuron.x),
                y: closes.neuron.y + LEARNING_RATE * neighborhood(closes.distance, lambda) * (point.y - closes.neuron.y)
            }
            const difference = distance(closes.neuron, newNeuronPosition, epoch);
            if (difference > maxDifference) {
                maxDifference = difference;
            }
            closes.neuron.x = newNeuronPosition.x;
            closes.neuron.y = newNeuronPosition.y;
        }
        lambda *= DISAPPEARANCE_RATE;
        if (maxDifference <= event.data.differenceThreshold) {
            thresholdStop = true;
        }
        if (event.data.showPreview) {
            postMessage({clusters: neurons, done: false, epoch: epoch + 1});
        }
    }
    postMessage({clusters: neurons, done: true, epoch});
}
