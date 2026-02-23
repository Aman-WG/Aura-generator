export type { Phase } from '../constants/phases';
export type { AuraParams } from '../aura-engine/types';

export interface AuraConfig {
  element: string | null;
  energy: string | null;
  chaosPrompt: string | null;
}

export interface AvatarPayload {
  avatarImageUrl: string;
  avatarId?: string;
}

export type AuraMessage =
  | { type: 'aura:ready' }
  | { type: 'aura:equipped'; payload: { auraConfig: AuraConfig; auraParams?: AuraParams } }
  | { type: 'aura:phase-change'; payload: { phase: string } }
  | { type: 'aura:retry' }
  | { type: 'aura:close' };

export type ParentMessage =
  | { type: 'qbit:avatar-data'; payload: AvatarPayload };
