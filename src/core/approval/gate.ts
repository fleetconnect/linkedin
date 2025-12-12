/**
 * Human-in-the-Loop Approval System
 * Smart approval gates based on risk levels
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import type { Lead, Message } from '../../types/index.js';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100
  factors: RiskFactor[];
  requires_approval: boolean;
  sample_rate?: number; // For medium risk, review 1 in N
}

export interface RiskFactor {
  factor: string;
  impact: 'increases' | 'decreases';
  points: number;
  explanation: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'message' | 'campaign' | 'sequence';
  risk_level: RiskLevel;
  content: any;
  context: {
    lead?: Lead;
    campaign_id?: string;
    ai_generated?: boolean;
  };
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  created_at: Date;
  reviewed_at?: Date;
  reviewer?: string;
  feedback?: string;
  edited_content?: any;
}

export interface ApprovalGateConfig {
  low_risk_auto_approve: boolean;
  medium_risk_sample_rate: number; // Review 1 in N
  high_risk_requires_approval: boolean;
  critical_always_approve: boolean;

  // ABM / High-value overrides
  abm_accounts: string[]; // Always require approval
  high_value_threshold?: number; // Deal size that requires approval
}

export class ApprovalGate {
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: ApprovalRequest[] = [];
  private sampleCounters: Map<string, number> = new Map();

  constructor(private config: ApprovalGateConfig) {
    logger.info('Approval Gate initialized', { config });
  }

  /**
   * Assess risk level for a lead/message combination
   */
  assessRisk(params: {
    lead: Lead;
    message?: string;
    campaign_id?: string;
    context?: Record<string, any>;
  }): RiskAssessment {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // ABM / High-value account
    if (this.config.abm_accounts.includes(params.lead.company)) {
      factors.push({
        factor: 'ABM Account',
        impact: 'increases',
        points: 40,
        explanation: `${params.lead.company} is a strategic ABM target`,
      });
      riskScore += 40;
    }

    // Company size (larger = higher risk)
    if (params.lead.companySize && params.lead.companySize > 1000) {
      factors.push({
        factor: 'Enterprise Account',
        impact: 'increases',
        points: 20,
        explanation: `Company size ${params.lead.companySize} requires careful messaging`,
      });
      riskScore += 20;
    }

    // Title seniority
    const seniorTitles = ['CEO', 'CTO', 'CMO', 'VP', 'Chief', 'President', 'Director'];
    if (seniorTitles.some(title => params.lead.title.includes(title))) {
      factors.push({
        factor: 'Senior Decision Maker',
        impact: 'increases',
        points: 15,
        explanation: `${params.lead.title} is a senior decision maker`,
      });
      riskScore += 15;
    }

    // First contact
    if (!params.context?.previous_contact) {
      factors.push({
        factor: 'First Contact',
        impact: 'increases',
        points: 10,
        explanation: 'No previous interaction with this lead',
      });
      riskScore += 10;
    }

    // Message quality (if AI-generated)
    if (params.message && params.context?.ai_generated) {
      const hasPersonalization =
        params.message.includes(params.lead.firstName) ||
        params.message.includes(params.lead.company);

      if (!hasPersonalization) {
        factors.push({
          factor: 'Low Personalization',
          impact: 'increases',
          points: 15,
          explanation: 'AI message lacks strong personalization',
        });
        riskScore += 15;
      } else {
        factors.push({
          factor: 'Good Personalization',
          impact: 'decreases',
          points: -10,
          explanation: 'Message includes lead-specific details',
        });
        riskScore -= 10;
      }
    }

    // Email validation
    if (params.lead.email && !params.lead.email.includes('@')) {
      factors.push({
        factor: 'Invalid Email',
        impact: 'increases',
        points: 30,
        explanation: 'Email format appears invalid',
      });
      riskScore += 30;
    }

    // Previous positive interactions
    if (params.context?.previous_positive_replies) {
      factors.push({
        factor: 'Positive History',
        impact: 'decreases',
        points: -20,
        explanation: 'Lead has engaged positively before',
      });
      riskScore -= 20;
    }

    // Determine risk level
    let level: RiskLevel;
    if (riskScore >= 60) level = RiskLevel.CRITICAL;
    else if (riskScore >= 40) level = RiskLevel.HIGH;
    else if (riskScore >= 20) level = RiskLevel.MEDIUM;
    else level = RiskLevel.LOW;

    // Determine if approval is required
    let requires_approval = false;
    let sample_rate: number | undefined;

    switch (level) {
      case RiskLevel.CRITICAL:
        requires_approval = this.config.critical_always_approve;
        break;
      case RiskLevel.HIGH:
        requires_approval = this.config.high_risk_requires_approval;
        break;
      case RiskLevel.MEDIUM:
        sample_rate = this.config.medium_risk_sample_rate;
        requires_approval = this.shouldSample(params.campaign_id || 'default', sample_rate);
        break;
      case RiskLevel.LOW:
        requires_approval = !this.config.low_risk_auto_approve;
        break;
    }

    return {
      level,
      score: Math.max(0, Math.min(100, riskScore)),
      factors,
      requires_approval,
      sample_rate,
    };
  }

  /**
   * Request approval for an action
   */
  async requestApproval(params: {
    type: 'message' | 'campaign' | 'sequence';
    content: any;
    risk_assessment: RiskAssessment;
    context: any;
  }): Promise<ApprovalRequest> {
    const request: ApprovalRequest = {
      id: uuidv4(),
      type: params.type,
      risk_level: params.risk_assessment.level,
      content: params.content,
      context: params.context,
      status: 'pending',
      created_at: new Date(),
    };

    this.pendingApprovals.set(request.id, request);

    logger.info('Approval requested', {
      request_id: request.id,
      type: params.type,
      risk_level: params.risk_assessment.level,
      lead_id: params.context.lead?.id,
    });

    return request;
  }

  /**
   * Approve a request
   */
  approve(requestId: string, reviewer: string, feedback?: string): ApprovalRequest {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    request.status = 'approved';
    request.reviewed_at = new Date();
    request.reviewer = reviewer;
    request.feedback = feedback;

    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(request);

    logger.info('Approval granted', {
      request_id: requestId,
      reviewer,
    });

    return request;
  }

  /**
   * Reject a request
   */
  reject(requestId: string, reviewer: string, reason: string): ApprovalRequest {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    request.status = 'rejected';
    request.reviewed_at = new Date();
    request.reviewer = reviewer;
    request.feedback = reason;

    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(request);

    logger.info('Approval rejected', {
      request_id: requestId,
      reviewer,
      reason,
    });

    return request;
  }

  /**
   * Edit and approve
   */
  editAndApprove(
    requestId: string,
    reviewer: string,
    editedContent: any,
    feedback?: string
  ): ApprovalRequest {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    request.status = 'edited';
    request.reviewed_at = new Date();
    request.reviewer = reviewer;
    request.edited_content = editedContent;
    request.feedback = feedback;

    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(request);

    logger.info('Content edited and approved', {
      request_id: requestId,
      reviewer,
    });

    // This is valuable training data!
    this.captureEditDiff(request);

    return request;
  }

  /**
   * Capture the diff when humans edit AI copy
   * This is free training data!
   */
  private captureEditDiff(request: ApprovalRequest): void {
    if (request.status !== 'edited' || !request.edited_content) {
      return;
    }

    const diff = {
      original: request.content,
      edited: request.edited_content,
      request_id: request.id,
      reviewer: request.reviewer,
      feedback: request.feedback,
      timestamp: new Date(),
    };

    logger.info('Human edit captured for training', {
      request_id: request.id,
      has_feedback: !!request.feedback,
    });

    // Store for later use in training
    // This could be fed back into the personalization engine
  }

  /**
   * Sampling logic for medium-risk items
   */
  private shouldSample(campaign_id: string, sampleRate: number): boolean {
    if (sampleRate <= 0) return false;
    if (sampleRate === 1) return true;

    const counter = this.sampleCounters.get(campaign_id) || 0;
    this.sampleCounters.set(campaign_id, counter + 1);

    return counter % sampleRate === 0;
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(filters?: {
    risk_level?: RiskLevel;
    type?: string;
  }): ApprovalRequest[] {
    let requests = Array.from(this.pendingApprovals.values());

    if (filters?.risk_level) {
      requests = requests.filter(r => r.risk_level === filters.risk_level);
    }

    if (filters?.type) {
      requests = requests.filter(r => r.type === filters.type);
    }

    return requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Get approval statistics
   */
  getStatistics(): {
    total_requests: number;
    approved: number;
    rejected: number;
    edited: number;
    pending: number;
    avg_review_time_minutes: number;
    edit_rate: number;
  } {
    const total = this.approvalHistory.length;
    const approved = this.approvalHistory.filter(r => r.status === 'approved').length;
    const rejected = this.approvalHistory.filter(r => r.status === 'rejected').length;
    const edited = this.approvalHistory.filter(r => r.status === 'edited').length;
    const pending = this.pendingApprovals.size;

    const reviewTimes = this.approvalHistory
      .filter(r => r.reviewed_at)
      .map(r => (r.reviewed_at!.getTime() - r.created_at.getTime()) / 60000);

    const avgReviewTime = reviewTimes.length > 0
      ? reviewTimes.reduce((sum, t) => sum + t, 0) / reviewTimes.length
      : 0;

    return {
      total_requests: total,
      approved,
      rejected,
      edited,
      pending,
      avg_review_time_minutes: avgReviewTime,
      edit_rate: total > 0 ? edited / total : 0,
    };
  }
}
