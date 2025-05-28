/**
 * MetadataExtractor Library
 * Extracts embedded metadata from image files (PNG, JPEG)
 * Version: 1.0.0
 */

class MetadataExtractor {
    constructor(options = {}) {
        this.options = {
            priorityFields: ['project', 'prompt', 'model', 'seed', 'negative_prompt', 'api_call', 'hash', 'height', 'width', 'steps', 'cfg'],
            copyableFields: ['prompt', 'seed', 'model', 'negative_prompt', 'api_call'],
            maxChunkSize: 65536,
            ...options
        };
        
        this.onProgress = options.onProgress || null;
        this.onError = options.onError || null;
    }

    /**
     * Main extraction function - works with ArrayBuffer and mimeType
     * @param {ArrayBuffer} arrayBuffer - Image file data
     * @param {string} mimeType - Image MIME type
     * @returns {Object} Extracted metadata
     */
    async extractImageMetadata(arrayBuffer, mimeType) {
        const metadata = {};
        
        try {
            const view = new DataView(arrayBuffer);
            
            if (mimeType === "image/png") {
                const pngMetadata = this.extractPNGMetadata(arrayBuffer, view);
                Object.assign(metadata, pngMetadata);
            }
            
            if (mimeType === "image/jpeg") {
                const jpegMetadata = this.extractJPEGMetadata(arrayBuffer, view);
                Object.assign(metadata, jpegMetadata);
            }
            
        } catch (error) {
            console.warn('Error extracting metadata:', error);
            if (this.onError) this.onError(error);
        }
        
        return metadata;
    }

    /**
     * PNG tEXt chunk extraction - proven method
     */
    extractPNGMetadata(buffer, view) {
        const metadata = {};
        
        try {
            // Scan for PNG tEXt chunks using byte signature method
            for (let i = 0; i < view.byteLength; i++) {
                // Look for tEXt chunk signature (116, 69, 88, 116)
                if (view.getUint8(i) === 116 && view.getUint8(i+1) === 69 && 
                    view.getUint8(i+2) === 88 && view.getUint8(i+3) === 116) {
                    
                    // Get chunk length (4 bytes before the signature)
                    let length = view.getUint32(i-4);
                    
                    if (length > 0 && length < this.options.maxChunkSize) {
                        try {
                            // Extract text data using proven method
                            let textData = new TextDecoder().decode(new Uint8Array(buffer.slice(i+4, i+4+length)));
                            
                            // Split key and value at null byte
                            const nullIndex = textData.indexOf('\0');
                            if (nullIndex > 0) {
                                const key = textData.substring(0, nullIndex);
                                const value = textData.substring(nullIndex + 1);
                                
                                if (key && value && key.trim() && value.trim()) {
                                    // Clean up key name and store
                                    const cleanKey = key.replace(/[^\w\s]/g, '').trim();
                                    if (cleanKey) {
                                        metadata[cleanKey] = value.trim();
                                    }
                                }
                            }
                        } catch (decodeError) {
                            // Skip malformed text chunks
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error extracting PNG metadata:', error);
            if (this.onError) this.onError(error);
        }
        
        return metadata;
    }

    /**
     * Basic JPEG EXIF detection
     */
    extractJPEGMetadata(buffer, view) {
        const metadata = {};
        
        try {
            // Look for basic JPEG markers
            for (let i = 0; i < view.byteLength - 4; i++) {
                if (view.getUint8(i) === 0xFF && view.getUint8(i+1) === 0xE1) {
                    // EXIF data present - basic detection
                    metadata['EXIF Data'] = 'Present (basic detection)';
                    break;
                }
            }
        } catch (error) {
            console.warn('Error extracting JPEG metadata:', error);
            if (this.onError) this.onError(error);
        }
        
        return metadata;
    }

    /**
     * Extract metadata from a URL (downloads file first)
     * @param {string} url - File download URL
     * @param {string} mimeType - Image MIME type
     * @returns {Promise<Object>} Extracted metadata
     */
    async extractFromUrl(url, mimeType) {
        try {
            if (this.onProgress) this.onProgress('downloading', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            
            if (this.onProgress) this.onProgress('extracting', url);
            
            const metadata = await this.extractImageMetadata(arrayBuffer, mimeType);
            
            if (this.onProgress) this.onProgress('complete', url, metadata);
            
            return metadata;
        } catch (error) {
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    /**
     * Extract metadata from File object (local files)
     * @param {File} file - File object
     * @returns {Promise<Object>} Extracted metadata
     */
    async extractFromFile(file) {
        try {
            if (this.onProgress) this.onProgress('reading', file.name);
            
            const arrayBuffer = await file.arrayBuffer();
            
            if (this.onProgress) this.onProgress('extracting', file.name);
            
            const metadata = await this.extractImageMetadata(arrayBuffer, file.type);
            
            if (this.onProgress) this.onProgress('complete', file.name, metadata);
            
            return metadata;
        } catch (error) {
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    /**
     * Format metadata for display with priority ordering
     * @param {Object} metadata - Raw metadata object
     * @returns {Array} Formatted metadata array with priority ordering
     */
    formatForDisplay(metadata) {
        const formatted = [];
        const { priorityFields, copyableFields } = this.options;
        
        // Add priority fields first
        priorityFields.forEach(field => {
            if (metadata[field]) {
                formatted.push({
                    key: field,
                    displayKey: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: metadata[field],
                    copyable: copyableFields.includes(field),
                    priority: true
                });
            }
        });
        
        // Add other fields
        Object.entries(metadata).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (!priorityFields.includes(lowerKey) && value) {
                formatted.push({
                    key: key,
                    displayKey: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: value,
                    copyable: false,
                    priority: false
                });
            }
        });
        
        return formatted;
    }

    /**
     * Batch process multiple files/URLs
     * @param {Array} items - Array of {url, mimeType} or File objects
     * @returns {Promise<Array>} Array of {item, metadata, error} results
     */
    async batchExtract(items) {
        const results = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if (this.onProgress) {
                this.onProgress('batch', `Processing ${i + 1} of ${items.length}`, item);
            }
            
            try {
                let metadata;
                
                if (item instanceof File) {
                    metadata = await this.extractFromFile(item);
                } else if (item.url && item.mimeType) {
                    metadata = await this.extractFromUrl(item.url, item.mimeType);
                } else {
                    throw new Error('Invalid item format');
                }
                
                results.push({
                    item: item,
                    metadata: metadata,
                    error: null
                });
                
            } catch (error) {
                results.push({
                    item: item,
                    metadata: {},
                    error: error.message
                });
            }
            
            // Small delay to prevent overwhelming the browser
            if (i % 3 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        return results;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetadataExtractor;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return MetadataExtractor; });
} else {
    window.MetadataExtractor = MetadataExtractor;
}