// QR Code Verification Types for F10.3 - QR Code Verification System

/**
 * Types of QR codes that can be generated
 */
export type QRCodeType =
  | 'location' // Verify presence at a location
  | 'chore' // Specific chore verification
  | 'equipment' // Equipment/supply checkout
  | 'room' // Room entry/exit tracking
  | 'task_station' // Task-specific station (e.g., dishwashing station)
  | 'checkpoint' // Multiple checkpoints for complex chores
  | 'supply_cabinet'; // Track supply access

/**
 * QR code verification requirements
 */
export type VerificationRequirement =
  | 'scan_only' // Just scan to verify
  | 'scan_and_photo' // Scan + take photo proof
  | 'scan_and_confirm' // Scan + manual confirmation
  | 'timed_scan' // Must scan within time window
  | 'sequential_scan' // Must scan in order (checkpoints)
  | 'gps_verified'; // Verify GPS matches location

/**
 * QR code status
 */
export type QRCodeStatus = 'active' | 'inactive' | 'expired' | 'revoked';

/**
 * QR Code entity
 */
export interface QRCode {
  id: string;
  householdId: string;
  type: QRCodeType;
  name: string;
  description: string | null;
  status: QRCodeStatus;

  // Code data
  codeData: string; // Unique code embedded in QR
  codeUrl: string; // URL encoded in QR (deep link)

  // Location (optional)
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null; // GPS verification radius

  // Linked entities
  linkedChoreId: string | null;
  linkedZoneName: string | null;

  // Verification settings
  verificationRequirement: VerificationRequirement;
  requiresPhoto: boolean;
  expiresAt: Date | null;

  // Checkpoint settings (for sequential scans)
  checkpointOrder: number | null;
  checkpointGroupId: string | null;

  // Stats
  totalScans: number;
  lastScannedAt: Date | null;
  lastScannedBy: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

/**
 * QR code scan record
 */
export interface QRCodeScan {
  id: string;
  qrCodeId: string;
  householdId: string;
  memberId: string;

  // Scan details
  scannedAt: Date;
  scanLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;

  // Verification result
  verificationStatus: 'success' | 'failed' | 'pending';
  failureReason: string | null;

  // Photo proof (if required)
  photoUrl: string | null;
  photoVerified: boolean | null;

  // GPS verification (if required)
  gpsVerified: boolean | null;
  gpsDistanceMeters: number | null;

  // Linked completion (if chore was completed)
  choreCompletionId: string | null;

  // Points awarded
  bonusPointsAwarded: number;

  // Device info
  deviceInfo: {
    platform: string;
    deviceModel: string;
    appVersion: string;
  } | null;
}

/**
 * Checkpoint progress for sequential scans
 */
export interface CheckpointProgress {
  id: string;
  memberId: string;
  householdId: string;
  checkpointGroupId: string;
  choreId: string | null;

  // Progress
  totalCheckpoints: number;
  completedCheckpoints: number;
  completedCheckpointIds: string[];

  // Status
  status: 'in_progress' | 'completed' | 'expired' | 'abandoned';
  startedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;

  // Points
  bonusPointsAwarded: number;
}

/**
 * Equipment checkout record
 */
export interface EquipmentCheckout {
  id: string;
  qrCodeId: string;
  householdId: string;
  memberId: string;

  // Equipment details
  equipmentName: string;
  checkedOutAt: Date;
  checkedInAt: Date | null;

  // Status
  status: 'checked_out' | 'checked_in' | 'overdue';
  dueAt: Date | null;

  // Notes
  checkoutNotes: string | null;
  checkinNotes: string | null;
  conditionOnCheckout: 'good' | 'fair' | 'needs_repair';
  conditionOnCheckin: 'good' | 'fair' | 'needs_repair' | null;
}

/**
 * Create QR code input
 */
export interface CreateQRCodeInput {
  type: QRCodeType;
  name: string;
  description?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  linkedChoreId?: string;
  linkedZoneName?: string;
  verificationRequirement?: VerificationRequirement;
  requiresPhoto?: boolean;
  expiresAt?: Date;
  checkpointOrder?: number;
  checkpointGroupId?: string;
}

/**
 * Update QR code input
 */
export interface UpdateQRCodeInput {
  name?: string;
  description?: string | null;
  status?: QRCodeStatus;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  linkedChoreId?: string | null;
  linkedZoneName?: string | null;
  verificationRequirement?: VerificationRequirement;
  requiresPhoto?: boolean;
  expiresAt?: Date | null;
}

/**
 * Scan QR code input
 */
export interface ScanQRCodeInput {
  codeData: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  photoBase64?: string;
  devicePlatform?: string;
  deviceModel?: string;
  appVersion?: string;
}

/**
 * Scan result
 */
export interface ScanResult {
  success: boolean;
  message: string;
  qrCode: QRCode | null;
  scan: QRCodeScan | null;

  // Verification details
  gpsVerified: boolean | null;
  gpsDistance: number | null;
  photoRequired: boolean;
  photoUploaded: boolean;

  // Checkpoint progress (if applicable)
  checkpointProgress: CheckpointProgress | null;
  isLastCheckpoint: boolean;

  // Rewards
  pointsAwarded: number;
  choreCompleted: boolean;
}

/**
 * QR code template for common setups
 */
export interface QRCodeTemplate {
  id: string;
  name: string;
  description: string;
  type: QRCodeType;
  verificationRequirement: VerificationRequirement;
  requiresPhoto: boolean;
  suggestedRadiusMeters: number | null;
}

/**
 * Predefined QR code templates
 */
export const QR_CODE_TEMPLATES: QRCodeTemplate[] = [
  {
    id: 'bathroom-cleaning',
    name: 'Bathroom Cleaning Station',
    description: 'Scan when starting bathroom cleaning',
    type: 'task_station',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    suggestedRadiusMeters: 5,
  },
  {
    id: 'kitchen-cleaning',
    name: 'Kitchen Cleaning Station',
    description: 'Scan at kitchen to verify cleaning',
    type: 'task_station',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    suggestedRadiusMeters: 10,
  },
  {
    id: 'trash-can',
    name: 'Trash Can',
    description: 'Scan after taking out trash',
    type: 'location',
    verificationRequirement: 'gps_verified',
    requiresPhoto: false,
    suggestedRadiusMeters: 20,
  },
  {
    id: 'vacuum-closet',
    name: 'Vacuum Storage',
    description: 'Scan when getting/returning vacuum',
    type: 'equipment',
    verificationRequirement: 'scan_only',
    requiresPhoto: false,
    suggestedRadiusMeters: null,
  },
  {
    id: 'laundry-room',
    name: 'Laundry Room',
    description: 'Scan to verify laundry completion',
    type: 'room',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    suggestedRadiusMeters: 5,
  },
  {
    id: 'bedroom-checkpoint-1',
    name: 'Bedroom - Bed Made',
    description: 'First checkpoint: verify bed is made',
    type: 'checkpoint',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    suggestedRadiusMeters: null,
  },
  {
    id: 'bedroom-checkpoint-2',
    name: 'Bedroom - Floor Clear',
    description: 'Second checkpoint: verify floor is clear',
    type: 'checkpoint',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    suggestedRadiusMeters: null,
  },
  {
    id: 'supply-cabinet',
    name: 'Cleaning Supplies Cabinet',
    description: 'Track supply cabinet access',
    type: 'supply_cabinet',
    verificationRequirement: 'scan_only',
    requiresPhoto: false,
    suggestedRadiusMeters: null,
  },
];

/**
 * QR code analytics
 */
export interface QRCodeAnalytics {
  totalQRCodes: number;
  activeQRCodes: number;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  successRate: number;
  totalPointsAwarded: number;
  totalChoresCompleted: number;

  scansByType: {
    type: QRCodeType;
    scans: number;
    successRate: number;
  }[];

  scansByMember: {
    memberId: string;
    memberName: string;
    scans: number;
    points: number;
  }[];

  topQRCodes: {
    id: string;
    name: string;
    scans: number;
  }[];

  recentScans: QRCodeScan[];
}

/**
 * Generate QR code image options
 */
export interface QRCodeImageOptions {
  size: number; // pixels
  format: 'png' | 'svg';
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  foregroundColor: string;
  backgroundColor: string;
  includeMargin: boolean;
  logoUrl?: string;
}

/**
 * Default QR code image options
 */
export const DEFAULT_QR_IMAGE_OPTIONS: QRCodeImageOptions = {
  size: 256,
  format: 'png',
  errorCorrection: 'M',
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  includeMargin: true,
};
