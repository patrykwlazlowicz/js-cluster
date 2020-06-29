#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <vector>
#include <emscripten/emscripten.h>

struct point {
    float x;
    float y;
};

#ifdef __cplusplus
extern "C" {
#endif

point* EMSCRIPTEN_KEEPALIVE cluster(int numberOfCluster, int canvasSize, int numberOfPoint, point* points) {
printf("sdafdsfsad");
   time_t t;
   srand((unsigned) time(&t));
   point clusters[numberOfCluster];
   for (int i = 0; i < numberOfCluster; ++i) {
       clusters[i].x = rand() % canvasSize;
       clusters[i].y = rand() % canvasSize;
   }
       for (int i = 0; i < 20; ++i) {
           std::vector<point> pointsInCluster[numberOfCluster];
           printf("%f %f", points[i].x, points[i].y);
//           for (let point of event.data.points) {
//               const closesCluster = clusters.map(mapToDistanceToClusterForPoint(point)).sort(sortDistanceToCluster)[0];
//               pointsInCluster[closesCluster.cluster].push(point);
//           }
//           clusters = Array.from({length: event.data.numberOfCluster}, (v, idx) => {
//               const sumOfCoords = pointsInCluster[idx].reduce(reduceToSumOfPointCoords, {x: 0, y: 0});
//               return {
//                   x: sumOfCoords.x / pointsInCluster[idx].length,
//                   y: sumOfCoords.y / pointsInCluster[idx].length
//               }
//           });
       }
   return clusters;
}

#ifdef __cplusplus
}
#endif
