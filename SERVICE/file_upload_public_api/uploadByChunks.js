const uploadFileInChunks = async (file) => {
    const chunkSize = 10 * 1024 * 1024;  // 10MB chunk size
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunkData = await chunk.arrayBuffer();
        // Send each chunk to Lambda API Gateway
        await uploadChunkToLambda(chunkData, i);
    }
};

const uploadChunkToLambda = async (chunkData, chunkIndex) => {
    const response = await fetch('/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chunkIndex,
            chunkData: chunkData.toString('base64'),  // Send the chunk in base64
        }),
    });

    if (!response.ok) {
        console.error('Failed to upload chunk');
    }
};