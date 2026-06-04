/**
 * Shadowfax Unified API client (Marketplace / seller-pickup model).
 *
 * Auth: HTTP Token auth — `Authorization: Token <key>`.
 * Base URL (set SHADOWFAX_ENV=PROD for live, anything else → staging):
 *   PROD     https://dale.shadowfax.in/api
 *   STAGING  https://dale.staging.shadowfax.in/api
 *
 * IMPORTANT quirk: order-creation failures come back as HTTP 200 with
 * `{ "message": "Failure", "errors": ... }`, so callers MUST inspect the
 * body, not just the HTTP status.
 */

function sanitize(v: string | undefined): string {
  return (v || '').replace(/^['"]|['"]$/g, '').trim();
}

function getBaseUrl(): string {
  const explicit = sanitize(process.env.SHADOWFAX_BASE_URL).replace(/\/$/, '');
  if (explicit) return explicit;
  const env = sanitize(process.env.SHADOWFAX_ENV).toUpperCase();
  return env === 'PROD'
    ? 'https://dale.shadowfax.in/api'
    : 'https://dale.staging.shadowfax.in/api';
}

export interface SfxResponse<T = any> {
  message?: string;          // "Success" | "Failure"
  errors?: any;
  data?: T;
  [k: string]: any;
}

export class ShadowfaxService {
  private static get token(): string {
    return sanitize(process.env.SHADOWFAX_TOKEN);
  }

  static isConfigured(): boolean {
    return !!this.token;
  }

  private static async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: any,
  ): Promise<T> {
    const token = this.token;
    if (!token) throw new Error('Shadowfax token not configured (SHADOWFAX_TOKEN)');

    const res = await fetch(`${getBaseUrl()}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (res.status === 401) {
      throw new Error('Shadowfax unauthorized — check SHADOWFAX_TOKEN');
    }
    if (!res.ok) {
      throw new Error(
        `Shadowfax API error [${res.status}] for ${endpoint}: ${raw?.slice(0, 300)}`,
      );
    }
    return (json ?? {}) as T;
  }

  /**
   * Returns the serviceable-pincode list for a service. Empty array → not serviceable.
   * service: customer_delivery | seller_pickup | customer_pickup | ...
   */
  static async checkServiceability(
    pincode: string | number,
    service = 'customer_delivery',
  ): Promise<Array<{ code: number; services: string[] }>> {
    const q = new URLSearchParams({
      service,
      page: '1',
      count: '5',
      pincodes: String(pincode),
    });
    const out = await this.request<any>(
      `/v1/clients/serviceability/?${q.toString()}`,
      'GET',
    );
    return Array.isArray(out) ? out : [];
  }

  /** Create a marketplace seller-pickup order. Inspect `.message === 'Success'`. */
  static async createOrder(payload: any): Promise<SfxResponse> {
    return this.request<SfxResponse>('/v3/clients/orders/', 'POST', payload);
  }

  /** Full tracking timeline for an AWB. */
  static async trackByAWB(awb: string): Promise<SfxResponse> {
    return this.request<SfxResponse>(
      `/v4/clients/orders/${encodeURIComponent(awb)}/track/`,
      'GET',
    );
  }

  /** Cancel by AWB or client_order_id. responseCode 200/304 = accepted. */
  static async cancelOrder(
    requestId: string,
    cancelRemarks = 'Cancelled by seller',
  ): Promise<SfxResponse> {
    return this.request<SfxResponse>('/v3/clients/orders/cancel/', 'POST', {
      request_id: requestId,
      cancel_remarks: cancelRemarks,
    });
  }
}
