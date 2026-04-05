const { BlobServiceClient } = require('@azure/storage-blob');

/**
 * Set Azure Blob Storage default service version to support range requests
 * This enables video streaming with HTTP 206 Partial Content responses
 * Reference: https://dev.to/poc275/streaming-videos-from-azure-blob-storage-10gj
 */
async function setupBlobStorageForStreaming() {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      console.warn('Azure Storage connection string not configured. Skipping blob storage setup.');
      return false;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // Set default service version to support range requests (HTTP 206)
    // This allows videos to stream properly instead of downloading completely
    await blobServiceClient.setProperties({
      defaultServiceVersion: '2021-04-10',
      cors: [{
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['*'],
        exposedHeaders: ['*'],
        maxAgeInSeconds: 3600
      }]
    });

    console.log('✓ Azure Blob Storage configured for video streaming (range requests enabled)');
    return true;
  } catch (error) {
    console.error('Failed to configure Azure Blob Storage:', error.message);
    return false;
  }
}

module.exports = { setupBlobStorageForStreaming };
