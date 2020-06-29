em++ cluster.cpp \
-s WASM=1 \
-s SAFE_HEAP=1 \
-s WARN_UNALIGNED=1 \
-s EXPORTED_FUNCTIONS='["_cluster"]' \
-s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" \
-O3 \
-o api.js
