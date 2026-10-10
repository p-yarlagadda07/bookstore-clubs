import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

auditSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditSchema);
