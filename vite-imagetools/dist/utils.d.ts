import type { ImageConfig } from 'imagetools-core';
/**
 * Writes `data` to `path` by staging it under a unique temporary name in the same
 * directory and renaming it into place. `rename(2)` is atomic within a filesystem,
 * so an interrupted build leaves either no file or a complete one — never a
 * truncated file that a later run would read back as a valid cache entry.
 */
export declare function writeFileAtomic(path: string, data: Buffer): Promise<void>;
export declare const createBasePath: (base?: string) => string;
export declare function generateImageID(config: ImageConfig, imageHash: string): string;
export declare function hash(keyParts: Array<string | NodeJS.ArrayBufferView>): string;
