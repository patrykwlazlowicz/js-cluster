function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function diffLength(diff) {
    return Math.sqrt(diff.x * diff.x + diff.y * diff.y);
}

function randomPointInCanvasFunction(canvasSize) {
    return () => {
        return {x: Math.random() * canvasSize, y: Math.random() * canvasSize};
    }
}

function learningRateFunction(learningRate, maxEpoch) {
    return (epoch) => learningRate * Math.exp(-epoch / maxEpoch);
}

function lambdaFunction(disappearanceRate, maxEpoch) {
    return (epoch) => disappearanceRate * Math.exp(-epoch / maxEpoch);
}

onmessage = function (event) {
    let epoch = 0;
    const learningRate = learningRateFunction(event.data.learningRate, event.data.epochCounter);
    const lambda = lambdaFunction(event.data.disappearanceRate, event.data.epochCounter);
    let neurons = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    postMessage({clusters: neurons, done: false, epoch});
    for (let thresholdStop = false; epoch < event.data.epochCounter && !thresholdStop; ++epoch) {
        const currentLearningRate = learningRate(epoch);
        const currentLambda = lambda(epoch);
        let maxDifference = event.data.differenceThreshold;
        for (let point of event.data.points) {
            const winner = {
                neuron: neurons[0],
                distance: distance(point, neurons[0])
            };
            for (let neuron of neurons) {
                const distanceToNeuron = distance(point, neuron);
                if (winner.distance > distanceToNeuron) {
                    winner.neuron = neuron;
                    winner.distance = distanceToNeuron;
                }
            }
            if (event.data.winnerTakeAll) {
                const difference = {
                    x: currentLearningRate * (point.x - winner.neuron.x),
                    y: currentLearningRate * (point.y - winner.neuron.y)
                }
                const differenceLength = diffLength(difference);
                if (differenceLength > maxDifference) {
                    maxDifference = differenceLength;
                }
                winner.neuron.x += difference.x;
                winner.neuron.y += difference.y;
            } else {
                for (let neuron of neurons) {
                    const distanceToWinner = distance(neuron, winner.neuron);
                    const neighborhood = Math.exp(-(distanceToWinner * distanceToWinner) / (2 * currentLambda * currentLambda));
                    const difference = {
                        x: currentLearningRate * neighborhood * (point.x - neuron.x),
                        y: currentLearningRate * neighborhood * (point.y - neuron.y)
                    }
                    const differenceLength = diffLength(difference);
                    if (differenceLength > maxDifference) {
                        maxDifference = differenceLength;
                    }
                    winner.neuron.x += difference.x;
                    winner.neuron.y += difference.y;
                }
            }
        }
        if (maxDifference <= event.data.differenceThreshold) {
            thresholdStop = true;
        }
        postMessage({clusters: neurons, done: false, epoch: epoch + 1});
    }
    postMessage({clusters: neurons, done: true, epoch});
}
