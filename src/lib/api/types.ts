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
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

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
