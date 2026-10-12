export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'member' | 'admin';
  sponsorId: string;
  createdAt?: string;
}

export interface Question {
  questionNumber: number;
  textUrdu: string;
  textEnglish: string;
}

export interface AnswerResult {
  id?: string;
  questionNumber: number;
  questionTextEn: string;
  questionTextUr: string;
  answerText: string;
  score: number;
  isPassed: boolean;
  explanation: string;
  feedback: string;
  evaluatedAt?: string;
}

export interface InterviewAttempt {
  id: string;
  totalScore: number;
  passedQuestions: number;
  isPassed: boolean;
  submissionTime: string;
  evaluationStatus: 'pending' | 'completed' | 'failed';
  notificationStatus: string;
  answers: AnswerResult[];
}

export interface AdminStats {
  totalRegisteredMembers: number;
  membersAttempted: number;
  membersNotAttempted: number;
  membersPassed: number;
  membersFailed: number;
  pendingEvaluations: number;
}

export interface AdminMemberRow {
  id: string;
  fullName: string;
  email: string;
  sponsorId: string;
  registeredAt: string;
  hasAttempted: boolean;
  attemptId: string | null;
  passedQuestions: number | null;
  totalScore: number | null;
  isPassed: boolean | null;
  submissionTime: string | null;
  evaluationStatus: string;
}

export interface QuestionRubric {
  id: number;
  question_number: number;
  text_urdu: string;
  text_english: string;
  default_rubric: string;
  admin_approved_rubric: string;
  requires_custom_review: boolean;
  is_approved: boolean;
  updated_at: string;
}

export interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}
