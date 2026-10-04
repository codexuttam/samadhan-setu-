import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import { fileTypeFromBuffer } from 'file-type';
import type { AttachmentKind, ActorType, ScanStatus } from '@prisma/client';
import { config } from '../../config';
import { prisma, type Tx } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { getSettings } from '../../lib/settings';
import { signPayload, verifyPayload, sha256 } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { queue } from '../queue/queue';

// ─────────────────────────────────────────────────────────────
// Storage providers — private by default, access only via short-lived signed URLs
// ─────────────────────────────────────────────────────────────
export interface StorageProvider {
  put(key: string, body: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  signedUrl(key: string, ttlSeconds: number, downloadName?: string): Promise<string>;
}

class LocalPrivateStorage implements StorageProvider {
  private root = path.resolve(config.STORAGE_LOCAL_DIR);
  private file(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(this.root + path.sep)) throw new Error('Invalid storage key');
    return p;
  }
  async put(key: string, body: Buffer) {
    const p = this.file(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, body, { mode: 0o600 });
  }
  async get(key: string) {
    return fs.readFile(this.file(key));
  }
  async signedUrl(key: string, ttlSeconds: number) {
    const token = signPayload({ k: key, exp: Math.floor(Date.now() / 1000) + ttlSeconds }, config.SESSION_SECRET + ':files');
    return `/api/files/${token}`;
  }
  verify(token: string) {
    return verifyPayload<{ k: string }>(token, config.SESSION_SECRET + ':files');
  }
}

class S3PrivateStorage implements StorageProvider {
  private client: any;
  private s3: any;
  private presigner: any;
  private async c() {
    if (!this.client) {
      this.s3 = await import('@aws-sdk/client-s3');
      this.presigner = await import('@aws-sdk/s3-request-presigner');
      this.client = new this.s3.S3Client({
        region: config.S3_REGION,
        endpoint: config.S3_ENDPOINT,
        forcePathStyle: !!config.S3_ENDPOINT,
        credentials: config.S3_ACCESS_KEY_ID
          ? { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY! }
          : undefined,
      });
    }
    return this.client;
  }
  async put(key: string, body: Buffer, mime: string) {
    const c = await this.c();
    await c.send(new this.s3.PutObjectCommand({ Bucket: config.S3_BUCKET, Key: key, Body: body, ContentType: mime, ServerSideEncryption: 'AES256' }));
  }
  async get(key: string) {
    const c = await this.c();
    const out = await c.send(new this.s3.GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }));
    return Buffer.from(await out.Body.transformToByteArray());
  }
  async signedUrl(key: string, ttlSeconds: number) {
    const c = await this.c();
    return this.presigner.getSignedUrl(c, new this.s3.GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }), { expiresIn: ttlSeconds });
  }
}

export const localStorage = new LocalPrivateStorage();
export const storage: StorageProvider = config.STORAGE_DRIVER === 's3' ? new S3PrivateStorage() : localStorage;

// ─────────────────────────────────────────────────────────────
// Validation: extension + magic-byte MIME sniffing + per-type size limits
// ─────────────────────────────────────────────────────────────
type FileClass = 'image' | 'video' | 'document';
const ALLOWED: Record<string, { cls: FileClass; exts: string[] }> = {
  'image/jpeg': { cls: 'image', exts: ['jpg', 'jpeg'] },
  'image/png': { cls: 'image', exts: ['png'] },
  'image/webp': { cls: 'image', exts: ['webp'] },
  'image/heic': { cls: 'image', exts: ['heic'] },
  'video/mp4': { cls: 'video', exts: ['mp4'] },
  'video/quicktime': { cls: 'video', exts: ['mov'] },
  'video/webm': { cls: 'video', exts: ['webm'] },
  'application/pdf': { cls: 'document', exts: ['pdf'] },
};

export interface IncomingFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

export interface ValidatedFile {
  name: string;
  buffer: Buffer;
  mime: string;
  cls: FileClass;
  size: number;
}

export async function validateFiles(files: IncomingFile[] | undefined): Promise<ValidatedFile[]> {
  if (!files?.length) return [];
  const s = await getSettings();
  if (files.length > s.uploads.maxFilesPerUpload) throw Errors.badRequest(`You can upload up to ${s.uploads.maxFilesPerUpload} files.`);
  const out: ValidatedFile[] = [];
  for (const f of files) {
    const safeName = path.basename(f.originalname).replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'file';
    const ext = safeName.split('.').pop()?.toLowerCase() ?? '';
    const sniffed = await fileTypeFromBuffer(f.buffer);
    const rule = sniffed ? ALLOWED[sniffed.mime] : undefined;
    if (!sniffed || !rule || !rule.exts.includes(ext)) {
      throw Errors.badRequest(`"${safeName}" is not an allowed file type. Use JPG, PNG, WEBP, MP4, MOV or PDF.`);
    }
    const maxMb = rule.cls === 'image' ? s.uploads.imageMaxMb : rule.cls === 'video' ? s.uploads.videoMaxMb : s.uploads.documentMaxMb;
    if (f.size > maxMb * 1024 * 1024) throw Errors.badRequest(`"${safeName}" exceeds the ${maxMb} MB limit for ${rule.cls}s.`);
    out.push({ name: safeName, buffer: f.buffer, mime: sniffed.mime, cls: rule.cls, size: f.size });
  }
  return out;
}

/** Upload to private storage first (outside the tx), then record rows inside the tx. */
export async function storeFiles(files: ValidatedFile[]) {
  const stored: { key: string; f: ValidatedFile; hash: string }[] = [];
  for (const f of files) {
    const ext = ALLOWED[f.mime].exts[0];
    const key = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
    await storage.put(key, f.buffer, f.mime);
    stored.push({ key, f, hash: sha256(f.buffer) });
  }
  return stored;
}

export async function recordAttachments(
  tx: Tx,
  ticketId: string,
  stored: Awaited<ReturnType<typeof storeFiles>>,
  kind: AttachmentKind,
  by: { type: ActorType; id?: string | null },
) {
  const ids: string[] = [];
  for (const s of stored) {
    const row = await tx.ticketAttachment.create({
      data: {
        ticketId,
        kind,
        storageKey: s.key,
        originalName: s.f.name,
        mimeType: s.f.mime,
        sizeBytes: s.f.size,
        sha256: s.hash,
        uploadedByType: by.type,
        uploadedById: by.id ?? null,
        scanStatus: 'PENDING',
      },
    });
    ids.push(row.id);
  }
  return ids;
}

export function enqueueScans(ids: string[]) {
  for (const id of ids) void queue.enqueue('file-scan', { id }, { jobId: `scan-${id}` });
}

/** Signed URLs are only issued for files that passed (or, in dev, skipped) scanning. */
export async function presentAttachments(rows: { id: string; kind: AttachmentKind; storageKey: string; originalName: string; mimeType: string; sizeBytes: number; scanStatus: ScanStatus; createdAt: Date }[]) {
  return Promise.all(
    rows.map(async (a) => ({
      id: a.id,
      kind: a.kind,
      name: a.originalName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      scanStatus: a.scanStatus,
      createdAt: a.createdAt,
      url: a.scanStatus === 'CLEAN' || a.scanStatus === 'SKIPPED' ? await storage.signedUrl(a.storageKey, 600) : null,
    })),
  );
}

// ─────────────────────────────────────────────────────────────
// Malware scanning (ClamAV INSTREAM). Pluggable; skipped only when not configured.
// ─────────────────────────────────────────────────────────────
function clamScan(buf: Buffer): Promise<'CLEAN' | 'INFECTED'> {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: config.CLAMAV_HOST!, port: config.CLAMAV_PORT });
    let reply = '';
    sock.setTimeout(30_000, () => sock.destroy(new Error('clamd timeout')));
    sock.on('connect', () => {
      sock.write('zINSTREAM\0');
      for (let i = 0; i < buf.length; i += 64 * 1024) {
        const chunk = buf.subarray(i, i + 64 * 1024);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(chunk.length);
        sock.write(len);
        sock.write(chunk);
      }
      sock.write(Buffer.alloc(4));
    });
    sock.on('data', (d) => (reply += d.toString()));
    sock.on('end', () => resolve(reply.includes('FOUND') ? 'INFECTED' : 'CLEAN'));
    sock.on('error', reject);
  });
}

async function scanJob({ id }: { id: string }) {
  const a = await prisma.ticketAttachment.findUnique({ where: { id } });
  if (!a || a.scanStatus !== 'PENDING') return;
  let status: ScanStatus = 'SKIPPED';
  if (config.CLAMAV_HOST) {
    try {
      status = await clamScan(await storage.get(a.storageKey));
    } catch (err) {
      logger.warn('Malware scan failed', { attachmentId: id, err: err as Error });
      status = 'FAILED';
    }
  }
  await prisma.ticketAttachment.update({ where: { id }, data: { scanStatus: status } });
}

export async function registerFileWorkers() {
  await queue.register('file-scan', scanJob);
}
