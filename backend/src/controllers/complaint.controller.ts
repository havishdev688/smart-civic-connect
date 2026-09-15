import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException, UnauthorizedException, Optional } from '@nestjs/common';
import { AIService } from '../services/ai.service';
import { DbService } from '../services/db.service';
import { CloudinaryService } from '../services/cloudinary.service';
import { Priority, Status } from '../types';

function getHaversineDistanceMeters(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return Infinity;
  }
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Infinity;
  }
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const CIVIC_STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near', 'of', 'to',
  'for', 'with', 'by', 'area', 'please', 'fix', 'help', 'issue',
  'problem', 'complaint', 'there', 'this', 'that', 'from', 'been', 'have', 'has',
  'very', 'much', 'kindly', 'sir', 'madam', 'colony', 'nagar', 'cross', 'lane',
  'location', 'site', 'needed', 'urgent', 'urgently', 'request', 'municipal'
]);

const CIVIC_DEFECT_CLUSTERS: Record<string, string[]> = {
  roads: [
    'pothole', 'potholes', 'crater', 'craters', 'asphalt', 'tar', 'footpath',
    'pavement', 'roadkill', 'road', 'roads', 'damage', 'damaged', 'crack', 'cracks',
    'depression', 'sinkhole', 'repair', 'broken'
  ],
  water: [
    'leak', 'leakage', 'burst', 'pipeline', 'pipe', 'pipes', 'water', 'tanker',
    'contamination', 'drinking', 'pressure', 'flooding', 'supply'
  ],
  sanitation: [
    'garbage', 'trash', 'waste', 'dump', 'dustbin', 'sweeping', 'litter', 'drainage',
    'manhole', 'sewage', 'clogged', 'overflow', 'smell', 'stench', 'stinking', 'drain',
    'drains', 'debris', 'filth'
  ],
  lighting: [
    'light', 'streetlight', 'lamp', 'bulb', 'pole', 'dark', 'darkness', 'wiring',
    'electricity', 'blackout', 'flickering', 'wire', 'wires'
  ]
};

function normalizeDeptCode(deptCode?: string, category?: string): string {
  const combined = `${deptCode || ''} ${category || ''}`.toUpperCase();
  if (combined.includes('ROAD') || combined.includes('ASPHALT') || combined.includes('POTHOLE')) return 'ROADS_ASPHALT';
  if (combined.includes('WATER') || combined.includes('PIPE') || combined.includes('LEAK')) return 'WATER_SUPPLY';
  if (combined.includes('SANITATION') || combined.includes('GARBAGE') || combined.includes('HEALTH') || combined.includes('TRASH') || combined.includes('DRAIN')) return 'SANITATION_HEALTH';
  if (combined.includes('LIGHT') || combined.includes('STREET_LIGHT') || combined.includes('ELECTRIC') || combined.includes('DARK')) return 'STREET_LIGHTING';
  return (deptCode || category || '').toUpperCase().trim();
}

function getGpsProximityScore(distanceMeters: number): number {
  if (distanceMeters > 100 || isNaN(distanceMeters) || distanceMeters < 0) {
    return 0;
  }
  // Quadratic decay: (1 - d/100)^2 * 100
  const ratio = 1 - (distanceMeters / 100);
  return Math.round(ratio * ratio * 100);
}

function calculateTokenSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  const a = textA.toLowerCase().trim();
  const b = textB.toLowerCase().trim();
  if (a === b) return 1.0;

  const wordsA = new Set(a.split(/[\s,.-]+/).filter(w => w.length > 2 && !CIVIC_STOP_WORDS.has(w)));
  const wordsB = new Set(b.split(/[\s,.-]+/).filter(w => w.length > 2 && !CIVIC_STOP_WORDS.has(w)));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let common = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) common++;
  }
  const total = new Set([...wordsA, ...wordsB]).size;
  return total > 0 ? common / total : 0;
}

function getCivicClusterScore(textA: string, textB: string): { clusterScore: number; exactDefectMatches: number } {
  const a = textA.toLowerCase();
  const b = textB.toLowerCase();

  let maxClusterScore = 0;
  let exactDefectMatches = 0;

  for (const clusterKeywords of Object.values(CIVIC_DEFECT_CLUSTERS)) {
    const inA = clusterKeywords.filter(k => a.includes(k));
    const inB = clusterKeywords.filter(k => b.includes(k));

    if (inA.length > 0 && inB.length > 0) {
      const shared = inA.filter(k => inB.includes(k));
      if (shared.length > exactDefectMatches) {
        exactDefectMatches = shared.length;
      }

      let score = 65; // Base cluster thematic alignment
      if (shared.length >= 2) {
        score = 100;
      } else if (shared.length === 1) {
        score = 85;
      } else if (inA.length >= 2 && inB.length >= 2) {
        score = 75;
      }

      if (score > maxClusterScore) {
        maxClusterScore = score;
      }
    }
  }

  return { clusterScore: maxClusterScore, exactDefectMatches };
}

function getDescriptionScore(descA: string, descB: string): number {
  if (!descA || !descB) return 0;
  const a = descA.toLowerCase().trim();
  const b = descB.toLowerCase().trim();
  if (a === b) return 100;

  const tokenSim = calculateTokenSimilarity(descA, descB);
  const { clusterScore, exactDefectMatches } = getCivicClusterScore(descA, descB);

  if (exactDefectMatches >= 1 || clusterScore > 0) {
    const combined = (tokenSim * 20) + (clusterScore * 0.8);
    return Math.min(100, Math.max(Math.round(tokenSim * 100), Math.round(combined)));
  }
  return Math.round(tokenSim * 100);
}

function getTitleScore(titleA: string, titleB: string): number {
  if (!titleA || !titleB) return 0;
  const a = titleA.toLowerCase().trim();
  const b = titleB.toLowerCase().trim();
  if (a === b) return 100;
  if ((a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= 4) return 85;

  const tokenSim = calculateTokenSimilarity(titleA, titleB);
  const { clusterScore, exactDefectMatches } = getCivicClusterScore(titleA, titleB);

  if (exactDefectMatches >= 1 || clusterScore > 0) {
    const combined = (tokenSim * 20) + (clusterScore * 0.8);
    return Math.min(100, Math.max(Math.round(tokenSim * 100), Math.round(combined)));
  }
  return Math.round(tokenSim * 100);
}

function getDepartmentCompatibilityScore(
  deptCodeA?: string,
  categoryA?: string,
  deptCodeB?: string,
  categoryB?: string
): number {
  const normA = normalizeDeptCode(deptCodeA, categoryA);
  const normB = normalizeDeptCode(deptCodeB, categoryB);

  if (!normA || !normB) return 50; // Neutral if one is undetermined
  if (normA === normB) return 100; // Same municipal department

  // Check if they are known distinct departments (incompatible)
  const knownDepartments = ['ROADS_ASPHALT', 'WATER_SUPPLY', 'SANITATION_HEALTH', 'STREET_LIGHTING'];
  if (knownDepartments.includes(normA) && knownDepartments.includes(normB) && normA !== normB) {
    return 0; // Cross-department incompatibility (Hard Gate 2)
  }

  return 50;
}

function getTimeStatusFactor(status: string, createdAt: Date, updatedAt: Date): number {
  const s = (status || '').toUpperCase();
  if (s === 'CLOSED') {
    return 0.0;
  }

  if (s === 'RESOLVED') {
    const hoursSinceResolution = (Date.now() - new Date(updatedAt || createdAt).getTime()) / (1000 * 60 * 60);
    // Recently resolved within 48 hours gets 0.4 multiplier; older resolved are ignored
    return hoursSinceResolution <= 48 ? 0.4 : 0.0;
  }

  // Active statuses (NEW, ASSIGNED, IN_PROGRESS, REOPENED, etc.)
  const daysSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation <= 7) {
    return 1.0;
  }
  // Gentle time decay for complaints older than 7 days, clamped at min 0.75
  return Math.max(0.75, 1.0 - (daysSinceCreation - 7) * 0.01);
}

export interface DuplicateEvaluation {
  finalScore: number;
  matchLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  gpsScore: number;
  descScore: number;
  titleScore: number;
  deptScore: number;
  timeFactor: number;
  distanceMeters: number;
}

export function evaluateDuplicateScore(
  input: {
    title: string;
    description?: string;
    category?: string;
    departmentCode?: string;
    latitude?: number;
    longitude?: number;
  },
  existing: {
    id: string;
    title: string;
    description: string;
    category?: string;
    status: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
    updatedAt: Date;
    department?: { code?: string; name?: string } | null;
  }
): DuplicateEvaluation {
  const distanceMeters = getHaversineDistanceMeters(input.latitude, input.longitude, existing.latitude, existing.longitude);

  // Hard Gate 1: Distance > 100m -> 0 score
  if (distanceMeters > 100) {
    return {
      finalScore: 0,
      matchLevel: 'LOW',
      gpsScore: 0,
      descScore: 0,
      titleScore: 0,
      deptScore: 0,
      timeFactor: 0,
      distanceMeters,
    };
  }

  // Department Compatibility & Hard Gate 2: Incompatible department -> 0 score
  const deptScore = getDepartmentCompatibilityScore(
    input.departmentCode,
    input.category,
    existing.department?.code,
    existing.category
  );

  if (deptScore === 0) {
    return {
      finalScore: 0,
      matchLevel: 'LOW',
      gpsScore: getGpsProximityScore(distanceMeters),
      descScore: 0,
      titleScore: 0,
      deptScore: 0,
      timeFactor: 0,
      distanceMeters,
    };
  }

  // Time & Status Factor
  const timeFactor = getTimeStatusFactor(existing.status, existing.createdAt, existing.updatedAt);
  if (timeFactor === 0) {
    return {
      finalScore: 0,
      matchLevel: 'LOW',
      gpsScore: getGpsProximityScore(distanceMeters),
      descScore: 0,
      titleScore: 0,
      deptScore,
      timeFactor: 0,
      distanceMeters,
    };
  }

  const gpsScore = getGpsProximityScore(distanceMeters);
  const titleScore = getTitleScore(input.title, existing.title);
  const descScore = getDescriptionScore(input.description || input.title, existing.description);

  // Multi-Signal Formula: 35% GPS, 25% Desc, 15% Title, 15% Dept (normalized over 0.90)
  const weightedSum = (0.35 * gpsScore) + (0.25 * descScore) + (0.15 * titleScore) + (0.15 * deptScore);
  const rawNormalized = weightedSum / 0.90;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawNormalized * timeFactor)));

  const matchLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
    finalScore >= 75 ? 'HIGH' : (finalScore >= 45 ? 'MEDIUM' : 'LOW');

  return {
    finalScore,
    matchLevel,
    gpsScore,
    descScore,
    titleScore,
    deptScore,
    timeFactor,
    distanceMeters,
  };
}

@Controller('api/complaints')
export class ComplaintController {
  constructor(
    private readonly aiService: AIService,
    private readonly db: DbService,
    @Optional() private readonly cloudinaryService?: CloudinaryService
  ) {}

  @Post('analyze-preview')
  async previewAIAnalysis(@Body() body: { title: string; description: string; hasImages?: boolean; image?: string }) {
    return this.aiService.analyzeComplaint(body.title, body.description, body.hasImages || false, body.image);
  }

  @Post('generate-description')
  async generateDescription(@Body() body: { image: string }) {
    if (!body.image) {
      throw new BadRequestException('Please upload an image first.');
    }
    const description = await this.aiService.generateDescriptionFromImage(body.image);
    return { description };
  }

  @Post('check-duplicate')
  async checkDuplicate(@Body() body: {
    title: string;
    description?: string;
    category?: string;
    departmentCode?: string;
    latitude?: number;
    longitude?: number;
  }) {
    if (!body.title) {
      return { isDuplicate: false };
    }

    const lat = typeof body.latitude === 'number' ? body.latitude : undefined;
    const lng = typeof body.longitude === 'number' ? body.longitude : undefined;

    if (lat === undefined || lng === undefined) {
      return { isDuplicate: false };
    }

    // Check database for active and recently resolved complaints (exclude CLOSED)
    const existingComplaints = await this.db.complaint.findMany({
      where: {
        status: { notIn: ['CLOSED'] }
      },
      include: { department: true }
    });

    const candidates: Array<{
      complaint: any;
      evaluation: DuplicateEvaluation;
    }> = [];

    for (const c of existingComplaints) {
      const evaluation = evaluateDuplicateScore(
        {
          title: body.title,
          description: body.description,
          category: body.category,
          departmentCode: body.departmentCode,
          latitude: lat,
          longitude: lng,
        },
        {
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          status: c.status,
          latitude: c.latitude,
          longitude: c.longitude,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          department: c.department,
        }
      );

      if (evaluation.finalScore >= 45) {
        candidates.push({
          complaint: c,
          evaluation,
        });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.evaluation.finalScore - a.evaluation.finalScore || a.evaluation.distanceMeters - b.evaluation.distanceMeters);
      const best = candidates[0];

      return {
        isDuplicate: true,
        matchLevel: best.evaluation.matchLevel,
        duplicateScore: best.evaluation.finalScore,
        distanceMeters: best.evaluation.distanceMeters,
        signals: {
          gps: best.evaluation.gpsScore,
          description: best.evaluation.descScore,
          title: best.evaluation.titleScore,
          department: best.evaluation.deptScore,
          timeFactor: best.evaluation.timeFactor,
        },
        existingComplaint: {
          id: best.complaint.id,
          complaintNo: best.complaint.complaintNo,
          title: best.complaint.title,
          description: best.complaint.description,
          status: best.complaint.status,
          category: best.complaint.category,
          departmentName: best.complaint.department?.name || best.complaint.category,
          address: best.complaint.address,
          distanceMeters: best.evaluation.distanceMeters,
          duplicateScore: best.evaluation.finalScore,
          matchLevel: best.evaluation.matchLevel,
          createdAt: best.complaint.createdAt.toISOString(),
        }
      };
    }

    return { isDuplicate: false };
  }

  @Post()
  async createComplaint(@Body() body: any) {
    if (!body.citizenId) {
      throw new UnauthorizedException('Please log in as a citizen to submit a complaint.');
    }

    // Verify citizen exists in database
    const citizen = await this.db.user.findFirst({
      where: { id: body.citizenId, role: 'CITIZEN' }
    });

    if (!citizen) {
      throw new UnauthorizedException('Please log in as a citizen to submit a complaint.');
    }

    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required.');
    }

    // 1. AI Analysis
    const aiResult = await this.aiService.analyzeComplaint(
      body.title,
      body.description,
      body.images && body.images.length > 0,
      body.images?.[0]
    );

    // Determine Department: Priority given to citizen's selected department, then AI recommendation
    let department = null;
    const requestedDeptCode = body.departmentCode || body.department;

    if (requestedDeptCode) {
      department = await this.db.department.findFirst({
        where: {
          OR: [
            { code: requestedDeptCode },
            { name: requestedDeptCode }
          ]
        }
      });
    }

    if (!department && aiResult.departmentCode && aiResult.departmentCode !== 'UNCLASSIFIED') {
      department = await this.db.department.findUnique({
        where: { code: aiResult.departmentCode }
      });
    }

    if (!department) {
      department = await this.db.department.findFirst({
        where: { code: 'ROADS_ASPHALT' }
      });
    }

    if (!department) {
      throw new BadRequestException('Municipal department could not be assigned.');
    }

    // 2. Multi-Signal Duplicate Detection & Auto-Linking (Threshold >= 75%)
    let duplicateOfId = body.duplicateOfId || null;
    if (!duplicateOfId && typeof body.latitude === 'number' && typeof body.longitude === 'number') {
      const existingComplaints = await this.db.complaint.findMany({
        where: { status: { notIn: ['CLOSED'] } },
        include: { department: true }
      });

      let highestScore = 0;
      let matchedComplaintId: string | null = null;

      for (const c of existingComplaints) {
        const evaluation = evaluateDuplicateScore(
          {
            title: body.title,
            description: body.description,
            category: department.name,
            departmentCode: department.code,
            latitude: body.latitude,
            longitude: body.longitude,
          },
          {
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            status: c.status,
            latitude: c.latitude,
            longitude: c.longitude,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            department: c.department,
          }
        );

        if (evaluation.finalScore >= 75 && evaluation.finalScore > highestScore) {
          highestScore = evaluation.finalScore;
          matchedComplaintId = c.id;
        }
      }

      if (matchedComplaintId) {
        duplicateOfId = matchedComplaintId;
      }
    }

    // Process and upload images to persistent Cloudinary storage if base64
    const processedImageUrls: string[] = [];
    if (body.images && Array.isArray(body.images)) {
      for (const rawImg of body.images) {
        if (!rawImg || typeof rawImg !== 'string') continue;
        if (rawImg.startsWith('data:image') && this.cloudinaryService?.isConfigured()) {
          try {
            const uploaded = await this.cloudinaryService.uploadImage(rawImg, { type: 'BEFORE' });
            processedImageUrls.push(uploaded.url);
          } catch (uploadErr) {
            console.warn('Cloudinary upload in createComplaint failed, keeping raw URL:', uploadErr);
            processedImageUrls.push(rawImg);
          }
        } else {
          processedImageUrls.push(rawImg);
        }
      }
    }

    const complaintNo = 'COMP-AP-2026-' + Math.floor(1000 + Math.random() * 9000);

    const departmentName = department.name;

    const newComplaint = await this.db.complaint.create({
      data: {
        complaintNo,
        title: body.title,
        description: body.description,
        category: departmentName,
        latitude: typeof body.latitude === 'number' ? body.latitude : 0,
        longitude: typeof body.longitude === 'number' ? body.longitude : 0,
        address: body.address || 'Municipal Area',
        landmark: body.landmark,
        status: Status.ASSIGNED,
        priority: body.priority || (aiResult.priority as any),
        estimatedHours: department.slaHours || aiResult.estimatedHours,
        citizenId: citizen.id,
        departmentId: department.id,
        duplicateOfId,
        images: {
          create: (processedImageUrls || []).map((url: string) => ({ url, type: 'BEFORE' }))
        },
        aiPredictions: {
          create: {
            predictedDepartment: departmentName,
            confidenceScore: aiResult.confidenceScore || 0.8,
            priorityAssigned: (aiResult.priority as any) || Priority.MEDIUM,
            estimatedHours: aiResult.estimatedHours || department.slaHours,
            duplicateMatchRatio: duplicateOfId ? 0.95 : aiResult.duplicateMatchRatio,
            rawAnalysis: aiResult.summary,
          }
        },
        statusHistory: {
          create: [
            {
              newStatus: Status.NEW,
              remarks: 'Complaint registered by citizen',
            },
            {
              newStatus: Status.AI_PROCESSING,
              remarks: `AI Engine mapped complaint to ${departmentName} with ${Math.round((aiResult.confidenceScore || 0.8) * 100)}% confidence`,
            },
            {
              newStatus: Status.ASSIGNED,
              remarks: `Assigned to Department Officer (SLA Target: ${aiResult.estimatedHours || department.slaHours} Hours)`,
            }
          ]
        }
      },
      include: {
        department: true,
        citizen: true,
        images: true,
        aiPredictions: true,
      }
    });

    // Create Real Notification in PostgreSQL for Citizen
    await this.db.notification.create({
      data: {
        userId: citizen.id,
        title: 'Grievance Lodged Successfully',
        message: `Your grievance ${complaintNo} has been registered and auto-assigned to ${department.name} (SLA: ${aiResult.estimatedHours || department.slaHours}h).`,
        type: 'SUBMITTED',
      }
    });

    return {
      message: 'Complaint submitted successfully',
      complaint: newComplaint,
      isDuplicate: !!duplicateOfId
    };
  }

  @Get()
  async getComplaints(@Query('role') role?: string, @Query('departmentId') departmentId?: string, @Query('citizenId') citizenId?: string) {
    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (citizenId) {
      where.citizenId = citizenId;
    }

    const complaints = await this.db.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        citizen: true,
        images: true,
        aiPredictions: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      }
    });

    const formatted = complaints.map((c) => {
      const beforeImages = c.images.filter((img) => img.type !== 'RESOLUTION').map((img) => img.url);
      const resolutionImages = c.images.filter((img) => img.type === 'RESOLUTION').map((img) => img.url);
      const latestAi = c.aiPredictions?.[0];

      return {
        ...c,
        departmentName: c.department?.name || c.category,
        departmentCode: c.department?.code,
        citizenName: c.citizen?.name || 'Citizen',
        citizenPhone: c.citizen?.phone,
        images: beforeImages,
        resolutionImages,
        aiPrediction: latestAi
          ? {
              confidenceScore: latestAi.confidenceScore,
              duplicateMatchRatio: latestAi.duplicateMatchRatio,
              summary: latestAi.rawAnalysis,
            }
          : undefined,
        statusHistory: c.statusHistory?.map((sh) => ({
          id: sh.id,
          status: sh.newStatus,
          remarks: sh.remarks,
          timestamp: sh.createdAt.toISOString(),
        })),
      };
    });

    return {
      total: formatted.length,
      complaints: formatted,
    };
  }

  @Get(':id')
  async getComplaintById(@Param('id') id: string) {
    const complaint = await this.db.complaint.findFirst({
      where: {
        OR: [
          { id },
          { complaintNo: id }
        ]
      },
      include: {
        department: true,
        citizen: true,
        images: true,
        aiPredictions: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        officer: true,
      }
    });

    if (!complaint) {
      throw new BadRequestException('Complaint not found');
    }

    const beforeImages = complaint.images.filter((img) => img.type !== 'RESOLUTION').map((img) => img.url);
    const resolutionImages = complaint.images.filter((img) => img.type === 'RESOLUTION').map((img) => img.url);
    const latestAi = complaint.aiPredictions?.[0];

    return {
      ...complaint,
      departmentName: complaint.department?.name || complaint.category,
      departmentCode: complaint.department?.code,
      citizenName: complaint.citizen?.name || 'Citizen',
      citizenPhone: complaint.citizen?.phone,
      images: beforeImages,
      resolutionImages,
      aiPrediction: latestAi
        ? {
            confidenceScore: latestAi.confidenceScore,
            duplicateMatchRatio: latestAi.duplicateMatchRatio,
            summary: latestAi.rawAnalysis,
          }
        : undefined,
      statusHistory: complaint.statusHistory.map((sh) => ({
        id: sh.id,
        status: sh.newStatus,
        remarks: sh.remarks,
        timestamp: sh.createdAt.toISOString(),
      })),
    };
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: Status; remarks?: string; resolutionImage?: string }) {
    const complaint = await this.db.complaint.findUnique({
      where: { id },
      include: { images: true }
    });
    if (!complaint) throw new BadRequestException('Complaint not found');

    let finalResolutionImage = body.resolutionImage;
    if (finalResolutionImage && finalResolutionImage.startsWith('data:image') && this.cloudinaryService?.isConfigured()) {
      try {
        const uploaded = await this.cloudinaryService.uploadImage(finalResolutionImage, { type: 'RESOLUTION' });
        finalResolutionImage = uploaded.url;
      } catch (uploadErr) {
        console.warn('Cloudinary upload in updateStatus failed, keeping raw resolutionImage:', uploadErr);
      }
    }

    // Prevent duplicate backend status updates / duplicate notifications on rapid double clicks or retry
    if (complaint.status === body.status) {
      if (finalResolutionImage && !complaint.images.some(img => img.url === finalResolutionImage)) {
        await this.db.complaintImage.create({
          data: {
            complaintId: id,
            url: finalResolutionImage,
            type: 'RESOLUTION'
          }
        });
      }

      return {
        message: `Complaint is already ${body.status}`,
        complaintId: id,
        newStatus: complaint.status,
        alreadyUpdated: true
      };
    }

    const updated = await this.db.complaint.update({
      where: { id },
      data: {
        status: body.status,
        statusHistory: {
          create: {
            previousStatus: complaint.status,
            newStatus: body.status,
            remarks: body.remarks || `Status updated to ${body.status}`,
          }
        },
        ...(finalResolutionImage && {
          images: {
            create: {
              url: finalResolutionImage,
              type: 'RESOLUTION'
            }
          }
        })
      }
    });

    // Create Real Notification in PostgreSQL for Citizen
    await this.db.notification.create({
      data: {
        userId: complaint.citizenId,
        title: `Status Update: ${body.status}`,
        message: `Grievance ${complaint.complaintNo} is now ${body.status}. ${body.remarks || ''}`.trim(),
        type: body.status === Status.RESOLVED ? 'RESOLVED' : 'STATUS_CHANGE',
      }
    });

    return {
      message: 'Complaint status updated successfully',
      complaintId: id,
      newStatus: updated.status,
    };
  }

  @Put(':id/reassign')
  async reassignDepartment(@Param('id') id: string, @Body() body: { departmentCode?: string; departmentId?: string }) {
    let department;
    if (body.departmentId) {
      department = await this.db.department.findUnique({ where: { id: body.departmentId } });
    } else if (body.departmentCode) {
      department = await this.db.department.findUnique({ where: { code: body.departmentCode } });
    }
    if (!department) throw new BadRequestException('Department not found');

    const complaint = await this.db.complaint.findUnique({ where: { id } });
    if (!complaint) throw new BadRequestException('Complaint not found');

    const updated = await this.db.complaint.update({
      where: { id },
      data: {
        departmentId: department.id,
        category: department.name,
        statusHistory: {
          create: {
            previousStatus: complaint.status,
            newStatus: complaint.status,
            remarks: `Reassigned by Administrator to ${department.name}`,
          }
        }
      },
      include: { department: true }
    });

    // Create Real Notification in PostgreSQL for Citizen
    await this.db.notification.create({
      data: {
        userId: complaint.citizenId,
        title: 'Department Reassigned',
        message: `Grievance ${complaint.complaintNo} was reassigned to ${department.name}.`,
        type: 'REASSIGNED',
      }
    });

    return { message: 'Complaint reassigned successfully', complaint: updated };
  }

  @Post(':id/feedback')
  async submitFeedback(@Param('id') id: string, @Body() body: { rating: number; feedbackText: string }) {
    await this.db.complaint.update({
      where: { id },
      data: {
        rating: body.rating,
        feedbackText: body.feedbackText,
      }
    });

    return {
      message: 'Feedback and citizen rating recorded successfully',
      complaintId: id,
      rating: body.rating,
    };
  }
}
