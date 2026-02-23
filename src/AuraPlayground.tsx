import { useState, useCallback, useRef, useEffect } from 'react';
import { AuraCanvas } from './components/Stage/AuraCanvas';
import { generateAuraParams, getFallbackParams } from './aura-engine/aura-ai';
import type { AIProvider, AuraGenerationResult } from './aura-engine/aura-ai';
import type { AuraParams } from './aura-engine/types';

const ELEMENTS = ['fire', 'ice', 'void', 'thunder', 'nature'] as const;
const ENERGIES = ['vortex', 'sonic', 'explode', 'pulse', 'glitch'] as const;

const ELEMENT_META: Record<string, { emoji: string; label: string; color: string }> = {
  fire: { emoji: '🔥', label: 'INFERNO', color: '#FF4500' },
  ice: { emoji: '❄️', label: 'GLACIER', color: '#00D4FF' },
  void: { emoji: '🌀', label: 'VOID', color: '#8B00FF' },
  thunder: { emoji: '⚡', label: 'STORM', color: '#FFD700' },
  nature: { emoji: '🌿', label: 'WILDS', color: '#00FF88' },
};

const ENERGY_META: Record<string, { emoji: string; label: string }> = {
  vortex: { emoji: '🌪️', label: 'VORTEX' },
  sonic: { emoji: '🔊', label: 'SONIC' },
  explode: { emoji: '💥', label: 'EXPLODE' },
  pulse: { emoji: '💓', label: 'PULSE' },
  glitch: { emoji: '👾', label: 'GLITCH' },
};

const LS_KEY_GEMINI = 'aura_gemini_key';
const LS_KEY_OPENAI = 'aura_openai_key';
const LS_KEY_PROVIDER = 'aura_provider';

export function AuraPlayground() {
  const [element, setElement] = useState<string>('fire');
  const [energy, setEnergy] = useState<string>('vortex');
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>(
    () => (localStorage.getItem(LS_KEY_PROVIDER) as AIProvider) || 'gemini',
  );
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem(LS_KEY_GEMINI) || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem(LS_KEY_OPENAI) || '');
  const [auraParams, setAuraParams] = useState<AuraParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AuraGenerationResult | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const promptRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (geminiKey) localStorage.setItem(LS_KEY_GEMINI, geminiKey);
    if (openaiKey) localStorage.setItem(LS_KEY_OPENAI, openaiKey);
    localStorage.setItem(LS_KEY_PROVIDER, provider);
  }, [geminiKey, openaiKey, provider]);

  const activeKey = provider === 'gemini' ? geminiKey : openaiKey;

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && !element) return;
    setLoading(true);
    setLastResult(null);
    setLatency(null);

    const t0 = performance.now();
    const result = await generateAuraParams(
      element,
      energy,
      prompt.trim() || `Pure ${element} energy`,
      activeKey,
      provider,
    );
    const ms = Math.round(performance.now() - t0);
    setLatency(ms);
    setLastResult(result);
    setAuraParams(result.params);
    setLoading(false);
  }, [element, energy, prompt, activeKey, provider]);

  const handleFallback = useCallback(() => {
    const params = getFallbackParams(element);
    setAuraParams(params);
    setLastResult({ params, source: 'fallback' });
    setLatency(null);
  }, [element]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) handleGenerate();
    },
    [handleGenerate, loading],
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AURA PLAYGROUND</h1>
        <p style={styles.subtitle}>Type anything. Watch the aura manifest.</p>
      </div>

      <div style={styles.main}>
        {/* Preview area */}
        <div style={styles.previewArea}>
          <div style={styles.previewBg}>
            {auraParams && (
              <AuraCanvas
                params={auraParams}
                width={400}
                height={500}
                frontOpacity={0.15}
                backZIndex={1}
                frontZIndex={3}
              />
            )}
            <img
              src="/sprites/qbit-default.png"
              alt="Q-bit Character"
              style={styles.qbitImg}
              draggable={false}
            />
            {auraParams && auraParams.auraName && (
              <div style={styles.auraNameOverlay}>
                <div style={styles.auraNameText}>{auraParams.auraName}</div>
              </div>
            )}
            {!auraParams && (
              <div style={styles.placeholder}>
                Generate an aura to see it here
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          {/* AI Provider */}
          <div style={styles.section}>
            <label style={styles.label}>AI Provider</label>
            <div style={styles.providerRow}>
              <button
                onClick={() => setProvider('gemini')}
                style={{
                  ...styles.providerBtn,
                  ...(provider === 'gemini' ? styles.providerActive : {}),
                }}
              >
                <span style={styles.providerIcon}>G</span>
                <span>
                  <strong>Gemini Flash</strong>
                  <br />
                  <span style={styles.providerTag}>FREE</span>
                </span>
              </button>
              <button
                onClick={() => setProvider('openai')}
                style={{
                  ...styles.providerBtn,
                  ...(provider === 'openai' ? styles.providerActiveAlt : {}),
                }}
              >
                <span style={styles.providerIcon}>O</span>
                <span>
                  <strong>GPT-4o-mini</strong>
                  <br />
                  <span style={styles.providerTagPaid}>PAID</span>
                </span>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div style={styles.section}>
            <label style={styles.label}>
              {provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
              {activeKey && <span style={styles.savedBadge}>SAVED</span>}
            </label>
            {provider === 'gemini' ? (
              <>
                <div style={styles.keyRow}>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Paste your AIza... key here"
                    style={{ ...styles.input, flex: 1 }}
                  />
                  {geminiKey && (
                    <button
                      onClick={() => setGeminiKey('')}
                      style={styles.clearBtn}
                      title="Clear key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p style={styles.hint}>
                  Get a free key at{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    aistudio.google.com/apikey
                  </a>
                  {' '}— no credit card needed. 15 req/min, 1M tokens/day free.
                  {geminiKey && ' Key auto-saved to browser.'}
                </p>
              </>
            ) : (
              <>
                <div style={styles.keyRow}>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Paste your sk-... key here"
                    style={{ ...styles.input, flex: 1 }}
                  />
                  {openaiKey && (
                    <button
                      onClick={() => setOpenaiKey('')}
                      style={styles.clearBtn}
                      title="Clear key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p style={styles.hint}>
                  Requires a paid OpenAI account.
                  {openaiKey && ' Key auto-saved to browser.'}
                </p>
              </>
            )}
          </div>

          {/* Element */}
          <div style={styles.section}>
            <label style={styles.label}>Element</label>
            <div style={styles.pillRow}>
              {ELEMENTS.map((el) => (
                <button
                  key={el}
                  onClick={() => setElement(el)}
                  style={{
                    ...styles.pill,
                    borderColor: element === el ? ELEMENT_META[el].color : '#333',
                    background: element === el ? ELEMENT_META[el].color + '22' : 'transparent',
                    color: element === el ? ELEMENT_META[el].color : '#888',
                  }}
                >
                  {ELEMENT_META[el].emoji} {ELEMENT_META[el].label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div style={styles.section}>
            <label style={styles.label}>Energy</label>
            <div style={styles.pillRow}>
              {ENERGIES.map((en) => (
                <button
                  key={en}
                  onClick={() => setEnergy(en)}
                  style={{
                    ...styles.pill,
                    borderColor: energy === en ? '#00ff88' : '#333',
                    background: energy === en ? '#00ff8822' : 'transparent',
                    color: energy === en ? '#00ff88' : '#888',
                  }}
                >
                  {ENERGY_META[en].emoji} {ENERGY_META[en].label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div style={styles.section}>
            <label style={styles.label}>Aura Prompt</label>
            <input
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Pikachu thunder god, Dark void villain, Golden waffle energy..."
              style={styles.input}
              maxLength={100}
            />
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                ...styles.generateBtn,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'GENERATING...' : 'GENERATE AURA'}
            </button>
            <button onClick={handleFallback} style={styles.fallbackBtn}>
              FALLBACK
            </button>
          </div>

          {/* Status */}
          {lastResult?.source === 'fallback' && lastResult.error && (
            <div style={styles.errorBox}>
              <p style={styles.errorTitle}>AI call failed — showing fallback aura</p>
              <p style={styles.errorDetail}>{lastResult.error}</p>
            </div>
          )}
          {lastResult?.source === 'fallback' && !lastResult.error && (
            <p style={styles.fallbackNote}>
              Using element-based fallback. Add an API key above for prompt-aware auras.
            </p>
          )}
          {lastResult?.source === 'ai' && (
            <p style={styles.success}>
              AI aura generated via {provider === 'gemini' ? 'Gemini 2.5 Flash' : 'GPT-4o-mini'}
              {latency ? ` in ${latency}ms` : ''}
            </p>
          )}

          {/* Security note */}
          {activeKey && (
            <p style={styles.securityNote}>
              Your API key is stored in localStorage and sent directly to {provider === 'gemini' ? 'Google' : 'OpenAI'}'s API. 
              It never touches any third-party server. For production, route through a backend proxy.
            </p>
          )}

          {/* Raw params */}
          {auraParams && (
            <details style={styles.details}>
              <summary style={styles.summary}>Raw AuraParams JSON</summary>
              <pre style={styles.pre}>
                {JSON.stringify(auraParams, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e0e0e0',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 4,
    color: '#00ff88',
    margin: 0,
    textShadow: '0 0 20px rgba(0,255,136,0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  main: {
    display: 'flex',
    gap: 32,
    maxWidth: 1000,
    margin: '0 auto',
    alignItems: 'flex-start',
  },
  previewArea: {
    flex: '0 0 420px',
    position: 'sticky' as const,
    top: 24,
  },
  previewBg: {
    position: 'relative' as const,
    width: 400,
    height: 500,
    background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)',
    borderRadius: 16,
    border: '1px solid #1a1a2e',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qbitImg: {
    position: 'relative' as const,
    zIndex: 2,
    width: 120,
    height: 'auto',
    imageRendering: 'auto' as const,
    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))',
    marginTop: 40,
  },
  auraNameOverlay: {
    position: 'absolute' as const,
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    textAlign: 'center' as const,
    pointerEvents: 'none' as const,
  },
  auraNameText: {
    display: 'inline-block',
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#fff',
    textShadow: '0 0 12px rgba(255,255,255,0.6), 0 0 30px rgba(255,200,50,0.4), 0 2px 4px rgba(0,0,0,0.8)',
    padding: '4px 16px',
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
    borderRadius: 6,
  },
  placeholder: {
    position: 'absolute' as const,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center' as const,
    color: '#444',
    fontSize: 13,
    fontStyle: 'italic',
  },
  controls: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: '#666',
  },
  providerRow: {
    display: 'flex',
    gap: 10,
  },
  providerBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#111118',
    border: '1px solid #2a2a35',
    borderRadius: 10,
    color: '#888',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: 12,
    transition: 'all 0.2s',
  },
  providerActive: {
    borderColor: '#4285F4',
    background: '#4285F411',
    color: '#e0e0e0',
  },
  providerActiveAlt: {
    borderColor: '#10a37f',
    background: '#10a37f11',
    color: '#e0e0e0',
  },
  providerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
    flexShrink: 0,
  },
  providerTag: {
    fontSize: 10,
    fontWeight: 700,
    color: '#00cc66',
    letterSpacing: 1,
  },
  providerTagPaid: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ff8800',
    letterSpacing: 1,
  },
  savedBadge: {
    marginLeft: 8,
    fontSize: 9,
    fontWeight: 700,
    color: '#00cc66',
    background: '#00cc6618',
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: 1,
    verticalAlign: 'middle',
  },
  keyRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  clearBtn: {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#666',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  input: {
    background: '#111118',
    border: '1px solid #2a2a35',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: 11,
    color: '#555',
    margin: 0,
    lineHeight: 1.5,
  },
  link: {
    color: '#4285F4',
    textDecoration: 'none',
  },
  pillRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  pill: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid #333',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    transition: 'all 0.2s',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 4,
  },
  generateBtn: {
    flex: 1,
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
    color: '#000',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  fallbackBtn: {
    padding: '12px 20px',
    background: 'transparent',
    color: '#666',
    border: '1px solid #333',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  errorBox: {
    padding: '10px 14px',
    background: '#ff444411',
    border: '1px solid #ff444433',
    borderRadius: 8,
  },
  errorTitle: {
    color: '#ff6666',
    fontSize: 13,
    fontWeight: 700,
    margin: '0 0 4px 0',
  },
  errorDetail: {
    color: '#ff8888',
    fontSize: 11,
    margin: 0,
    wordBreak: 'break-word' as const,
    fontFamily: 'monospace',
    lineHeight: 1.5,
  },
  securityNote: {
    fontSize: 10,
    color: '#444',
    margin: 0,
    padding: '6px 10px',
    background: '#ffffff05',
    borderRadius: 6,
    lineHeight: 1.5,
  },
  fallbackNote: {
    color: '#ffaa00',
    fontSize: 12,
    margin: 0,
    padding: '8px 12px',
    background: '#ffaa0011',
    borderRadius: 8,
  },
  success: {
    color: '#00ff88',
    fontSize: 12,
    margin: 0,
    padding: '8px 12px',
    background: '#00ff8811',
    borderRadius: 8,
  },
  details: {
    marginTop: 4,
  },
  summary: {
    fontSize: 12,
    color: '#555',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  pre: {
    background: '#0d0d14',
    border: '1px solid #1a1a25',
    borderRadius: 8,
    padding: 12,
    fontSize: 10,
    color: '#88ffaa',
    overflow: 'auto',
    maxHeight: 300,
    marginTop: 8,
  },
};
