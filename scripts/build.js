let fs = require('fs');
let DotJson = require('dot-json');

([
    'alpinejs',
    'history',
    'intersect',
    'morph',
    'shared',
]).forEach(package => {
    fs.readdirSync(`./packages/${package}/builds`).forEach(file => {
        bundleFile(package, file)
    });
})

function bundleFile(package, file) {
    ({
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
        external: ['alpinejs'],
        ...options,
    }).catch(() => process.exit(1))
}

function writeToPackageDotJson(package, key, value) {
    let dotJson = new DotJson(`./packages/${package}/package.json`)

    dotJson.set(key, value).save()
}
