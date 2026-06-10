// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination: Pagination | null;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors: string[];
  stack?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

// ============================================================
// Auth Types
// ============================================================

export interface Permission {
  id: string;
  code: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface GoogleAuth {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleCalendar {
  connected: boolean;
  googleId?: string;
  email?: string;
  tokenExpiryDate?: string;
  scope?: string[];
}

export interface User {
  id: string;
  email: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  fullName: string;
  status: UserStatus;
  mustChangePassword: boolean;
  roles: Role[];
  permissions: string[];
  googleAuth?: GoogleAuth;
  googleCalendar?: GoogleCalendar;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  studentType?: 'FPT' | 'EXTERNAL' | null;
  studentId?: string | null;
  schoolName?: string | null;
  emailNotification?: UserEmailNotification;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface EmailDeliveryResult {
  sent: boolean;
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  skipped?: boolean;
  accepted?: string[];
  rejected?: string[];
  invalid?: string[];
  reason?: string;
}

export type UserEmailNotification = EmailDeliveryResult;

export type UserRoleName =
  | 'ADMIN'
  | 'EVENT_COORDINATOR'
  | 'COORDINATOR'
  | 'JUDGE'
  | 'MENTOR'
  | 'SPEAKER'
  | 'USER'
  | 'PARTICIPANT';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthData {
  user: User;
  tokens: TokenPair;
}

// Auth request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  studentType: 'FPT' | 'EXTERNAL';
  studentId: string;
  schoolName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================================
// Event Types
// ============================================================

export type EventStatus =
  | 'DRAFT'
  | 'OPEN_REGISTRATION'
  | 'ONGOING'
  | 'SCORING'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface EventCreator {
  id: string;
  fullName?: string;
  email?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  semester?: string | null;
  seriesName?: string | null;
  season?: string | null;
  year?: number | null;
  theme?: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  finalistSlotsPerTrack?: number;
  totalFinalistSlots?: number;
  status: EventStatus;
  createdBy?: EventCreator | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  semester?: string;
  seriesName?: string;
  season?: 'SPRING' | 'SUMMER' | 'FALL';
  year?: number;
  theme?: string;
  registrationStart?: string;
  registrationEnd?: string;
  startDate?: string;
  endDate?: string;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  finalistSlotsPerTrack?: number;
  totalFinalistSlots?: number;
  status?: EventStatus;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export interface UpdateEventStatusRequest {
  status: EventStatus;
}

export interface ListEventsQuery {
  page?: number;
  limit?: number;
  status?: EventStatus;
  semester?: string;
  season?: string;
  year?: number;
  search?: string;
}

export interface SendEventInvitationsRequest {
  emails: string[];
  message?: string;
}

export interface SendEventInvitationsResult {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  results: Array<EmailDeliveryResult & { email: string }>;
}

// ============================================================
// Media Types
// ============================================================

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type MediaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MediaUserSummary {
  id: string;
  email?: string;
  fullName?: string;
}

export interface MediaEventSummary {
  id: string;
  title?: string;
  status?: EventStatus;
}

export interface MediaTeamSummary {
  id: string;
  name?: string;
  status?: TeamStatus;
}

export interface MediaItem {
  id: string;
  eventId: string;
  event?: MediaEventSummary | null;
  uploadedBy?: MediaUserSummary | null;
  uploadedById?: string;
  teamId?: string | null;
  team?: MediaTeamSummary | null;
  title?: string | null;
  description?: string | null;
  mediaType: MediaType;
  storageProvider?: string;
  bucketName?: string;
  storagePath?: string;
  fileUrl?: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileExtension: string;
  tags: string[];
  status: MediaStatus;
  reviewedBy?: MediaUserSummary | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaHistoryFilter {
  eventId?: string;
  mediaType?: MediaType;
  status?: MediaStatus;
  fromDate?: string;
  toDate?: string;
  week?: number;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface AdminMediaFilter extends MediaHistoryFilter {
  uploadedBy?: string;
  teamId?: string;
}

export interface EventGalleryFilter {
  mediaType?: MediaType;
  search?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

export interface EventGalleryResponse {
  images: MediaItem[];
  videos: MediaItem[];
  documents: MediaItem[];
  statistics: {
    totalUploads: number;
    totalImages: number;
    totalVideos: number;
    totalDocuments: number;
  };
}

export interface SignedUrlResponse {
  signedUrl: string;
  expiresIn: number;
}

export interface MediaStatisticsFilter {
  eventId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface MediaStatistics {
  totalUploads: number;
  pending: number;
  approved: number;
  rejected: number;
  uploadsByEvent: Array<{ eventId: string; count: number }>;
  uploadsByTeam: Array<{ teamId: string; count: number }>;
  uploadsByParticipant: Array<{ participantId: string; count: number }>;
  uploadsByDay: Array<{ day: string; count: number }>;
  uploadsByWeek: Array<{ week: string; count: number }>;
  uploadsByMonth: Array<{ month: string; count: number }>;
  uploadsByMediaType: Array<{ mediaType: MediaType; count: number }>;
  mostActiveParticipants: Array<{ participantId: string; uploads: number }>;
  mostViewedMedia: Array<{ mediaId: string; views: number }>;
}

// ============================================================
// Team Types
// ============================================================

export type TeamStatus =
  | 'PENDING'
  | 'WAITING_FOR_MEMBERS'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISQUALIFIED';

export type TeamInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface TeamUserSummary {
  id: string;
  email: string;
  fullName?: string;
  status?: UserStatus;
  mustChangePassword?: boolean;
}

export interface TeamEventSummary {
  id: string;
  title: string;
  status: EventStatus;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  maxTeams?: number;
}

export interface TeamTrackSummary {
  id: string;
  code?: string;
  name?: string;
  type?: string;
}

export interface TeamParticipant {
  id: string;
  eventId: string;
  teamId: string;
  user: TeamUserSummary | null;
  teamRole: 'LEADER' | 'MEMBER';
  status: string;
  joinedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamInvitation {
  id: string;
  eventId: string;
  teamId: string;
  leaderId: string;
  invitedEmail: string;
  invitedUserId?: string;
  invitedUser?: TeamUserSummary | null;
  status: TeamInvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  replacedByInvitationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  event: TeamEventSummary | null;
  eventId: string;
  track?: TeamTrackSummary | null;
  trackId?: string | null;
  leader: TeamUserSummary | null;
  leaderId: string;
  members: TeamUserSummary[];
  name: string;
  chapterName?: string | null;
  projectName?: string | null;
  status: TeamStatus;
  qualificationStatus?: string;
  confirmedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  participants: TeamParticipant[];
  invitations: TeamInvitation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  eventId: string;
  name: string;
  trackId?: string | null;
  chapterName?: string;
  projectName?: string;
  invitedEmails?: string[];
  invitedMembers?: TeamInviteMember[];
}

export interface TeamInviteMember {
  fullName: string;
  email: string;
}

export interface InviteMembersRequest {
  emails?: string[];
  members?: TeamInviteMember[];
}

export interface InviteMembersResult {
  total: number;
  invitations: TeamInvitation[];
}

export interface ReplaceInvitationRequest {
  email: string;
}

export interface InvitationDecisionResult {
  status: TeamInvitationStatus | TeamStatus;
  team: Team | null;
  invitation: TeamInvitation;
}

export interface ListTeamsQuery {
  eventId?: string;
  status?: TeamStatus;
  page?: number;
  limit?: number;
}

// ============================================================
// GitHub Integration Types
// ============================================================

export interface GitHubConfig {
  eventId: string;
  organizationName: string;
  ownerUsername: string;
  enabled: boolean;
  hasToken: boolean;
}

export interface SaveGitHubConfigRequest {
  eventId: string;
  organizationName: string;
  ownerUsername: string;
  githubToken?: string;
  enabled: boolean;
}

export interface TestGitHubConnectionResult {
  eventId: string;
  organizationName: string;
  ownerUsername: string;
  enabled: boolean;
  accessible: boolean;
  htmlUrl?: string;
  id?: number;
}

export interface CreateGitHubRepositoryRequest {
  eventId: string;
  repoName: string;
  description?: string;
  private: boolean;
}

export interface CreateGitHubRepositoryResult {
  repoName: string;
  htmlUrl?: string;
  cloneUrl?: string;
  visibility?: string;
}

export interface AssignGitHubCollaboratorRequest {
  eventId: string;
  permission: 'pull' | 'triage' | 'push' | 'maintain' | 'admin';
}

export interface AssignGitHubCollaboratorResult {
  repoName: string;
  username: string;
  permission: string;
  status: string;
}

export interface InviteGitHubOrganizationMemberRequest {
  eventId: string;
  email: string;
  role: 'direct_member';
}

export interface InviteGitHubOrganizationMemberResult {
  id?: number;
  email: string;
  role: string;
  invitationUrl?: string;
}

export interface RevokeGitHubMembersRequest {
  eventId: string;
  confirmationText: 'REVOKE MEMBERS';
}

export interface RevokeGitHubMembersResult {
  removed: string[];
  skipped: string[];
  failed: Array<{
    username: string;
    reason: string;
  }>;
}

// ============================================================
// User Management Types
// ============================================================

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  roles: UserRoleName[];
  status?: UserStatus;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  studentType?: 'FPT' | 'EXTERNAL';
  studentId?: string;
  schoolName?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface AssignRolesRequest {
  roles: UserRoleName[];
}

// ============================================================
// Track Types
// ============================================================

export type TrackType = 'PRELIMINARY_GROUP' | 'FINAL_POOL' | 'GENERAL';
export type TrackStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'COMPLETED';

export interface TrackEventSummary {
  id: string;
  title?: string;
  semester?: string;
  status?: string;
}

export interface Track {
  id: string;
  event: TrackEventSummary | null;
  code?: string;
  name: string;
  description?: string | null;
  topic?: string | null;
  problemStatement?: string | null;
  type?: TrackType;
  teamIds: string[];
  maxTeams?: number;
  status?: TrackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrackRequest {
  eventId: string;
  code?: string;
  name: string;
  description?: string;
  topic?: string | null;
  problemStatement?: string | null;
  type?: TrackType;
  teamIds?: string[];
  maxTeams?: number;
  status?: TrackStatus;
}

export type UpdateTrackRequest = Partial<CreateTrackRequest>;

export interface ListTracksQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  search?: string;
}

// ============================================================
// Participant Types
// ============================================================

export type ParticipantStatus = 'INVITED' | 'REGISTERED' | 'ACTIVE' | 'WITHDRAWN';
export type CheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';
export type GitHubAccessStatus = 'NOT_GRANTED' | 'GRANTED' | 'REVOKED';
export type EligibilityStatus = 'PENDING' | 'ELIGIBLE' | 'INELIGIBLE';
export type TeamRole = 'MEMBER' | 'LEADER';
export type AttendedActivity = 'WORKSHOP' | 'OPENING' | 'TEAM_MEETING' | 'CODING' | 'PRESENTATION' | 'CLOSING';

export interface ParticipantUserSummary {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
  studentId?: string | null;
  studentType?: 'FPT' | 'EXTERNAL' | null;
  schoolName?: string | null;
}

export interface ParticipantTeamSummary {
  id: string;
  name?: string;
  status?: string;
}

export interface Participant {
  id: string;
  eventId: string;
  user: ParticipantUserSummary | null;
  team: ParticipantTeamSummary | null;
  chapterName?: string | null;
  teamRole?: TeamRole;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  eligibilityStatus: EligibilityStatus;
  attendedActivities: AttendedActivity[];
  checkInStatus: CheckInStatus;
  githubAccessStatus: GitHubAccessStatus;
  status: ParticipantStatus;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantRequest {
  eventId: string;
  userId?: string;
  teamId?: string | null;
  chapterName?: string;
  teamRole?: TeamRole;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  status?: ParticipantStatus;
}

export interface UpdateParticipantRequest {
  status?: ParticipantStatus;
  eligibilityStatus?: EligibilityStatus;
  teamId?: string | null;
  teamRole?: TeamRole;
  chapterName?: string | null;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  githubAccessStatus?: GitHubAccessStatus;
  attendedActivities?: AttendedActivity[];
}

export interface ListParticipantsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  userId?: string;
  teamId?: string;
  checkInStatus?: CheckInStatus;
  status?: ParticipantStatus;
  eligibilityStatus?: EligibilityStatus;
  githubAccessStatus?: GitHubAccessStatus;
  chapterName?: string;
}

// ============================================================
// Timeline Types
// ============================================================

export type TimelineEventType = 'WORKSHOP' | 'CHECK_IN' | 'ROUND' | 'RESULT_PUBLISHING' | 'CEREMONY' | 'OTHER';
export type TimelineStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface TimelineEventSummary {
  id: string;
  title?: string;
  semester?: string;
  status?: string;
}

export interface TimelineEvent {
  id: string;
  event: TimelineEventSummary | null;
  eventId: string;
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventType: TimelineEventType;
  status: TimelineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimelineRequest {
  eventId: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  eventType?: TimelineEventType;
  status?: TimelineStatus;
}

export type UpdateTimelineRequest = Partial<Omit<CreateTimelineRequest, 'eventId'>>;

export interface ListTimelinesQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  eventType?: TimelineEventType;
  status?: TimelineStatus;
  search?: string;
}

// ============================================================
// Workshop Types
// ============================================================

export type WorkshopStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface UserSummary {
  id: string;
  fullName?: string;
  email?: string;
}

export interface EventSummary {
  id: string;
  title?: string;
  seriesName?: string;
  season?: string;
  year?: number;
  status?: string;
}

export interface WorkshopSpeakerInfo {
  name?: string;
  title?: string;
  bio?: string;
  email?: string;
}

export interface WorkshopGoogleMeet {
  enabled: boolean;
  meetLink?: string;
  calendarEventId?: string;
  htmlLink?: string;
  organizerUserId?: string;
  organizerEmail?: string;
  createdAt?: string;
}

export interface Workshop {
  id: string;
  event: EventSummary | null;
  eventId?: string;
  timelineEventId?: string;
  title: string;
  description?: string | null;
  presenter: UserSummary | null;
  presenterId?: string;
  speakerInfo?: WorkshopSpeakerInfo;
  meetLink?: string | null;
  googleMeet?: WorkshopGoogleMeet;
  startTime: string;
  endTime: string;
  questionnaire?: string[];
  status: WorkshopStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopQuestion {
  id: string;
  workshopId: string;
  author: UserSummary | null;
  content: string;
  voteCount: number;
  votes?: { voter: UserSummary | null; votedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopRating {
  id: string;
  workshopId: string;
  author: UserSummary | null;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopRatingStats {
  averageRating: number;
  totalRatings: number;
}

export interface WorkshopFeedback {
  id: string;
  workshopId: string;
  author: UserSummary | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Round Types
// ============================================================
export type RoundType = 'PRELIMINARY' | 'FINAL';
export type RoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'SCORING' | 'COMPLETED';

export interface Round {
  id: string;
  eventId: string;
  event: { id: string; title: string; status: string } | null;
  trackId: string | null;
  track: { id: string; code: string; name: string } | null;
  rubricId: string | null;
  rubric: { id: string; title: string; totalScore: number | null } | null;
  name: string;
  roundType: RoundType;
  status: RoundStatus;
  startTime: string | null;
  endTime: string | null;
  submissionDeadline: string | null;
  publishTime: string | null;
  maxPromotedTeams: number | null;
  assignedTeams?: {
    id: string;
    name?: string;
    chapterName?: string | null;
    projectName?: string | null;
    status?: string;
    trackId?: string | null;
    boardNumber?: number | null;
    placementSlot?: number | null;
  }[];
  assignedTeamIds: string[];
  promotedTeams?: {
    id: string;
    name?: string;
    chapterName?: string | null;
    projectName?: string | null;
    status?: string;
    trackId?: string | null;
    boardNumber?: number | null;
    placementSlot?: number | null;
  }[];
  promotedTeamIds: string[];
  assignedJudges: UserSummary[];
  assignedJudgeIds?: string[];
  promotionRule?: string | null;
  tieBreakRule?: string | null;
  tieBreakDurationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoundRequest {
  eventId: string;
  name: string;
  roundType?: RoundType;
  trackId?: string | null;
  assignedTeamIds?: string[];
  promotedTeamIds?: string[];
  assignedJudgeIds?: string[];
  rubricId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  submissionDeadline?: string | null;
  publishTime?: string | null;
  maxPromotedTeams?: number | null;
  promotionRule?: string | null;
  tieBreakRule?: string | null;
  tieBreakDurationMinutes?: number | null;
  status?: RoundStatus;
}

export interface UpdateRoundRequest {
  eventId?: string;
  name?: string;
  roundType?: RoundType;
  status?: RoundStatus;
  trackId?: string | null;
  assignedTeamIds?: string[];
  promotedTeamIds?: string[];
  assignedJudgeIds?: string[];
  rubricId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  submissionDeadline?: string | null;
  publishTime?: string | null;
  maxPromotedTeams?: number | null;
  promotionRule?: string | null;
  tieBreakRule?: string | null;
  tieBreakDurationMinutes?: number | null;
}

export interface ListRoundsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  trackId?: string;
  roundType?: RoundType;
  status?: RoundStatus;
  search?: string;
}

// ============================================================
// Judging Board Types
// ============================================================
export type JudgingBoardStatus = 'DRAFT' | 'ASSIGNED' | 'SCORING' | 'COMPLETED';

export interface JudgingBoard {
  id: string;
  eventId: string;
  event: { id: string; title: string } | null;
  roundId: string;
  round: { id: string; name: string; roundType: RoundType; status: RoundStatus } | null;
  trackId: string | null;
  track: { id: string; code: string; name: string } | null;
  name: string;
  boardNumber: number;
  status: JudgingBoardStatus;
  maxTeams: number;
  teams: { id: string; name: string; projectName: string | null; status: string }[];
  judges: UserSummary[];
  teamIds: string[];
  judgeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateJudgingBoardRequest {
  eventId: string;
  roundId: string;
  trackId?: string | null;
  name: string;
  boardNumber: number;
  maxTeams?: number;
  teamIds?: string[];
  judgeIds?: string[];
}

export interface AutoAssignRequest {
  eventId: string;
  roundId: string;
}

export interface UpdateJudgingBoardRequest {
  eventId?: string;
  roundId?: string;
  trackId?: string | null;
  name?: string;
  boardNumber?: number;
  status?: JudgingBoardStatus;
  maxTeams?: number;
  teamIds?: string[];
  judgeIds?: string[];
}

export interface ListJudgingBoardsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  trackId?: string;
  status?: JudgingBoardStatus;
  search?: string;
}

// ============================================================
// Submission Types
// ============================================================
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export interface Submission {
  id: string;
  eventId: string;
  event: { id: string; title: string } | null;
  roundId: string;
  round: { id: string; name: string; roundType: RoundType; status: RoundStatus } | null;
  teamId: string;
  team: { id: string; name: string; projectName: string | null } | null;
  repositoryId?: string | null;
  repository?: {
    id: string;
    repositoryFullName?: string;
    repositoryUrl?: string;
    status?: string;
  } | null;
  demoUrl: string | null;
  reportUrl: string | null;
  presentationUrl: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRequest {
  eventId: string;
  roundId: string;
  teamId: string;
  repositoryId?: string | null;
  demoUrl?: string | null;
  reportUrl?: string | null;
  presentationUrl?: string | null;
  status?: SubmissionStatus;
}

export interface UpdateSubmissionRequest {
  repositoryId?: string | null;
  demoUrl?: string | null;
  reportUrl?: string | null;
  presentationUrl?: string | null;
}

export interface ListSubmissionsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  teamId?: string;
  repositoryId?: string;
  status?: SubmissionStatus;
}

// ============================================================
// Rubric + Criterion Types
// ============================================================
export interface Criterion {
  id: string;
  rubricId: string;
  name: string;
  description: string | null;
  maxScore: number;
  weight: number;
  order?: number;
  judgeOnly?: boolean;
  aiSupportForAudit?: boolean;
  aiInstruction?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RubricStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Rubric {
  id: string;
  eventId: string;
  roundId?: string | null;
  event: { id: string; title: string; status?: string } | null;
  round?: { id: string; name: string; roundType?: RoundType; status?: RoundStatus } | null;
  title: string;
  description: string | null;
  totalScore: number | null;
  version?: number;
  status?: RubricStatus;
  criteria: Criterion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRubricRequest {
  eventId: string;
  roundId?: string | null;
  title: string;
  description?: string | null;
  totalScore?: number | null;
  version?: number;
  status?: RubricStatus;
}

export interface UpdateRubricRequest {
  title?: string;
  description?: string | null;
  version?: number;
  status?: RubricStatus;
}

export interface CreateCriterionRequest {
  name: string;
  description?: string | null;
  maxScore: number;
  weight?: number;
  order?: number;
  judgeOnly?: boolean;
  aiSupportForAudit?: boolean;
  aiInstruction?: string | null;
}

export interface UpdateCriterionRequest {
  name?: string;
  description?: string | null;
  maxScore?: number;
  weight?: number;
  order?: number;
  judgeOnly?: boolean;
  aiSupportForAudit?: boolean;
  aiInstruction?: string | null;
}

export interface ListRubricsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  status?: RubricStatus;
}

// ============================================================
// Scoring Types
// ============================================================
export type ScoreSheetStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED';

export interface ScoreEntry {
  id?: string;
  criterionId: string;
  criterion: { id: string; name: string; maxScore: number; weight: number; order?: number } | null;
  judgeId?: string;
  scoreValue: number;
  comment: string | null;
  isOverridden: boolean;
  overrideReason: string | null;
}

export interface ScoreSheet {
  id: string;
  eventId: string;
  roundId: string;
  round: { id: string; name: string; roundType: RoundType } | null;
  boardId: string | null;
  board: { id: string; name: string; boardNumber: number } | null;
  teamId: string;
  team: { id: string; name: string; projectName: string | null } | null;
  submissionId: string;
  submission: { id: string; demoUrl: string | null; reportUrl: string | null; presentationUrl: string | null } | null;
  judgeId: string;
  judge: UserSummary | null;
  rubricId: string | null;
  rubric?: { id: string; title: string; totalScore: number | null } | null;
  totalScore: number;
  weightedScore: number;
  finalScore: number;
  generalComment: string | null;
  status: ScoreSheetStatus;
  submittedAt: string | null;
  lockedAt?: string | null;
  scores: ScoreEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitScoreSheetRequest {
  scoreSheetId?: string;
  eventId: string;
  roundId: string;
  boardId: string;
  teamId: string;
  submissionId: string;
  rubricId?: string | null;
  generalComment?: string | null;
  submit?: boolean;
  scores: { criterionId: string; scoreValue: number; comment?: string | null }[];
}

export interface ListScoreSheetsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  teamId?: string;
  judgeId?: string;
  status?: ScoreSheetStatus;
}
