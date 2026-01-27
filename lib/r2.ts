import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { isR2Configured } from './env'

// Lazy initialization of R2 client
let r2Client: S3Client | null = null

function getR2Client(): S3Client {
    if (!r2Client) {
        if (!isR2Configured()) {
            throw new Error('R2 storage is not configured. Please set R2_* environment variables.')
        }
        r2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        })
    }
    return r2Client
}

function getBucketName(): string {
    return process.env.R2_BUCKET_NAME!
}

function getPublicUrl(): string {
    return process.env.R2_PUBLIC_URL!
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
    file: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    await getR2Client().send(new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: file,
        ContentType: contentType,
    }))

    return `${getPublicUrl()}/${key}`
}

/**
 * Upload a Base64 encoded file to R2
 */
export async function uploadBase64ToR2(
    base64Data: string,
    key: string,
    contentType: string
): Promise<string> {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Content = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data

    const buffer = Buffer.from(base64Content, 'base64')
    return uploadToR2(buffer, key, contentType)
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
    await getR2Client().send(new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    }))
}

/**
 * Generate a presigned URL for secure uploads
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        ContentType: contentType,
    })

    return getSignedUrl(getR2Client(), command, { expiresIn })
}

/**
 * Generate a unique file key for storage (single school - no school prefix)
 */
export function generateFileKey(
    folder: string,
    fileName: string
): string {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

    return `${folder}/${timestamp}-${randomSuffix}-${sanitizedName}`
}

/**
 * Extract the key from a full R2 URL
 */
export function extractKeyFromUrl(url: string): string | null {
    const publicUrl = getPublicUrl()
    if (!url.startsWith(publicUrl)) return null
    return url.replace(`${publicUrl}/`, '')
}

