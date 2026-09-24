import { basename, extname } from 'node:path';
import { relative } from 'node:path/posix';
import { mkdirSync, statSync } from 'node:fs';
import { writeFile, rename, rm, opendir, stat, readFile } from 'node:fs/promises';
import { normalizePath } from 'vite';
import { builtins, builtinOutputFormats, parseURL, extractEntries, resolveConfigs, urlFormat, generateTransforms, applyTransforms } from 'imagetools-core';
export * from 'imagetools-core';
import { createFilter, dataToEsm } from '@rollup/pluginutils';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

let tmpCounter = 0;
/**
 * Writes `data` to `path` by staging it under a unique temporary name in the same
 * directory and renaming it into place. `rename(2)` is atomic within a filesystem,
 * so an interrupted build leaves either no file or a complete one — never a
 * truncated file that a later run would read back as a valid cache entry.
 */
async function writeFileAtomic(path, data) {
    const tmpPath = `${path}.${process.pid}-${tmpCounter++}.tmp`;
    try {
        await writeFile(tmpPath, data);
        await rename(tmpPath, path);
    }
    catch (err) {
        await rm(tmpPath, { force: true });
        throw err;
    }
}
const createBasePath = (base) => {
    return ((base === null || base === void 0 ? void 0 : base.replace(/\/$/, '')) || '') + '/@imagetools/';
};
function generateImageID(config, imageHash) {
    return hash([JSON.stringify(config), imageHash]);
}
function hash(keyParts) {
    let hash = createHash('sha1');
    for (const keyPart of keyParts) {
        hash = hash.update(keyPart);
    }
    return hash.digest('hex');
}

const defaultOptions = {
    include: /^[^?]+\.(avif|gif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/,
    exclude: 'public/**/*',
    removeMetadata: true
};
const transformPromises = new Map();
function imagetools(userOptions = {}) {
    var _a, _b, _c, _d, _e;
    const pluginOptions = { ...defaultOptions, ...userOptions };
    const cacheOptions = {
        enabled: (_b = (_a = pluginOptions.cache) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true,
        dir: (_d = (_c = pluginOptions.cache) === null || _c === void 0 ? void 0 : _c.dir) !== null && _d !== void 0 ? _d : './node_modules/.cache/imagetools',
        retention: (_e = pluginOptions.cache) === null || _e === void 0 ? void 0 : _e.retention
    };
    mkdirSync(`${cacheOptions.dir}`, { recursive: true });
    const filter = createFilter(pluginOptions.include, pluginOptions.exclude);
    const transformFactories = pluginOptions.extendTransforms ? pluginOptions.extendTransforms(builtins) : builtins;
    const outputFormats = pluginOptions.extendOutputFormats
        ? pluginOptions.extendOutputFormats(builtinOutputFormats)
        : builtinOutputFormats;
    let viteConfig;
    let basePath;
    const generatedImages = new Map();
    return {
        name: 'imagetools',
        enforce: 'pre',
        configResolved(cfg) {
            viteConfig = cfg;
            basePath = createBasePath(viteConfig.base);
        },
        load: {
            filter: { id: { include: pluginOptions.include, exclude: pluginOptions.exclude } },
            async handler(id) {
                var _a, _b, _c, _d, _e, _f;
                if (!filter(id))
                    return null;
                const srcURL = parseURL(id);
                const pathname = decodeURIComponent(srcURL.pathname);
                // lazy loaders so that we can load the metadata in defaultDirectives if needed
                // but if there are no directives then we can just skip loading
                let lazyImg;
                const lazyLoadImage = () => {
                    if (lazyImg)
                        return lazyImg;
                    return (lazyImg = sharp(pathname));
                };
                let lazyMetadata;
                const lazyLoadMetadata = async () => {
                    if (lazyMetadata)
                        return lazyMetadata;
                    return (lazyMetadata = await lazyLoadImage().metadata());
                };
                const defaultDirectives = typeof pluginOptions.defaultDirectives === 'function'
                    ? await pluginOptions.defaultDirectives(srcURL, lazyLoadMetadata)
                    : pluginOptions.defaultDirectives || new URLSearchParams();
                const directives = new URLSearchParams({
                    ...Object.fromEntries(defaultDirectives),
                    ...Object.fromEntries(srcURL.searchParams)
                });
                if (!directives.toString())
                    return null;
                const img = lazyLoadImage();
                const widthParam = directives.get('w');
                const heightParam = directives.get('h');
                if (directives.get('allowUpscale') !== 'true' && (widthParam || heightParam)) {
                    const metadata = await lazyLoadMetadata();
                    const clamp = (s, intrinsic) => [...new Set(s.split(';').map((d) => (parseInt(d) <= intrinsic ? d : intrinsic.toString())))].join(';');
                    if (widthParam) {
                        const intrinsicWidth = metadata.width || 0;
                        directives.set('w', clamp(widthParam, intrinsicWidth));
                    }
                    if (heightParam) {
                        const intrinsicHeight = metadata.height || 0;
                        directives.set('h', clamp(heightParam, intrinsicHeight));
                    }
                }
                const parameters = extractEntries(directives);
                const imageConfigs = (_b = (_a = pluginOptions.resolveConfigs) === null || _a === void 0 ? void 0 : _a.call(pluginOptions, parameters, outputFormats)) !== null && _b !== void 0 ? _b : resolveConfigs(parameters, outputFormats);
                const logger = {
                    info: (msg) => viteConfig.logger.info(msg),
                    warn: (msg) => this.warn(msg),
                    error: (msg) => this.error(msg)
                };
                // hash the source bytes to avoid going through Sharp which would result in an image decode
                const imageHash = hash([await readFile(pathname)]);
                const executeTransform = async (id, imageConfig) => {
                    var _a, _b, _c, _d;
                    let image;
                    let metadata;
                    let raw;
                    let cachedBuffer;
                    if (cacheOptions.enabled &&
                        ((_b = (_a = statSync(`${cacheOptions.dir}/${id}`, { throwIfNoEntry: false })) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0) > 0) {
                        cachedBuffer = await readFile(`${cacheOptions.dir}/${id}`);
                        image = sharp(cachedBuffer);
                        raw = await image.metadata();
                        // On a cache hit the transforms are not re-run, so the applied-transform values
                        // (`flip`, `quality`, `rotate`, ...) cannot be reconstructed from the encoded file.
                        // Only `format` is restored below.
                        metadata = {
                            info: {
                                width: raw.width,
                                height: raw.height,
                                autoOriented: raw.autoOrient
                            },
                            transforms: {
                                format: raw.format
                            }
                        };
                        // we set the format on the metadata during transformation using the format directive
                        // when restoring from the cache, we use sharp to read it from the image and that can result in a
                        // different value: avif images are detected as heif (see https://github.com/lovell/sharp/issues/2504
                        // and https://github.com/lovell/sharp/issues/3746) and jpg is detected as jpeg. Restore the directive
                        // value so emitted filenames don't change between cache misses and cache hits.
                        // `ImageConfig` values are always strings, so a missing `format` is the only
                        // `undefined` case; custom `resolveConfigs` overrides must return string values.
                        if (imageConfig.format !== undefined && metadata.transforms.format !== imageConfig.format)
                            metadata.transforms.format = imageConfig.format;
                    }
                    else {
                        const { transforms } = generateTransforms(imageConfig, transformFactories, srcURL.searchParams, logger);
                        const res = await applyTransforms(transforms, img.clone(), pluginOptions.removeMetadata);
                        image = res.image;
                        metadata = res.metadata;
                        // Transforms report their target dimensions on the metadata, but the encoded image can differ
                        // (e.g. `rotate` swaps width and height). Reconcile against the actual output so the metadata
                        // and the pixel density descriptors derived from it match the dimensions the cache-hit path
                        // reads back from the cached file.
                        const { data, info } = await image.toBuffer({ resolveWithObject: true });
                        cachedBuffer = data;
                        metadata.info.width = info.width;
                        metadata.info.height = info.height;
                        // Read the metadata from the encoded output so a cache miss reports the
                        // same `sharpMetadata` as the cache-hit path reads back from the file.
                        raw = await sharp(cachedBuffer).metadata();
                        if (cacheOptions.enabled) {
                            await writeFileAtomic(`${cacheOptions.dir}/${id}`, cachedBuffer);
                        }
                    }
                    const processedMetadata = {
                        src: '',
                        image,
                        config: imageConfig,
                        info: metadata.info,
                        transforms: metadata.transforms,
                        sharpMetadata: raw
                    };
                    generatedImages.set(id, processedMetadata);
                    if (directives.has('inline')) {
                        const inlineBuffer = cachedBuffer || (await image.toBuffer());
                        processedMetadata.src = `data:image/${processedMetadata.transforms.format};base64,${inlineBuffer.toString('base64')}`;
                    }
                    else if (viteConfig.command === 'serve') {
                        processedMetadata.src = ((_d = (_c = viteConfig === null || viteConfig === void 0 ? void 0 : viteConfig.server) === null || _c === void 0 ? void 0 : _c.origin) !== null && _d !== void 0 ? _d : '') + basePath + id;
                    }
                    else {
                        const fileHandle = this.emitFile({
                            name: basename(pathname, extname(pathname)) + `.${processedMetadata.transforms.format}`,
                            source: cachedBuffer || (await image.toBuffer()),
                            type: 'asset',
                            originalFileName: normalizePath(relative(viteConfig.root, srcURL.pathname))
                        });
                        processedMetadata.src = `__VITE_ASSET__${fileHandle}__`;
                    }
                    return processedMetadata;
                };
                /** allows only one transform to be run for a given id */
                async function synchronizedTransform(id, imageConfig) {
                    let transformPromise = transformPromises.get(id);
                    if (transformPromise)
                        return transformPromise;
                    let resolve;
                    let reject;
                    transformPromise = new Promise((res, rej) => {
                        resolve = res;
                        reject = rej;
                    });
                    transformPromises.set(id, transformPromise);
                    executeTransform(id, imageConfig)
                        .then(resolve, reject)
                        .finally(() => {
                        transformPromises.delete(id);
                    });
                    return transformPromise;
                }
                const outputs = await Promise.all(imageConfigs.map((config) => {
                    const id = generateImageID(config, imageHash);
                    return synchronizedTransform(id, config);
                }));
                let outputFormat = urlFormat();
                const asParam = (_c = directives.get('as')) === null || _c === void 0 ? void 0 : _c.split(':');
                const as = asParam ? asParam[0] : undefined;
                for (const [key, format] of Object.entries(outputFormats)) {
                    if (as === key) {
                        outputFormat = format(asParam && asParam[1] ? asParam[1].split(';') : undefined);
                        break;
                    }
                }
                return dataToEsm(await outputFormat(outputs), {
                    namedExports: (_f = (_d = pluginOptions.namedExports) !== null && _d !== void 0 ? _d : (_e = viteConfig.json) === null || _e === void 0 ? void 0 : _e.namedExports) !== null && _f !== void 0 ? _f : true,
                    compact: !!viteConfig.build.minify,
                    preferConst: true
                });
            }
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                var _a;
                if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith(basePath)) {
                    const [, id] = req.url.split(basePath);
                    const processedImage = generatedImages.get(id);
                    // Respond to a miss instead of throwing. The status is 404 regardless,
                    // but a throw makes Vite treat this as an *internal server error*,
                    // which in dev raises the error overlay over the whole page. That is a
                    // large consequence for one image failing to resolve.
                    if (!processedImage) {
                        server.config.logger.error(`vite-imagetools cannot find image with requested id "${id}"`);
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(`vite-imagetools has no image with id "${id}"`);
                        return;
                    }
                    const { image } = processedImage;
                    if (pluginOptions.removeMetadata === false) {
                        image.withMetadata();
                    }
                    res.setHeader('Content-Type', `image/${processedImage.transforms.format}`);
                    return image.clone().pipe(res);
                }
                next();
            });
        },
        async buildEnd(error) {
            if (!error && cacheOptions.enabled && cacheOptions.retention !== undefined && viteConfig.command !== 'serve') {
                const dir = await opendir(cacheOptions.dir);
                for await (const dirent of dir) {
                    if (dirent.isFile()) {
                        if (generatedImages.has(dirent.name))
                            continue;
                        const imagePath = `${cacheOptions.dir}/${dirent.name}`;
                        const stats = await stat(imagePath);
                        if (Date.now() - stats.mtimeMs > cacheOptions.retention * 1000) {
                            console.debug(`deleting stale cached image ${dirent.name}`);
                            await rm(imagePath);
                        }
                    }
                }
            }
        }
    };
}

export { imagetools };
//# sourceMappingURL=index.js.map
