import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AuraCanvas } from './components/Stage/AuraCanvas';
import { generateAuraParams, getFallbackParams } from './aura-engine/aura-ai';
import type { AIProvider, AuraGenerationResult } from './aura-engine/aura-ai';
import type { AuraParams, EnergyFlowPattern } from './aura-engine/types';

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

const PHYSICS_OPTIONS: Array<{ id: EnergyFlowPattern; label: string; icon: string }> = [
  { id: 'spiral', label: 'Vortex', icon: '🌀' },
  { id: 'rise', label: 'Rise Up', icon: '🔼' },
  { id: 'radial-out', label: 'Explode', icon: '💥' },
  { id: 'radial-in', label: 'Implode', icon: '🕳️' },
  { id: 'cascade', label: 'Flow Down', icon: '🌊' },
  { id: 'pulse', label: 'Pulse', icon: '💓' },
  { id: 'zigzag', label: 'Zig Zag', icon: '⚡' },
  { id: 'wave', label: 'Wave', icon: '〰️' },
];

const LS_KEY_GEMINI = 'aura_gemini_key';
const LS_KEY_OPENAI = 'aura_openai_key';
const LS_KEY_PORTKEY = 'aura_portkey_key';
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
  const [portkeyKey, setPortkeyKey] = useState(() => localStorage.getItem(LS_KEY_PORTKEY) || '');
  const [auraParams, setAuraParams] = useState<AuraParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AuraGenerationResult | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const promptRef = useRef<HTMLInputElement>(null);

  // Live-tweak overrides (null = use AI value)
  const [ovSpeed, setOvSpeed] = useState<number | null>(null);
  const [ovParticleSize, setOvParticleSize] = useState<number | null>(null);
  const [ovPhysics, setOvPhysics] = useState<EnergyFlowPattern | null>(null);
  const [ovNature, setOvNature] = useState<number | null>(null); // 0 = chaos, 100 = calm

  const effectiveParams = useMemo<AuraParams | null>(() => {
    if (!auraParams) return null;
    const p: AuraParams = JSON.parse(JSON.stringify(auraParams));

    if (ovSpeed !== null) {
      p.flameContour.speed = ovSpeed;
      p.energyFlow.speed = ovSpeed;
    }
    if (ovParticleSize !== null) {
      p.particles.size = ovParticleSize;
    }
    if (ovPhysics !== null) {
      p.energyFlow.pattern = ovPhysics;
    }
    if (ovNature !== null) {
      const t = ovNature / 100;
      p.flameContour.smoothness = 0.05 + t * 0.9;
      p.flameContour.jaggedness = 0.9 - t * 0.75;
      p.flameContour.speed = ovSpeed ?? (0.4 + (1.0 - t) * 1.2);
    }

    return p;
  }, [auraParams, ovSpeed, ovParticleSize, ovPhysics, ovNature]);

  useEffect(() => {
    if (geminiKey) {
      localStorage.setItem(LS_KEY_GEMINI, geminiKey);
    } else {
      localStorage.removeItem(LS_KEY_GEMINI);
    }
    if (openaiKey) {
      localStorage.setItem(LS_KEY_OPENAI, openaiKey);
    } else {
      localStorage.removeItem(LS_KEY_OPENAI);
    }
    if (portkeyKey) {
      localStorage.setItem(LS_KEY_PORTKEY, portkeyKey);
    } else {
      localStorage.removeItem(LS_KEY_PORTKEY);
    }
    localStorage.setItem(LS_KEY_PROVIDER, provider);
  }, [geminiKey, openaiKey, portkeyKey, provider]);

  const activeKey = provider === 'portkey' ? portkeyKey : provider === 'gemini' ? geminiKey : openaiKey;

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
            {effectiveParams && (
              <AuraCanvas
                params={effectiveParams}
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
            {effectiveParams && effectiveParams.auraName && (
              <div style={styles.auraNameOverlay}>
                <div style={styles.auraNameText}>{effectiveParams.auraName}</div>
              </div>
            )}
            {!effectiveParams && (
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
                onClick={() => setProvider('portkey')}
                style={{
                  ...styles.providerBtn,
                  ...(provider === 'portkey' ? { ...styles.providerActive, borderColor: '#A855F7' } : {}),
                }}
              >
                <span style={styles.providerIcon}>P</span>
                <span>
                  <strong>Portkey</strong>
                  <br />
                  <span style={{ ...styles.providerTag, background: '#7C3AED33', color: '#A855F7' }}>GEMINI 3</span>
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
              {provider === 'portkey' ? 'Portkey API Key' : provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
              {activeKey && <span style={styles.savedBadge}>SAVED</span>}
            </label>
            {provider === 'portkey' ? (
              <>
                <div style={styles.keyRow}>
                  <input
                    type="password"
                    value={portkeyKey}
                    onChange={(e) => setPortkeyKey(e.target.value)}
                    placeholder="Paste your Portkey API key here"
                    style={{ ...styles.input, flex: 1 }}
                  />
                  {portkeyKey && (
                    <button
                      onClick={() => setPortkeyKey('')}
                      style={styles.clearBtn}
                      title="Clear key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {portkeyKey && (
                  <div style={{ marginTop: 4, marginBottom: 4 }}>
                    <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
                      Key: {portkeyKey.slice(0, 8)}...{portkeyKey.slice(-4)}
                    </span>
                  </div>
                )}
                <p style={styles.hint}>
                  Uses Gemini 3 Flash via Portkey gateway. Unlimited rate limits.
                  {portkeyKey && ' Key auto-saved to browser.'}
                </p>
              </>
            ) : provider === 'gemini' ? (
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

                {geminiKey && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 }}>
                    <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
                      Key: {geminiKey.slice(0, 10)}...{geminiKey.slice(-4)}
                    </span>
                    <button
                      onClick={async () => {
                        let msg = '';
                        try {
                          // Step 1: list models (no quota cost) to verify key is valid
                          const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`;
                          const listRes = await fetch(listUrl);
                          if (!listRes.ok) {
                            const t = await listRes.text();
                            alert('KEY INVALID (HTTP ' + listRes.status + ')\n' + t.slice(0, 300));
                            return;
                          }
                          const listData = await listRes.json();
                          const modelNames = (listData.models || []).map((m: any) => m.name).filter((n: string) => n.includes('flash'));
                          msg += 'KEY VALID! Found ' + modelNames.length + ' flash models:\n' + modelNames.slice(0, 6).join('\n') + '\n\n';

                          // Step 2: try smallest possible generation
                          const model = modelNames.find((n: string) => n.includes('2.5-flash')) || modelNames.find((n: string) => n.includes('2.0-flash')) || modelNames[0];
                          if (!model) { alert(msg + 'No flash models available!'); return; }
                          const shortName = model.replace('models/', '');
                          const genUrl = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
                          const genRes = await fetch(genUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with just the word OK' }] }], generationConfig: { maxOutputTokens: 5 } }),
                          });
                          if (genRes.ok) {
                            msg += 'GENERATION OK with ' + shortName + '!';
                          } else {
                            const t = await genRes.text();
                            msg += 'Generation FAILED on ' + shortName + ' (HTTP ' + genRes.status + '):\n' + t.slice(0, 200);
                          }
                        } catch (e: any) {
                          msg += 'Network error: ' + e.message;
                        }
                        alert(msg);
                      }}
                      style={{ ...styles.clearBtn, fontSize: 11, padding: '3px 8px', color: '#4fc3f7' }}
                    >
                      Test Key
                    </button>
                  </div>
                )}
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

          {/* Element + Energy row */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ ...styles.section, flex: 1 }}>
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
                      padding: '4px 10px',
                      fontSize: 11,
                    }}
                  >
                    {ELEMENT_META[el].emoji} {ELEMENT_META[el].label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ ...styles.section, flex: 1 }}>
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
                      padding: '4px 10px',
                      fontSize: 11,
                    }}
                  >
                    {ENERGY_META[en].emoji} {ENERGY_META[en].label}
                  </button>
                ))}
              </div>
            </div>
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

          {/* ── Live Tweak Controls ─────────────────────────── */}
          {auraParams && (
            <>
              <div style={styles.tweakDivider}>
                <span style={styles.tweakDividerText}>TWEAK</span>
              </div>

              {/* Physics */}
              <div style={styles.section}>
                <label style={styles.label}>Physics</label>
                <div style={styles.pillRow}>
                  {PHYSICS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setOvPhysics(ovPhysics === opt.id ? null : opt.id)}
                      style={{
                        ...styles.physicsPill,
                        borderColor: (ovPhysics ?? auraParams.energyFlow.pattern) === opt.id ? '#A855F7' : '#2a2a35',
                        background: (ovPhysics ?? auraParams.energyFlow.pattern) === opt.id ? '#A855F722' : '#111118',
                        color: (ovPhysics ?? auraParams.energyFlow.pattern) === opt.id ? '#D8B4FE' : '#666',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aura Nature slider */}
              <div style={styles.section}>
                <label style={styles.label}>Aura Nature</label>
                <div style={styles.sliderRow}>
                  <span style={styles.sliderLabel}>CHAOS</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ovNature ?? Math.round((auraParams.flameContour.smoothness) * 100)}
                    onChange={(e) => setOvNature(Number(e.target.value))}
                    style={styles.slider}
                  />
                  <span style={styles.sliderLabel}>CALM</span>
                </div>
              </div>

              {/* Aura Speed slider */}
              <div style={styles.section}>
                <label style={styles.label}>
                  Aura Speed
                  <span style={styles.sliderValue}>
                    {(ovSpeed ?? auraParams.flameContour.speed).toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={Math.round((ovSpeed ?? auraParams.flameContour.speed) * 100)}
                  onChange={(e) => setOvSpeed(Number(e.target.value) / 100)}
                  style={styles.slider}
                />
              </div>

              {/* Particle Size slider */}
              <div style={styles.section}>
                <label style={styles.label}>
                  Particle Size
                  <span style={styles.sliderValue}>
                    {(ovParticleSize ?? auraParams.particles.size).toFixed(1)}
                  </span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={Math.round((ovParticleSize ?? auraParams.particles.size) * 10)}
                  onChange={(e) => setOvParticleSize(Number(e.target.value) / 10)}
                  style={styles.slider}
                />
              </div>

              {/* Reset overrides */}
              <button
                onClick={() => { setOvSpeed(null); setOvParticleSize(null); setOvPhysics(null); setOvNature(null); }}
                style={styles.resetBtn}
              >
                Reset Tweaks
              </button>
            </>
          )}

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
              AI aura generated via {provider === 'portkey' ? 'Gemini 3 Flash (Portkey)' : provider === 'gemini' ? 'Gemini 2.5 Flash' : 'GPT-4o-mini'}
              {latency ? ` in ${latency}ms` : ''}
            </p>
          )}

          {/* Security note */}
          {activeKey && (
            <p style={styles.securityNote}>
              Your API key is stored in localStorage and sent directly to {provider === 'portkey' ? 'Portkey' : provider === 'gemini' ? 'Google' : 'OpenAI'}'s API. 
              It never touches any third-party server. For production, route through a backend proxy.
            </p>
          )}

          {/* Raw params */}
          {effectiveParams && (
            <details style={styles.details}>
              <summary style={styles.summary}>Raw AuraParams JSON</summary>
              <pre style={styles.pre}>
                {JSON.stringify(effectiveParams, null, 2)}
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
  tweakDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '4px 0',
  },
  tweakDividerText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 3,
    color: '#A855F7',
    whiteSpace: 'nowrap' as const,
  },
  physicsPill: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    padding: '6px 10px',
    borderRadius: 10,
    border: '1px solid #2a2a35',
    background: '#111118',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    transition: 'all 0.15s',
    minWidth: 54,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  sliderLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#555',
    minWidth: 40,
  },
  sliderValue: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: 400,
    color: '#888',
    letterSpacing: 0,
    textTransform: 'none' as const,
  },
  slider: {
    flex: 1,
    height: 4,
    WebkitAppearance: 'none' as any,
    appearance: 'none' as any,
    background: '#2a2a35',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#A855F7',
  },
  resetBtn: {
    padding: '6px 16px',
    background: 'transparent',
    border: '1px solid #2a2a35',
    borderRadius: 8,
    color: '#555',
    fontSize: 11,
    cursor: 'pointer',
    alignSelf: 'flex-start' as const,
    transition: 'all 0.15s',
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
