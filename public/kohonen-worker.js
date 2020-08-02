function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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

function deepCloneFunction(neurons) {
    return (v, idx) => {
        return {x: neurons[idx].x, y: neurons[idx].y};
    }
}

onmessage = function (event) {
    let epoch = 0;
    const startTime = Date.now();
    const learningRate = learningRateFunction(event.data.learningRate, event.data.epochCounter);
    const lambda = lambdaFunction(event.data.disappearanceRate, event.data.epochCounter);
    let neurons = Array.from({length: event.data.numberOfCluster}, randomPointInCanvasFunction(event.data.canvasSize));
    postMessage({clusters: neurons, done: false, epoch, epochTime: (Date.now() - startTime)});
    for (let thresholdStop = false; epoch < event.data.epochCounter && !thresholdStop; ++epoch) {
        const currentLearningRate = learningRate(epoch);
        const currentLambda = lambda(epoch);
        const newNeurons = Array.from({length: event.data.numberOfCluster}, deepCloneFunction(neurons));
        for (let point of event.data.points) {
            const winner = {
                neuron: newNeurons[0],
                distance: distance(point, newNeurons[0])
            };
            for (let neuron of newNeurons) {
                const distanceToNeuron = distance(point, neuron);
                if (winner.distance > distanceToNeuron) {
                    winner.neuron = neuron;
                    winner.distance = distanceToNeuron;
                }
            }
            if (event.data.winnerTakeAll) {
                winner.neuron.x += currentLearningRate * (point.x - winner.neuron.x);
                winner.neuron.y += currentLearningRate * (point.y - winner.neuron.y);
            } else {
                for (let neuron of newNeurons) {
                    const distanceToWinner = distance(neuron, winner.neuron);
                    const neighborhood = Math.exp(-(distanceToWinner * distanceToWinner) / (2 * currentLambda * currentLambda));
                    winner.neuron.x += currentLearningRate * neighborhood * (point.x - neuron.x);
                    winner.neuron.y += currentLearningRate * neighborhood * (point.y - neuron.y);
                }
            }
        }
        thresholdStop = true;
        for (let i = 0; i < neurons.length; ++i) {
            if (distance(neurons[i], newNeurons[i]) > event.data.differenceThreshold) {
                thresholdStop = false;
            }
        }
        neurons = newNeurons;
        postMessage({clusters: neurons, done: false, epoch: epoch + 1, epochTime: (Date.now() - startTime) / (epoch + 1)});
    }
    postMessage({clusters: neurons, done: true, epoch, epochTime: (Date.now() - startTime) / epoch});
}
