import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';
import { terser } from "rollup-plugin-terser";

export default {
    input: 'src/index.js',
    output: {
        name: 'Alpine',
        file: 'dist/alpine.js',
        format: 'umd',
    },
    plugins: [
        replace({
            // Inject Alpine.js package version number.
            "process.env.PKG_VERSION": `"${pkg.version}"`
        }),
        resolve(),
        // terser(),
        filesize(),
        babel({
            exclude: 'node_modules/**'
        }),
    ]
}
