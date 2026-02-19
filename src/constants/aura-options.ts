// ─────────────────────────────────────────────────────────────
// AURA SYNTHESIZER — Slot Machine Reel Options
// Used during BLUEPRINT phase. Each reel = one dimension of aura.
// ─────────────────────────────────────────────────────────────

export interface AuraOption {
  id: string;
  label: string;
  emoji: string;
  color: string; // tailwind-compatible or hex
}

export const CORE_OPTIONS: AuraOption[] = [
  { id: 'fire', label: 'INFERNO', emoji: '🔥', color: '#FF4500' },
  { id: 'ice', label: 'GLACIER', emoji: '❄️', color: '#00D4FF' },
  { id: 'void', label: 'VOID', emoji: '🌀', color: '#8B00FF' },
  { id: 'thunder', label: 'STORM', emoji: '⚡', color: '#FFD700' },
  { id: 'nature', label: 'WILDS', emoji: '🌿', color: '#00FF88' },
];

export const MOVE_OPTIONS: AuraOption[] = [
  { id: 'dash', label: 'BLINK DASH', emoji: '💨', color: '#00BFFF' },
  { id: 'slam', label: 'GROUND SLAM', emoji: '💥', color: '#FF6347' },
  { id: 'shield', label: 'PHASE SHIELD', emoji: '🛡️', color: '#7B68EE' },
  { id: 'pulse', label: 'SHOCKWAVE', emoji: '🔊', color: '#FF1493' },
  { id: 'stealth', label: 'GHOST STEP', emoji: '👻', color: '#708090' },
];

export const VIBE_OPTIONS: AuraOption[] = [
  { id: 'menace', label: 'VILLAIN ARC', emoji: '😈', color: '#DC143C' },
  { id: 'chill', label: 'MAIN CHARACTER', emoji: '😎', color: '#4169E1' },
  { id: 'chaos', label: 'UNHINGED', emoji: '🤪', color: '#FF00FF' },
  { id: 'wise', label: 'SAGE MODE', emoji: '🧘', color: '#228B22' },
  { id: 'hype', label: 'LEGENDARY', emoji: '🏆', color: '#FFD700' },
];
