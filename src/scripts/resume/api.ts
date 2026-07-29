import type {
  ApiErrorPayload,
  EditorSession,
  ResumeBackup,
  ResumeData,
  ResumeRegistry,
  ResumeRegistryEntry,
} from '../../types/resume';

export class ResumeApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ResumeApiError';
    this.status = status;
    this.code = code;
  }
}

function backupCreatedAt(id: string): string {
  const match = id.match(/^(\d{4}-\d{2}-\d{2}T)(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/);
  return match
    ? `${match[1]}${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`
    : id.replace(/\.json$/, '');
}

export function createResumeApi(baseUrl = '') {
  const prefix = baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${prefix}${path}`, {
      ...init,
      headers,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      let payload: ApiErrorPayload | null = null;
      try {
        payload = await response.json() as ApiErrorPayload;
      } catch {
        // The stable fallback below covers non-JSON proxy errors.
      }
      throw new ResumeApiError(
        response.status,
        payload?.error?.code ?? 'request_failed',
        payload?.error?.message ?? 'The CV request failed.',
      );
    }

    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  return {
    list: () => request<ResumeRegistry>('/api/cvs'),
    read: (id: string) => request<ResumeData>(`/api/cvs/${encodeURIComponent(id)}`),
    session: () => request<EditorSession>('/api/cv-editor/session'),
    login: (password: string) =>
      request<void>('/api/cv-editor/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    logout: () => request<void>('/api/cv-editor/logout', { method: 'POST' }),
    async save(id: string, data: ResumeData): Promise<void> {
      await request<ResumeData>(`/api/cvs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    rename: (id: string, name: string) =>
      request<ResumeRegistryEntry>(`/api/cvs/${encodeURIComponent(id)}/name`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    duplicate: (id: string, name: string) =>
      request<ResumeRegistryEntry>(`/api/cvs/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    createBlank: (name: string) =>
      request<ResumeRegistryEntry>('/api/cvs', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    async backups(id: string): Promise<ResumeBackup[]> {
      const payload = await request<{ backups: Array<string | ResumeBackup> }>(
        `/api/cvs/${encodeURIComponent(id)}/backups`,
      );
      return payload.backups.map((backup) =>
        typeof backup === 'string'
          ? { id: backup, createdAt: backupCreatedAt(backup) }
          : backup,
      );
    },
    restore: (id: string, backupId: string) =>
      request<ResumeData>(
        `/api/cvs/${encodeURIComponent(id)}/backups/${encodeURIComponent(backupId)}/restore`,
        { method: 'POST' },
      ),
  };
}
