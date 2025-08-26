// Orbital8 Metadata Sync Worker - Release 2
// Handles background synchronization of metadata to OneDrive App Root

class MetadataSyncWorker {
    constructor() {
        this.accessToken = null;
        this.workQueue = [];
        this.isProcessing = false;
        this.retryDelays = [1000, 3000, 5000]; // Progressive retry delays
        this.maxRetries = 3;
    }

    async processMessage(event) {
        const { type, data } = event.data;

        try {
            switch (type) {
                case 'INIT':
                    await this.initialize(data);
                    break;
                case 'SYNC_METADATA':
                    await this.syncMetadata(data);
                    break;
                case 'UPDATE_TOKEN':
                    this.updateToken(data.token);
                    break;
                case 'PAUSE':
                    this.pauseProcessing();
                    break;
                case 'RESUME':
                    this.resumeProcessing();
                    break;
                default:
                    this.postMessage({ type: 'ERROR', error: `Unknown message type: ${type}` });
            }
        } catch (error) {
            this.postMessage({ 
                type: 'ERROR', 
                error: error.message,
                details: error.stack 
            });
        }
    }

    async initialize(data) {
        this.accessToken = data.token;
        this.postMessage({ type: 'INITIALIZED' });
    }

    updateToken(token) {
        this.accessToken = token;
        if (this.isProcessing) {
            this.resumeProcessing();
        }
    }

    pauseProcessing() {
        this.isProcessing = false;
    }

    resumeProcessing() {
        if (!this.isProcessing && this.workQueue.length > 0) {
            this.isProcessing = true;
            this.processQueue();
        }
    }

    async syncMetadata(data) {
        const { dirtyFiles, metadataCache } = data;
        
        this.postMessage({ 
            type: 'SYNC_STARTED', 
            total: dirtyFiles.length 
        });

        // Add all dirty files to work queue
        dirtyFiles.forEach(fileId => {
            this.workQueue.push({
                fileId,
                metadata: metadataCache[fileId],
                retryCount: 0
            });
        });

        this.isProcessing = true;
        await this.processQueue();
    }

    async processQueue() {
        let processed = 0;
        let failed = [];

        while (this.workQueue.length > 0 && this.isProcessing) {
            const workItem = this.workQueue.shift();
            
            try {
                await this.syncSingleFile(workItem);
                processed++;
                
                this.postMessage({
                    type: 'SYNC_PROGRESS',
                    processed,
                    total: processed + this.workQueue.length + failed.length,
                    fileId: workItem.fileId
                });

            } catch (error) {
                if (error.status === 401) {
                    // Token expired - pause and request new token
                    this.workQueue.unshift(workItem); // Put item back at front
                    this.pauseProcessing();
                    this.postMessage({ type: 'TOKEN_EXPIRED' });
                    return;
                }

                // Handle other errors with retry logic
                if (workItem.retryCount < this.maxRetries) {
                    workItem.retryCount++;
                    
                    // Wait before retry
                    const delay = this.retryDelays[Math.min(workItem.retryCount - 1, this.retryDelays.length - 1)];
                    await this.sleep(delay);
                    
                    this.workQueue.push(workItem); // Add to end for retry
                    
                    this.postMessage({
                        type: 'SYNC_RETRY',
                        fileId: workItem.fileId,
                        attempt: workItem.retryCount,
                        error: error.message
                    });
                } else {
                    // Max retries exceeded
                    failed.push({
                        fileId: workItem.fileId,
                        error: error.message
                    });
                    
                    this.postMessage({
                        type: 'SYNC_FAILED',
                        fileId: workItem.fileId,
                        error: error.message
                    });
                }
            }
        }

        // Sync complete
        this.isProcessing = false;
        this.postMessage({
            type: 'SYNC_COMPLETE',
            processed,
            failed: failed.length,
            failedFiles: failed
        });
    }

    async syncSingleFile(workItem) {
        const { fileId, metadata } = workItem;
        
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const url = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${fileId}.json:/content`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata, null, 2)
        });

        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            
            try {
                const errorData = await response.json();
                error.details = errorData;
            } catch (e) {
                // Ignore JSON parse errors
            }
            
            throw error;
        }

        return await response.json();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    postMessage(message) {
        self.postMessage(message);
    }
}

// Initialize worker
const syncWorker = new MetadataSyncWorker();

// Handle messages from main thread
self.addEventListener('message', (event) => {
    syncWorker.processMessage(event);
});

// Handle worker errors
self.addEventListener('error', (event) => {
    syncWorker.postMessage({
        type: 'WORKER_ERROR',
        error: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
    syncWorker.postMessage({
        type: 'WORKER_ERROR',
        error: event.reason?.message || 'Unhandled promise rejection',
        details: event.reason
    });
});
