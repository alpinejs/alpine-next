# Builds:

node_modules/.bin/esbuild packages/alpinejs/builds/cdn.js \
    --outfile=packages/alpinejs/dist/alpine.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\"

node_modules/.bin/esbuild packages/intersect/builds/cdn.js \
    --outfile=packages/intersect/dist/intersect.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\"

node_modules/.bin/esbuild packages/history/builds/cdn.js \
    --outfile=packages/history/dist/history.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\"

node_modules/.bin/esbuild packages/morph/builds/cdn.js \
    --outfile=packages/morph/dist/morph.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\"

cp packages/alpinejs/builds/module.js packages/alpinejs/dist/alpine.module.js
cp packages/intersect/builds/module.js packages/intersect/dist/intersect.module.js
cp packages/history/builds/module.js packages/history/dist/history.module.js
cp packages/morph/builds/module.js packages/morph/dist/morph.module.js

# CSP
node_modules/.bin/esbuild packages/alpinejs/builds/csp.js \
    --outfile=packages/alpinejs/dist/alpine-csp.js \
    --bundle \
    --define:process.env.NODE_ENV=\"production\"
