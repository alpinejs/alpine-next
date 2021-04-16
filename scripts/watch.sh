# Builds:

node_modules/.bin/esbuild packages/alpinejs/builds/cdn.js \
    --outfile=packages/alpinejs/dist/alpine.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\" \
    --watch

node_modules/.bin/esbuild packages/intersect/builds/cdn.js \
    --outfile=packages/intersect/dist/intersect.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\" \
    --watch

node_modules/.bin/esbuild packages/history/builds/cdn.js \
    --outfile=packages/history/dist/history.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\" \
    --watch

node_modules/.bin/esbuild packages/morph/builds/cdn.js \
    --outfile=packages/morph/dist/morph.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\" \
    --watch
