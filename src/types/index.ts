export type { Phase } from '../constants/phases';
import type { AuraParams } from '../aura-engine/types';

export type { AuraParams };

export interface AuraConfig {
  element: string | null;
  energy: string | null;
  chaosPrompt: string | null;
}

// ── Parent ↔ Iframe bridge protocol ──────────────────────────

export interface AvatarPayload {
  avatarImageUrl: string;
  avatarConfig?: Record<string, unknown>;
}

/** Messages the parent (Q-bit Shop) sends INTO the iframe */
export type ParentMessage =
  | { type: 'qbit:avatar-data'; payload: AvatarPayload }
  | { type: 'qbit:ping' };

/** Messages the iframe (Aura Lab) sends TO the parent */
export type AuraMessage =
  | { type: 'aura:ready' }
  | { type: 'aura:phase-change'; payload: { phase: string } }
  | { type: 'aura:equipped'; payload: { auraConfig: AuraConfig; auraParams?: AuraParams } }
  | { type: 'aura:retry' }
  | { type: 'aura:close' };
