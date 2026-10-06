export interface Claim {
  id: number;
  claimant: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  receipt_available: boolean;
  status: 'PENDING' | 'AI_REVIEWED' | 'REQUIRES_CLARIFICATION' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface ClaimCreatePayload {
  claimant: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  receipt_available: boolean;
}

export interface ValidationResult {
  id: number;
  claim_id: number;
  check_type: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  created_at: string;
}

export interface PolicyEvidence {
  id: number;
  review_id: number;
  policy_section_id?: number;
  evidence_text: string;
  relevance: number;
  section_number?: string;
  section_title?: string;
  policy_name?: string;
  policy_version?: string;
}

export interface Review {
  id: number;
  claim_id: number;
  ai_category?: string;
  confidence: number;
  uncertain: boolean;
  status: 'COMPLIANT' | 'REQUIRES_CLARIFICATION' | 'NEEDS_REVIEW' | 'NON_COMPLIANT' | 'UNCERTAIN';
  explanation: string;
  missing_information: string[];
  created_at: string;
  evidences: PolicyEvidence[];
}

export interface ReviewDecision {
  id: number;
  claim_id: number;
  decision: 'APPROVED' | 'REJECTED' | 'REQUIRES_CLARIFICATION' | 'OVERRIDDEN';
  reason: string;
  reviewer: string;
  override_category?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  claim_id?: number;
  action: string;
  actor: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  timestamp: string;
}

export interface ClaimDetailResponse {
  claim: Claim;
  validations: ValidationResult[];
  review?: Review;
  decisions: ReviewDecision[];
  audit_logs: AuditLog[];
}

export interface PolicySection {
  id: number;
  policy_id: number;
  section_number: string;
  title: string;
  content: string;
  category?: string;
  tags?: string;
}

export interface Policy {
  id: number;
  name: string;
  version: string;
  description?: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
  sections: PolicySection[];
}

export interface DashboardStats {
  total_claims: number;
  pending_reviews: number;
  approved_claims: number;
  rejected_claims: number;
  requires_clarification: number;
  needs_review: number;
  total_amount: number;
  status_counts: Record<string, number>;
  category_breakdown: Array<{
    category: string;
    count: number;
    total_amount: number;
  }>;
}
