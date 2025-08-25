import { gzipCompress, gzipDecompress, gzipCompressString, gzipDecompressToString } from './compression';

export const compressVectorData = gzipCompress;
export const decompressVectorData = gzipDecompress;
export const compressVectorString = gzipCompressString;
export const decompressVectorToString = gzipDecompressToString; 