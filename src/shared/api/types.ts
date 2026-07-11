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
  name?: string;
  description?: string;
  module?: string;
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  code?: string;
  description?: string;
  permissions?: Permission[];
  permissionCount?: number;
  isSystemRole?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface ListPermissionsQuery {
  page?: number;
  limit?: number;
  module?: string;
  isActive?: boolean;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string | null;
  module?: string;
  isActive?: boolean;
}

export interface ListRolesQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  isSystemRole?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  code?: string;
  description?: string | null;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface RolePermissionsResult {
  roleId: string;
  roleName: string;
  permissions: Permission[];
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
  registrationSource: 'FORM' | 'GOOGLE';
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
  githubUsername?: string | null;
  studentType?: 'FPT' | 'EXTERNAL' | null;
  studentId?: string | null;
  schoolName?: string | null;
  emailNotification?: UserEmailNotification;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

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

export type NotificationType = 'DEADLINE' | 'WORKSHOP' | 'RESULT' | 'FEEDBACK' | 'SYSTEM';
export type NotificationStatus = 'UNREAD' | 'READ';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string | null;
  type: NotificationType;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
}

export interface MarkAllNotificationsReadResult {
  matchedCount: number;
  modifiedCount: number;
}

export type UserRoleName =
  | 'ADMIN'
  | 'EVENT_COORDINATOR'
  | 'COORDINATOR'
  | 'JUDGE'
  | 'MENTOR'
  | 'SPEAKER'
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

export interface GoogleLoginRequest {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  githubUsername: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============================================================
// Event Types
// ============================================================

export type EventStatus =
  | 'DRAFT'
  | 'OPEN_REGISTRATION'
  | 'REGISTRATION_CLOSED'
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
  registrationClosedAt?: string | null;
  registrationCloseReason?: 'CAPACITY_REACHED' | 'REGISTRATION_ENDED' | 'MANUALLY_CLOSED' | null;
  startDate?: string | null;
  endDate?: string | null;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  finalistSlotsPerTrack?: number;
  totalFinalistSlots?: number;
  competitionConfig?: CompetitionConfig;
  status: EventStatus;
  createdBy?: EventCreator | null;
  createdAt: string;
  updatedAt: string;
}

export type FinalistSelectionMode = 'FIXED_PER_BOARD' | 'TOP_PER_BOARD_WITH_WILDCARD' | 'OVERALL_SCORE' | 'CUSTOM';

export interface CompetitionConfig {
  boardCount?: number;
  trackCount?: number;
  maxTeamsPerBoard?: number;
  finalistCount?: number;
  finalistsPerBoard?: number;
  finalistSelectionMode?: FinalistSelectionMode;
  fillRemainingFinalistsByOverallScore?: boolean;
  rankingScopes?: string[];
  tieBreakRule?: string;
  tieBreakDurationMinutes?: number;
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
  competitionConfig?: CompetitionConfig;
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
  search?: string;
  tags?: string;
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
  mostActiveParticipants: Array<{
    participantId: string;
    participant: { id: string; email?: string; fullName?: string } | null;
    uploads: number;
  }>;
  mostViewedMedia: Array<{
    mediaId: string;
    media: { id: string; title?: string; originalFileName?: string; mediaType?: MediaType } | null;
    views: number;
  }>;
}

// ============================================================
// Team Types
// ============================================================

export type TeamStatus =
  | 'WAITING_FOR_MEMBERS'
  | 'WAITLISTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

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
  githubUsername?: string | null;
  status?: UserStatus;
  mustChangePassword?: boolean;
}

export interface TeamEventSummary {
  id: string;
  title: string;
  status: EventStatus;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  registrationClosedAt?: string | null;
  registrationCloseReason?: 'CAPACITY_REACHED' | 'REGISTRATION_ENDED' | 'MANUALLY_CLOSED' | null;
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
  status: ParticipantStatus;
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
  assignedMentors?: TeamUserSummary[];
  mentorIds?: string[];
  name: string;
  chapterName?: string | null;
  projectName?: string | null;
  status: TeamStatus;
  qualificationStatus?: string;
  confirmedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
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
  invitedEmails?: string[];
  invitedMembers?: TeamInviteMember[];
}

export interface TeamAvailability {
  eventId: string;
  name: string;
  normalizedName: string;
  available: boolean;
  nameAvailable: boolean;
  leaderAvailable: boolean;
  errors: string[];
}

export interface TeamInviteEligibility {
  eventId: string;
  email: string;
  available: boolean;
  userExists: boolean;
  hasTeam: boolean;
  hasActiveInvitation: boolean;
  errors: string[];
}

export interface TeamInviteMember {
  fullName: string;
  email: string;
  githubUsername: string;
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

export interface UpdateTeamMentorsRequest {
  mentorIds: string[];
}

export interface AssignMentorsByBoardRequest {
  eventId: string;
  boardNumber: number;
  mentorIds: string[];
}

export interface AssignMentorsByBoardResult {
  eventId: string;
  boardNumber: number;
  mentorIds: string[];
  updatedCount: number;
  teamIds: string[];
  teams: Team[];
}

export interface ListTeamsQuery {
  eventId?: string;
  boardNumber?: number;
  status?: TeamStatus;
  page?: number;
  limit?: number;
}

export type ChatParticipantRole = 'member' | 'mentor';

export type ChatMessageType = 'text' | 'image' | 'file';

export interface ChatMessageSender {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface ChatTeamSummary {
  id: string;
  eventId?: string;
  name: string;
  projectName?: string | null;
  status?: TeamStatus | string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  teamId: string;
  senderId: string;
  sender: ChatMessageSender | null;
  senderRole: ChatParticipantRole | string;
  message: string;
  messageType: ChatMessageType;
  clientMessageId?: string | null;
  isSeen: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface ChatRoom {
  id: string;
  teamId: string;
  roomKey: string;
  team?: ChatTeamSummary | null;
  participantRole?: ChatParticipantRole | string | null;
  unreadCount: number;
  lastMessage?: ChatMessage | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendChatMessageRequest {
  teamId: string;
  chatRoomId?: string;
  message: string;
  messageType?: ChatMessageType;
  clientMessageId?: string;
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
  teamId?: string;
  roundId?: string | null;
}

export interface RegisterGitHubWebhookRequest {
  eventId: string;
}

export interface RegisterGitHubWebhookResult {
  repoName: string;
  callbackUrl: string;
  events: string[];
  hookId: number | null;
  active: boolean;
}

export interface CreateGitHubRepositoryResult {
  repoName: string;
  htmlUrl?: string;
  cloneUrl?: string;
  visibility?: string;
  webhookRegistration?: RegisterGitHubWebhookResult | null;
}

export interface BulkCreateGitHubRepositoriesRequest {
  eventId: string;
  roundId: string | null;
  assignCollaborators?: boolean;
}

export interface BulkCreateGitHubRepositoriesResult {
  totalTeamsChecked: number;
  totalReposCreated: number;
  success: Array<{
    teamId: string;
    teamName: string;
    repoName: string;
    htmlUrl?: string;
  }>;
  failed: Array<{
    teamId: string;
    teamName: string;
    error: string;
  }>;
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

export interface RevokeGitHubCollaboratorRequest {
  eventId: string;
}

export interface RevokeGitHubCollaboratorResult {
  repoName: string;
  username: string;
  status: 'revoked';
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
// Repository Types
// ============================================================

export type RepositoryStatus = 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'DISCONNECTED';
export type RepositoryAccessState = 'UNKNOWN' | 'PENDING' | 'GRANTED' | 'REVOKED';
export type RepositoryWebhookStatus = 'NOT_CONFIGURED' | 'PENDING' | 'REGISTERED' | 'FAILED';

export interface RepositoryEventSummary {
  id: string;
  title?: string;
  semester?: string;
  season?: string;
  year?: number;
  status?: string;
}

export interface RepositoryTeamSummary {
  id: string;
  name?: string;
  projectName?: string | null;
  chapterName?: string | null;
  status?: string;
  boardNumber?: number | null;
  placementSlot?: number | null;
}

export interface RepositoryRoundSummary {
  id: string;
  name?: string;
  roundType?: RoundType;
  status?: RoundStatus;
}

export interface Repository {
  id: string;
  event: RepositoryEventSummary | null;
  eventId: string;
  team: RepositoryTeamSummary | null;
  teamId: string;
  round: RepositoryRoundSummary | null;
  roundId: string | null;
  githubOwner: string;
  githubRepo: string;
  repositoryFullName: string;
  repositoryUrl: string;
  repositoryLocalPath: string | null;
  defaultBranch: string;
  latestCommitSha: string | null;
  lastProcessedCommitSha: string | null;
  status: RepositoryStatus;
  accessState: RepositoryAccessState;
  accessGrantedAt: string | null;
  accessRevokedAt: string | null;
  webhookRegisteredAt: string | null;
  webhookStatus: RepositoryWebhookStatus;
  lastWebhookRegistrationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepositoryRequest {
  eventId: string;
  teamId: string;
  roundId?: string | null;
  githubOwner: string;
  githubRepo: string;
  repositoryUrl: string;
  repositoryLocalPath?: string | null;
  defaultBranch?: string;
  latestCommitSha?: string | null;
  lastProcessedCommitSha?: string | null;
  status?: RepositoryStatus;
  accessState?: RepositoryAccessState;
}

export interface UpdateRepositoryRequest {
  roundId?: string | null;
  defaultBranch?: string;
  latestCommitSha?: string | null;
  lastProcessedCommitSha?: string | null;
  status?: RepositoryStatus;
  accessState?: RepositoryAccessState;
  repositoryUrl?: string;
  repositoryLocalPath?: string | null;
  githubOwner?: string;
  githubRepo?: string;
}

export interface ListRepositoriesQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  teamId?: string;
  roundId?: string;
  status?: RepositoryStatus;
  accessState?: RepositoryAccessState;
  search?: string;
}

export interface RepositoryCommit {
  id: string;
  repositoryId: string;
  commitSha: string;
  branch: string | null;
  provider?: string | null;
  repositoryFullName?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  authorUsername?: string | null;
  timestamp?: string | null;
  message?: string | null;
  commitUrl?: string | null;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
}

export interface RepositoryCommitDiffFile {
  filePath: string;
  previousFilePath?: string | null;
  fileName?: string | null;
  language?: string | null;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  cleanPatch: string;
  patchSummary?: string;
  excludedReason?: string | null;
  isExcluded: boolean;
  isBinary: boolean;
  isGenerated: boolean;
  isMinified: boolean;
  isBuildArtifact: boolean;
  isLockFile: boolean;
  isTruncated: boolean;
  cleanPatchSize: number;
  hunkCount: number;
  addedLineCount: number;
  removedLineCount: number;
}

export interface RepositoryCommitDiff {
  id: string;
  repositoryId: string;
  commitId: string | null;
  baseCommitSha: string | null;
  headCommitSha: string | null;
  provider?: string | null;
  status: string;
  totalFiles: number;
  includedFiles: number;
  excludedFiles: number;
  totalCleanPatchSize: number;
  cleanDiffSummary?: string | null;
  fetchedAt?: string | null;
  patchSummary?: string;
  files: RepositoryCommitDiffFile[];
}

export interface RepositoryStaticAnalysisFinding {
  [key: string]: unknown;
}

export interface RepositoryStaticAnalysisResult {
  id: string;
  repositoryId: string;
  commitSha: string;
  source?: string | null;
  status: string;
  errorCount: number;
  warningCount: number;
  findings: RepositoryStaticAnalysisFinding[];
  rawOutput?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryImpactDecision {
  id: string;
  repositoryId: string;
  commitSha: string;
  impactScore: number;
  impactLevel: string;
  decision: string;
  reasons: string[];
  needsHumanReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryAiReview {
  id: string;
  repositoryId: string;
  eventId: string | null;
  teamId: string | null;
  roundId: string | null;
  commitId: string | null;
  commitDiffId: string | null;
  impactDecisionId: string | null;
  reviewKind: string;
  status: string;
  summary: string;
  overallSummary: string;
  needsHumanReview: boolean;
  isScoreBased: boolean;
  isFinalDecision: boolean;
  commitSha: string | null;
  provider: string | null;
  modelName: string | null;
  promptVersion: string | null;
  requestedAt: string | null;
  completedAt: string | null;
  normalizedOutput: Record<string, unknown> | null;
}

export interface AnalyzeRepositoryCommitRequest {
  commitSha?: string | null;
}

export interface TriggerPerPushReviewRequest {
  commitSha?: string | null;
}

export interface TriggerTeamAggregateReviewRequest {
  batchId?: string | null;
}

// ============================================================
// User Management Types
// ============================================================

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
  roles?: UserRoleName[];
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
  githubUsername?: string;
  studentType?: 'FPT' | 'EXTERNAL';
  studentId?: string;
  schoolName?: string;
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'password' | 'status'>>;

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  githubUsername?: string | null;
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

export type ParticipantStatus = 'INVITED' | 'JOINED' | 'WITHDRAWN';
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
  githubUsername?: string | null;
  studentId?: string | null;
  studentType?: 'FPT' | 'EXTERNAL' | null;
  schoolName?: string | null;
}

export interface ParticipantTeamSummary {
  id: string;
  name?: string;
  status?: string;
}

export interface GitHubUserProfile {
  login: string;
  id: number;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  publicRepos?: number | null;
  followers?: number | null;
}

export interface GitHubUsernameAvailability {
  username: string;
  available: boolean;
  errors: string[];
}

export interface ParticipantEventSummary {
  id: string;
  title?: string;
  semester?: string | null;
  season?: string | null;
  year?: number | null;
  status?: EventStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Participant {
  id: string;
  eventId: string;
  event?: ParticipantEventSummary | null;
  user: ParticipantUserSummary | null;
  team: ParticipantTeamSummary | null;
  chapterName?: string | null;
  teamRole?: TeamRole;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  eligibilityStatus: EligibilityStatus;
  attendedActivities: AttendedActivity[];
  checkInStatus: CheckInStatus;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  githubAccessStatus: GitHubAccessStatus;
  status: ParticipantStatus;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInQr {
  eventId: string;
  qrCodeDataUrl: string;
  qrPayload: string;
  expiresAt: string;
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
  githubUsername?: string | null;
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

export interface WorkshopRatingListData {
  ratings: WorkshopRating[];
  stats: WorkshopRatingStats;
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
  problemStatement?: string | null;
  examDriveUrl?: string | null;
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
  problemStatement?: string | null;
  examDriveUrl?: string | null;
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

export interface JudgingBoardRandomizationPreviewBoard {
  boardNumber: number;
  boardLabel: string;
  name: string;
  maxTeams: number;
  judgeIds: string[];
  teamIds: string[];
  teams: Array<{
    id: string;
    name: string;
    chapterName?: string | null;
    projectName?: string | null;
    status: string;
    trackId?: string | null;
    boardNumber?: number | null;
    placementSlot?: number | null;
  }>;
}

export interface JudgingBoardRandomizationPreview {
  event: { id: string; title: string } | null;
  round: { id: string; name: string; roundType: RoundType; status: RoundStatus } | null;
  boardCount: number;
  maxTeamsPerBoard: number;
  eligibleTeamCount: number;
  ineligibleTeamCount: number;
  boards: JudgingBoardRandomizationPreviewBoard[];
}

export interface ConfirmJudgingBoardRandomizationRequest {
  eventId: string;
  roundId: string;
  boards: Array<{
    boardNumber: number;
    name: string;
    teamIds: string[];
  }>;
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

// ============================================================
// Ranking Types
// ============================================================
export type RankingType = 'TEAM' | 'CHAPTER' | 'INDIVIDUAL';
export type TieBreakMethod = 'NONE' | 'PENALTY_EVALUATION' | 'MINI_TEST';

export interface RankingTeamSummary {
  id: string;
  name?: string;
  chapterName?: string | null;
  projectName?: string | null;
  boardNumber?: number | null;
  trackId?: string | null;
  status?: string;
}

export interface Ranking {
  id: string;
  eventId: string;
  event: { id: string; title: string; status: string } | null;
  rankingType: RankingType;
  roundId: string | null;
  round: { id: string; name: string; roundType: RoundType; status: RoundStatus } | null;
  trackId: string | null;
  track: { id: string; code: string; name: string } | null;
  teamId: string | null;
  team: RankingTeamSummary | null;
  score: number;
  pointDelta: number;
  tieBreakMethod: TieBreakMethod;
  tieBreakScore: number;
  penaltyScore: number;
  miniTestScore: number;
  rank: number;
  calculationSource: string;
  calculationSummary: Record<string, unknown> | null;
  calculatedAt: string | null;
  isSelectedForFinal: boolean;
  selectionReason?: string | null;
  note?: string | null;
  publishedAt: string | null;
  publishedBy: { id: string; fullName?: string; email?: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListRankingsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  trackId?: string;
  teamId?: string;
  rankingType?: RankingType;
}

export interface GenerateRankingsRequest {
  eventId: string;
  roundId: string;
  rankingType?: RankingType;
}

export interface GenerateRankingsResult {
  rankings: Ranking[];
  summary?: {
    generatedCount?: number;
    source?: string;
    tiedGroups?: unknown[];
  };
}

// ============================================================
// Finalist Types
// ============================================================
export interface SelectFinalistsRequest {
  eventId: string;
  roundId: string;
}

export interface SelectManualFinalistsRequest extends SelectFinalistsRequest {
  teamIds: string[];
  selectionReason?: string | null;
}

export interface SelectFinalistsResult {
  finalists: Ranking[];
  summary?: {
    finalistSelectionMode?: string;
    finalistCount?: number;
    promotedTeamIds?: string[];
    source?: string;
  };
}

// ============================================================
// Result / Publication Types
// ============================================================
export type RepositoryAccessAction = 'NONE' | 'FREEZE' | 'REVOKE';

export interface PublishResultsRequest {
  eventId: string;
  roundId: string;
  repositoryAccessAction?: RepositoryAccessAction;
}

export interface PublishResultsResult {
  publishedAt: string;
  rankings: Ranking[];
  repositoryAccessAction: {
    action: RepositoryAccessAction;
    affectedRepositories: number;
  };
  notified?: number;
}

// ============================================================
// Audit Log Types
// ============================================================
export interface AuditLog {
  id: string;
  auditId?: string;
  userId: string | null;
  user: { id: string; fullName?: string | null; email?: string | null; status?: string | null } | null;
  username?: string | null;
  userRole?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  resourceType: string | null;
  resourceId: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  description?: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId?: string | null;
  sessionId?: string | null;
  result?: 'SUCCESS' | 'FAILURE' | string | null;
  errorMessage?: string | null;
  sourceModule?: string | null;
  createdAt: string;
}

export interface AuditLogSummary {
  totalItems?: number;
  totalLogs?: number;
  actionBreakdown?: Array<{ action: string; count: number }>;
  resourceBreakdown?: Array<{ resourceType: string; count: number }>;
  resultBreakdown?: Array<{ result: string; count: number }>;
  roleBreakdown?: Array<{ userRole: string; count: number }>;
  recentAuditLogs?: AuditLog[];
  byAction?: Array<{ action: string; count: number }>;
  byResourceType?: Array<{ resourceType: string; count: number }>;
  byUser?: Array<{ userId: string; fullName?: string; email?: string; count: number }>;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  userId?: string;
  username?: string;
  userRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: 'SUCCESS' | 'FAILURE' | '';
  sourceModule?: string;
  search?: string;
  from?: string;
  to?: string;
}

// ============================================================
// Operations / Pipeline Types
// ============================================================
export interface StatusCount {
  status: string;
  count: number;
}

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueSummary {
  queueName: string;
  redisStatus: string;
  counts: QueueCounts;
  error?: string;
}

export interface DashboardMetrics {
  participants: number;
  teams: number;
  submissions: number;
  repositories: number;
  pendingAiReviews: number;
  fallbackAiReviews: number;
  failedJobs: number;
}

export interface OperationsDashboardMetrics {
  scope: { eventId: string | null; roundId: string | null };
  metrics: DashboardMetrics;
  queue: QueueSummary;
  [key: string]: unknown;
}

export interface PipelineSummary {
  scope: { eventId: string | null; roundId: string | null };
  queue: QueueSummary;
  webhookStatusBreakdown: StatusCount[];
  commitDiffStatusBreakdown: StatusCount[];
  aiReviewStatusBreakdown: StatusCount[];
}
