/**
 * Alpine Core
 */
bundleForCdn('alpinejs', 'cdn.js')
bundleForNpm('alpinejs', 'module.js')

/**
 * History Plugin
 */
bundleForCdn('history', 'cdn.js')
bundleForNpm('history', 'module.js')

/**
 * Intersect Plugin
 */
bundleForCdn('intersect', 'cdn.js')
bundleForNpm('intersect', 'module.js')

/**
 * Morph Plugin
 */
bundleForCdn('morph', 'cdn.js')
bundleForNpm('morph', 'module.js')
bundleForNode('morph', 'node.js')

// ---

function bundleForNode(package, buildFile, esbuildConfig = {}) {
    bundle(package, buildFile, {
        target: ['node10.4'],
        platform: 'node',
        ...esbuildConfig
    })
}

function bundleForCdn(package, buildFile, esbuildConfig = {}) {
    bundle(package, buildFile, {
        platform: 'browser',
        define: { CDN: true },
        ...esbuildConfig
    })
}

function bundleForNpm(package, buildFile, esbuildConfig = {}) {
    bundle(package, buildFile, {
        platform: 'neutral',
        mainFields: ['main', 'module'],
        ...esbuildConfig
    })
}

function bundle(package, buildFile, esbuildConfig) {
    let inFile = `packages/${package}/builds/${buildFile}`
    let outDir = `packages/${package}/dist`

    return require('esbuild').build({ ...{
        entryPoints: [inFile],
        outdir: outDir,
        bundle: true,
        watch: process.argv.includes('--watch'),
        external: ['alpinejs'],
    },  ...esbuildConfig })
    // Eat errors because they will already by output to the console.
    .catch(() => process.exit(1))
}
