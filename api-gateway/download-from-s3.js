import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

// Configure AWS SDK for Supabase S3-compatible storage
const s3 = new AWS.S3({
    endpoint: process.env.SUPABASE_STORAGE_URL || 'https://tjkpliasdjpgunbhsiza.storage.supabase.co',
    accessKeyId: process.env.SUPABASE_ACCESS_KEY || 'd740d4e0e2fdf3fc329cfbe2ffe058ab',
    secretAccessKey: process.env.SUPABASE_SECRET_KEY || '413082c0116292b5369ec6324bc930896580eb826ac5f8117e54582220423554',
    region: 'us-east-1',
    s3ForcePathStyle: true, // Required for non-AWS S3-compatible services
    signatureVersion: 'v4'
});

// Function to list all objects in the bucket
async function listAllObjects(bucketName) {
    const allObjects = [];
    let continuationToken = null;
    
    do {
        const params = {
            Bucket: bucketName,
            ...(continuationToken && { ContinuationToken: continuationToken })
        };
        
        try {
            const response = await s3.listObjectsV2(params).promise();
            allObjects.push(...response.Contents);
            continuationToken = response.NextContinuationToken;
            
            console.log(`Found ${response.Contents.length} objects in this batch...`);
        } catch (error) {
            console.error('Error listing objects:', error);
            throw error;
        }
    } while (continuationToken);
    
    return allObjects;
}

// Function to download a single file
async function downloadFile(bucketName, key, downloadPath) {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    
    try {
        const data = await s3.getObject(params).promise();
        
        // Create directory if it doesn't exist
        const dir = path.dirname(downloadPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(downloadPath, data.Body);
        console.log(`Downloaded: ${key}`);
    } catch (error) {
        console.error(`Error downloading ${key}:`, error);
    }
}

// Function to check if bucket exists and is accessible
async function checkBucketAccess(bucketName) {
    try {
        console.log(`Checking access to bucket: ${bucketName}`);
        
        // Try to list objects with a limit to check access
        const params = {
            Bucket: bucketName,
            MaxKeys: 1
        };
        
        const response = await s3.listObjectsV2(params).promise();
        console.log(`✅ Successfully connected to bucket: ${bucketName}`);
        console.log(`📊 Bucket contains approximately ${response.KeyCount || 'unknown'} objects`);
        return true;
    } catch (error) {
        console.error(`❌ Cannot access bucket ${bucketName}:`, error.message);
        
        if (error.statusCode === 403) {
            console.error('🔐 Access denied. Check your AWS credentials and permissions.');
        } else if (error.statusCode === 404) {
            console.error('📦 Bucket not found. Check the bucket name and region.');
        } else {
            console.error('🌐 Network or configuration error. Check endpoint and credentials.');
        }
        
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Verify SUPABASE_STORAGE_URL environment variable');
        console.error('2. Verify SUPABASE_ACCESS_KEY and SUPABASE_SECRET_KEY');
        console.error('3. Check if the bucket exists in your Supabase project');
        console.error('4. Ensure the credentials have read access to the bucket');
        
        return false;
    }
}

// Main function to download entire bucket
async function downloadBucket(bucketName, localDirectory = './downloads') {
    try {
        console.log(`Starting download of bucket: ${bucketName}`);
        
        // First check if we can access the bucket
        const hasAccess = await checkBucketAccess(bucketName);
        if (!hasAccess) {
            console.error('❌ Cannot proceed with download due to access issues.');
            return;
        }
        
        // List all objects
        const objects = await listAllObjects(bucketName);
        console.log(`Total objects found: ${objects.length}`);
        
        if (objects.length === 0) {
            console.log('No objects found in bucket');
            return;
        }
        
        // Create local directory
        if (!fs.existsSync(localDirectory)) {
            fs.mkdirSync(localDirectory, { recursive: true });
        }
        
        // Download each file
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const localPath = path.join(localDirectory, obj.Key);
            
            console.log(`Downloading ${i + 1}/${objects.length}: ${obj.Key}`);
            await downloadFile(bucketName, obj.Key, localPath);
        }
        
        console.log('Download complete!');
        
    } catch (error) {
        console.error('Error during bucket download:', error);
    }
}

// Function to list available buckets (may not work with Supabase)
async function listBuckets() {
    try {
        console.log('Note: Supabase storage may not support bucket listing.');
        console.log('Trying to list buckets...');
        const response = await s3.listBuckets().promise();
        console.log('Available buckets:');
        response.Buckets.forEach(bucket => {
            console.log(`- ${bucket.Name} (created: ${bucket.CreationDate})`);
        });
        return response.Buckets;
    } catch (error) {
        console.error('Error listing buckets:', error.message);
        console.log('This is expected with Supabase storage. Using known bucket name instead.');
        
        // Return a mock bucket based on the endpoint
        const mockBucket = {
            Name: 'artful-archives', // Common Supabase bucket name
            CreationDate: new Date()
        };
        console.log(`Using bucket: ${mockBucket.Name}`);
        return [mockBucket];
    }
}

// Usage examples:

// 1. List all available buckets
console.log('Listing available buckets...');
listBuckets().then(buckets => {
    if (buckets.length > 0) {
        console.log(`\nTo download a specific bucket, call:`);
        console.log(`downloadBucket('bucket-name', './local-folder')`);
        
        // If you want to download the first bucket automatically:
        // const bucketName = buckets[0].Name;
        // downloadBucket(bucketName, './downloads');
    }
}).catch(error => {
    console.error('Failed to list buckets:', error);
});

// 2. Or download a specific bucket (uncomment and modify as needed):
// downloadBucket('your-bucket-name', './downloads');

// Export functions for use in other modules
export { listBuckets, downloadBucket, listAllObjects, downloadFile };