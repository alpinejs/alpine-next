let fs = require('fs');
let DotJson = require('dot-json');

([
    // Packages:
    'alpinejs',
    'csp',
    'history',
    'intersect',
    'morph',
]).forEach(package => {
    // Go through each file in the package's "build" directory
    // and use the appropriate bundling strategy based on its name.
    fs.readdirSync(`./packages/${package}/builds`).forEach(file => {
        bundleFile(package, file)
    });
})

function bundleFile(package, file) {
    // Based on the filename, give esbuild a specific configuration to build.
    ({
        // This output file is meant to be loaded in a browser's <script> tag.
        'cdn.js': () => {
            build({
                entryPoints: [`packages/${package}/builds/${file}`],
                outfile: `packages/${package}/dist/${file}`,
                bundle: true,
                platform: 'browser',
                define: { CDN: true },
            })

            writeToPackageDotJson(package, 'browser', `dist/${file}`)
        },
        // This file outputs two files: an esm module and a cjs module.
        // The ESM one is meant for "import" statements (bundlers and new browsers)
        // and the cjs one is meant for "require" statements (node).
        'module.js': () => {
            build({
                entryPoints: [`packages/${package}/builds/${file}`],
                outfile: `packages/${package}/dist/${file.replace('.js', '.esm.js')}`,
                bundle: true,
                platform: 'neutral',
                mainFields: ['main', 'module'],
            })

            build({
                entryPoints: [`packages/${package}/builds/${file}`],
                outfile: `packages/${package}/dist/${file.replace('.js', '.cjs.js')}`,
                bundle: true,
                target: ['node10.4'],
                platform: 'node',
            })

            writeToPackageDotJson(package, 'main', `dist/${file.replace('.js', '.cjs.js')}`)
            writeToPackageDotJson(package, 'module', `dist/${file.replace('.js', '.esm.js')}`)
        },
    })[file]()
}

function build(options) {
    return require('esbuild').build({
        watch: process.argv.includes('--watch'),
        // external: ['alpinejs'],
        ...options,
    }).catch(() => process.exit(1))
}

function writeToPackageDotJson(package, key, value) {
    let dotJson = new DotJson(`./packages/${package}/package.json`)

    dotJson.set(key, value).save()
}
