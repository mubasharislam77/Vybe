import { ObjectId } from 'mongodb';
import { auditLogs } from '@/lib/db/collections';
import type { AuditLogEntry } from '@/types/domain';

export async function recordAuditLog(entry: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  diff?: Record<string, unknown>;
}): Promise<void> {
  const col = await auditLogs();
  const doc: Omit<AuditLogEntry, '_id'> = {
    actorId: new ObjectId(entry.actorId),
    actorEmail: entry.actorEmail,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    diff: entry.diff,
    at: new Date(),
  };
  await col.insertOne(doc as AuditLogEntry);
}

export async function listAuditLogs(params: { targetType?: string; targetId?: string; limit?: number }) {
  const col = await auditLogs();
  const filter: Record<string, unknown> = {};
  if (params.targetType) filter.targetType = params.targetType;
  if (params.targetId) filter.targetId = params.targetId;
  return col.find(filter).sort({ at: -1 }).limit(params.limit ?? 100).toArray();
}
