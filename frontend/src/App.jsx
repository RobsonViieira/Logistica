// ============================================================
// SLR v3.0 — Dark Industrial UI
// Design: fundo #080C14, acento ciano, JetBrains Mono
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://guiorobson.mooo.com/slr/api";

// ── Tokens ───────────────────────────────────────────────────
const C = {
  bg:      "#080C14",
  surface: "#0F1923",
  border:  "#1A2B3C",
  cyan:    "#00D4FF",
  orange:  "#FF6B35",
  green:   "#22C55E",
  red:     "#EF4444",
  yellow:  "#FBBF24",
  text:    "#C8D8E8",
  muted:   "#5A7A94",
  white:   "#F0F8FF",
};

// ── Hook API ─────────────────────────────────────────────────
function useApi(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(API_URL + endpoint);
      if (!r.ok) throw new Error("HTTP " + r.status);
      setData(await r.json());
      setError(null);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { fetch_(); }, deps);
  return { data, loading, error, refetch: fetch_ };
}

async function api(method, endpoint, body = null) {
  const r = await fetch(API_URL + endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail || "Erro");
  return d;
}

// ── Componentes base ──────────────────────────────────────────
function Mono({ children, size = 13, color = C.cyan, weight = 700 }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size, color, fontWeight: weight }}>
      {children}
    </span>
  );
}

function Tag({ children, color = C.cyan }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 4, fontSize: 9, fontWeight: 800, padding: "2px 7px",
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: "uppercase"
    }}>{children}</span>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${glow ? C.cyan + "50" : C.border}`,
      borderRadius: 12, padding: 16,
      boxShadow: glow ? `0 0 20px ${C.cyan}15` : "none",
      ...style
    }}>{children}</div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        width: 28, height: 28, border: `2px solid ${C.border}`,
        borderTopColor: C.cyan, borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); });
  const color = type === "ok" ? C.green : C.red;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, background: C.surface, border: `1px solid ${color}`,
      color: C.text, padding: "12px 20px", borderRadius: 10, fontSize: 13,
      fontWeight: 600, boxShadow: `0 8px 32px rgba(0,0,0,.5)`,
      display: "flex", alignItems: "center", gap: 10, maxWidth: 320,
      animation: "slideDown 0.2s ease"
    }}>
      <span style={{ color, fontSize: 16 }}>{type === "ok" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

function BarH({ value, max, color = C.cyan }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const c = pct <= 30 ? C.red : pct <= 70 ? C.yellow : C.green;
  return (
    <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: pct + "%", background: c, borderRadius: 2, transition: "width .6s ease" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN — Terminal PIN
// ══════════════════════════════════════════════════════════════
const OPERADORES = [
  { id: 1, nome: "João P.",   cargo: "Almoxarife",  pin: "1234", sigla: "JP" },
  { id: 2, nome: "Maria S.",  cargo: "Supervisora", pin: "5678", sigla: "MS" },
  { id: 3, nome: "Carlos M.", cargo: "Operador",    pin: "9012", sigla: "CM" },
];

function Login({ onLogin }) {
  const [op, setOp] = useState(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);
  const [shake, setShake] = useState(false);

  const digitar = (d) => {
    if (pin.length >= 4) return;
    const n = pin + d;
    setPin(n);
    if (n.length === 4) {
      if (op.pin === n) { onLogin(op); }
      else {
        setShake(true); setErro(true);
        setTimeout(() => { setPin(""); setShake(false); setErro(false); }, 700);
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", padding: 24
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;500;600;700;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes slideDown { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes scanline { 0%{top:5%} 50%{top:90%} 100%{top:5%} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px #00D4FF30} 50%{box-shadow:0 0 24px #00D4FF60} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080C14; }
        ::-webkit-scrollbar-thumb { background: #1A2B3C; border-radius: 2px; }
        input, textarea { font-size: 16px !important; }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 3, height: 40, background: `linear-gradient(180deg, ${C.cyan}, transparent)` }} />
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 800, color: C.white, letterSpacing: -2, lineHeight: 1 }}>SLR</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>LOGÍSTICA ROVIE</div>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.green + "15", border: `1px solid ${C.green}30`, borderRadius: 20, padding: "4px 12px" }}>
          <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: C.green, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>SISTEMA ONLINE</span>
        </div>
      </div>

      {!op ? (
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 20, fontFamily: "'JetBrains Mono', monospace" }}>
            — Identificação do Operador —
          </div>
          {OPERADORES.map(o => (
            <button key={o.id} onClick={() => setOp(o)} style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "14px 18px", marginBottom: 10, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14, transition: "all .2s",
              color: C.text
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.boxShadow = `0 0 16px ${C.cyan}20`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: C.cyan + "20",
                border: `1px solid ${C.cyan}40`, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: C.cyan
              }}>{o.sigla}</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>{o.nome}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{o.cargo}</div>
              </div>
              <span style={{ marginLeft: "auto", color: C.muted, fontSize: 18 }}>›</span>
            </button>
          ))}
          <button onClick={() => onLogin({ id: 0, nome: "Demo", cargo: "Visitante", sigla: "DM", pin: "0000" })}
            style={{ width: "100%", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 10, padding: "12px", cursor: "pointer", color: C.muted, fontSize: 12, marginTop: 4 }}>
            Entrar como visitante
          </button>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 280, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, background: C.cyan + "20",
              border: `1px solid ${C.cyan}40`, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: C.cyan
            }}>{op.sigla}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: C.white, fontWeight: 700 }}>{op.nome}</div>
              <div style={{ color: C.muted, fontSize: 12 }}>{op.cargo}</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 28, animation: shake ? "shake .4s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: "50%",
                background: pin.length > i ? C.cyan : "transparent",
                border: `2px solid ${pin.length > i ? C.cyan : C.border}`,
                boxShadow: pin.length > i ? `0 0 8px ${C.cyan}80` : "none",
                transition: "all .2s"
              }} />
            ))}
          </div>

          {erro && <div style={{ color: C.red, fontSize: 11, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>// PIN INCORRETO</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
              <button key={i} onClick={() => d === "⌫" ? setPin(p => p.slice(0,-1)) : d !== "" && digitar(String(d))} style={{
                padding: "16px 0", background: d === "" ? "transparent" : C.surface,
                border: `1px solid ${d === "" ? "transparent" : C.border}`,
                borderRadius: 10, color: C.text, fontSize: 18,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                cursor: d === "" ? "default" : "pointer", visibility: d === "" ? "hidden" : "visible",
                transition: "all .1s"
              }}
                onMouseEnter={e => { if (d !== "") { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
              >{d}</button>
            ))}
          </div>

          <button onClick={() => setOp(null)} style={{ marginTop: 20, background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>
            ← Trocar operador
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({ operador }) {
  const { data, loading, refetch } = useApi("/dashboard/", []);

  const KpiCard = ({ icon, val, label, sub, color }) => (
    <div style={{
      background: C.surface, border: `1px solid ${color}30`,
      borderRadius: 12, padding: "16px 14px", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 800, color: C.white, lineHeight: 1 }}>{val ?? "—"}</div>
      <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .3s ease" }}>
      {/* Boas vindas */}
      <div style={{
        background: `linear-gradient(135deg, ${C.surface}, ${C.bg})`,
        border: `1px solid ${C.cyan}30`, borderRadius: 12, padding: 18,
        boxShadow: `0 0 24px ${C.cyan}10`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              // operador autenticado
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>
              Olá, {operador.nome.split(" ")[0]}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {data?.alertas_estoque > 0 && (
              <Tag color={C.orange}>⚡ {data.alertas_estoque} alertas</Tag>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <KpiCard icon="📦" val={data?.total_produtos} label="Produtos" sub="cadastrados" color={C.cyan} />
        <KpiCard icon="⚠" val={data?.alertas_estoque} label="Alertas" sub="abaixo do mín." color={C.orange} />
        <KpiCard icon="↕" val={data?.total_movimentacoes} label="Movimentações" sub="registradas" color={C.green} />
        <KpiCard icon="📋" val={data?.ordens_pendentes} label="OS Pendentes" sub="aguardando" color={C.yellow} />
      </div>

      {/* Itens críticos */}
      {data?.itens_criticos?.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: C.orange, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span>⚡</span> Itens Críticos
            </div>
            <Tag color={C.orange}>{data.itens_criticos.length} alertas</Tag>
          </div>
          {data.itens_criticos.map((it, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${C.border}`
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{it.produto_nome}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                  {it.produto_codigo} · {it.localizacao || "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Mono size={18} color={C.red} weight={800}>{it.quantidade}</Mono>
                <div style={{ fontSize: 9, color: C.muted }}>{it.unidade} · mín {it.estoque_minimo}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Últimas movimentações */}
      <Card>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.cyan }}>▶</span> Movimentações Recentes
        </div>
        {data?.ultimas_movimentacoes?.length > 0 ? data.ultimas_movimentacoes.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: m.tipo === "entrada" ? C.green + "20" : C.red + "20",
                border: `1px solid ${m.tipo === "entrada" ? C.green : C.red}40`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12
              }}>
                {m.tipo === "entrada" ? "↓" : "↑"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.white, textTransform: "capitalize" }}>{m.tipo}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>ID #{m.produto_id}</div>
              </div>
            </div>
            <Mono size={16} color={m.tipo === "entrada" ? C.green : C.red} weight={800}>
              {m.tipo === "entrada" ? "+" : "-"}{m.quantidade}
            </Mono>
          </div>
        )) : <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Nenhuma movimentação ainda</div>}
      </Card>

      <button onClick={refetch} style={{
        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "12px", color: C.muted, cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
        transition: "all .2s"
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
      >
        // atualizar dados
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COLETOR — Com scanner animado
// ══════════════════════════════════════════════════════════════
function Coletor({ operador, showToast }) {
  const [scanning, setScanning] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [produto, setProduto] = useState(null);
  const [tipo, setTipo] = useState("entrada");
  const [qtd, setQtd] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);

  const buscar = async (cod) => {
    const c = (cod || codigo).toUpperCase().trim();
    if (!c) return;
    try {
      const d = await api("GET", `/produtos/${c}`);
      setProduto(d); setCodigo(c);
    } catch { showToast("Produto não encontrado: " + c, "err"); setProduto(null); }
  };

  const confirmar = async () => {
    if (!produto || !qtd || parseFloat(qtd) <= 0) { showToast("Preencha todos os campos", "err"); return; }
    setLoading(true);
    try {
      await api("POST", "/movimentacoes/", {
        produto_id: produto.id, tipo, quantidade: parseFloat(qtd),
        referencia: ref || null, operador: operador.nome
      });
      showToast(`${tipo === "entrada" ? "Entrada" : "Saída"} registrada!`, "ok");
      setCodigo(""); setProduto(null); setQtd(""); setRef("");
    } catch(e) { showToast(e.message, "err"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn .3s ease" }}>
      {/* Header */}
      <div style={{
        background: C.surface, border: `1px solid ${C.cyan}30`, borderRadius: 12,
        padding: 18, position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.cyan, letterSpacing: 2, marginBottom: 6 }}>COLETOR ATIVO</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>Terminal de Coleta</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          Op: <span style={{ color: C.cyan }}>{operador.nome}</span> · {operador.cargo}
        </div>
      </div>

      {/* Tipo entrada/saída */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {["entrada", "saida"].map(t => (
          <button key={t} onClick={() => setTipo(t)} style={{
            padding: "14px", borderRadius: 10, border: `1px solid ${tipo === t ? (t === "entrada" ? C.green : C.red) : C.border}`,
            background: tipo === t ? (t === "entrada" ? C.green + "15" : C.red + "15") : "transparent",
            color: tipo === t ? (t === "entrada" ? C.green : C.red) : C.muted,
            fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s",
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {t === "entrada" ? "↓ ENTRADA" : "↑ SAÍDA"}
          </button>
        ))}
      </div>

      {/* Scanner + input */}
      <Card glow={scanning}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 8 }}>
          // código do produto
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && buscar()}
            placeholder="CAB001"
            style={{
              flex: 1, background: C.bg, border: `1px solid ${scanning ? C.cyan : C.border}`,
              borderRadius: 8, padding: "12px 14px", color: C.white, fontSize: 16,
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, outline: "none",
              letterSpacing: 2, transition: "all .2s"
            }}
          />
          <button onClick={() => setScanning(!scanning)} style={{
            padding: "12px 14px", background: scanning ? C.cyan + "20" : C.surface,
            border: `1px solid ${scanning ? C.cyan : C.border}`, borderRadius: 8,
            cursor: "pointer", fontSize: 18, color: scanning ? C.cyan : C.muted,
            transition: "all .2s"
          }}>📷</button>
          <button onClick={() => buscar()} style={{
            padding: "12px 18px", background: C.cyan + "20",
            border: `1px solid ${C.cyan}50`, borderRadius: 8,
            cursor: "pointer", color: C.cyan, fontWeight: 700, fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace", transition: "all .2s"
          }}>SCAN</button>
        </div>

        {/* Linha de scan animada quando ativo */}
        {scanning && (
          <div style={{ position: "relative", height: 60, marginTop: 12, background: C.bg, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.cyan}30` }}>
            <div style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
              boxShadow: `0 0 12px ${C.cyan}`,
              animation: "scanline 1.5s ease-in-out infinite", top: "50%"
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
              AGUARDANDO QR CODE...
            </div>
          </div>
        )}

        {/* Atalhos rápidos */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {["CAB001","ROL001","EPI001","OLE001","FUS001"].map(c => (
            <button key={c} onClick={() => buscar(c)} style={{
              fontSize: 9, padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`,
              background: "transparent", cursor: "pointer", color: C.muted,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
              transition: "all .15s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >{c}</button>
          ))}
        </div>
      </Card>

      {/* Produto encontrado */}
      {produto && (
        <>
          <Card style={{ border: `1px solid ${C.cyan}40`, boxShadow: `0 0 20px ${C.cyan}10`, animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.cyan, letterSpacing: 1, marginBottom: 6 }}>
                  // produto localizado
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{produto.nome}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  {produto.codigo} · {produto.unidade} · {produto.categoria}
                </div>
              </div>
              <button onClick={() => setProduto(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18 }}>✕</button>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 8 }}>
              // quantidade ({produto.unidade})
            </div>
            <input
              type="number" value={qtd} onChange={e => setQtd(e.target.value)}
              placeholder="0" min="0.01" step="0.01"
              style={{
                display: "block", width: "100%", background: "transparent", border: "none", outline: "none",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 800,
                color: tipo === "entrada" ? C.green : C.red, textAlign: "center",
                padding: "8px 0"
              }}
            />
            <BarH value={parseFloat(qtd) || 0} max={produto.estoque_minimo * 3 || 100} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Card>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 6 }}>// referência</div>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder="NF, OS..."
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, fontWeight: 600, boxSizing: "border-box" }} />
            </Card>
            <Card>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 6 }}>// operador</div>
              <div style={{ color: C.cyan, fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{operador.nome}</div>
            </Card>
          </div>

          <button onClick={confirmar} disabled={loading} style={{
            padding: 16, borderRadius: 12, border: `1px solid ${tipo === "entrada" ? C.green : C.red}`,
            background: tipo === "entrada" ? C.green + "20" : C.red + "20",
            color: tipo === "entrada" ? C.green : C.red,
            fontWeight: 800, fontSize: 15, cursor: loading ? "default" : "pointer",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
            opacity: loading ? .6 : 1, transition: "all .2s",
            boxShadow: `0 0 20px ${tipo === "entrada" ? C.green : C.red}20`
          }}>
            {loading ? "// processando..." : `// CONFIRMAR ${tipo.toUpperCase()}`}
          </button>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ESTOQUE
// ══════════════════════════════════════════════════════════════
function Estoque({ showToast }) {
  const { data, loading, refetch } = useApi("/estoque/", []);
  const [busca, setBusca] = useState("");
  const [soAlerta, setSoAlerta] = useState(false);

  const filtrado = (data || []).filter(p => {
    const m = p.produto_nome?.toLowerCase().includes(busca.toLowerCase()) || p.produto_codigo?.includes(busca.toUpperCase());
    return m && (!soAlerta || p.alerta);
  });

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn .3s ease" }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="// buscar produto..."
          style={{
            flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "10px 14px", color: C.text, fontSize: 13, outline: "none",
            fontFamily: "'JetBrains Mono', monospace"
          }}
          onFocus={e => e.currentTarget.style.borderColor = C.cyan}
          onBlur={e => e.currentTarget.style.borderColor = C.border}
        />
        <button onClick={() => setSoAlerta(!soAlerta)} style={{
          padding: "10px 14px", borderRadius: 8, border: `1px solid ${soAlerta ? C.orange : C.border}`,
          background: soAlerta ? C.orange + "20" : "transparent", color: soAlerta ? C.orange : C.muted,
          cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", transition: "all .2s"
        }}>⚡</button>
        <button onClick={refetch} style={{
          padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: "transparent", color: C.muted, cursor: "pointer", fontSize: 14, transition: "all .2s"
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >↺</button>
      </div>

      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono', monospace", padding: "0 2px" }}>
        // {filtrado.length} produtos · {filtrado.filter(p => p.alerta).length} em alerta
      </div>

      {filtrado.length === 0 ? (
        <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 13 }}>Nenhum produto encontrado</div>
      ) : filtrado.map(p => (
        <div key={p.produto_id} style={{
          background: C.surface, border: `1px solid ${p.alerta ? C.orange + "50" : C.border}`,
          borderRadius: 10, padding: 14, transition: "all .2s",
          boxShadow: p.alerta ? `0 0 12px ${C.orange}10` : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {p.alerta && <span style={{ color: C.orange, fontSize: 12 }}>⚡</span>}
                <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{p.produto_nome}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.muted }}>
                {p.produto_codigo} {p.localizacao ? `· 📍 ${p.localizacao}` : ""}
              </div>
              {p.categoria && <Tag color={C.cyan} style={{ marginTop: 6 }}>{p.categoria}</Tag>}
            </div>
            <div style={{ textAlign: "right", marginLeft: 12 }}>
              <Mono size={22} color={p.alerta ? C.red : C.white} weight={800}>{p.quantidade}</Mono>
              <div style={{ fontSize: 10, color: C.muted }}>{p.unidade}</div>
              {p.estoque_minimo > 0 && <div style={{ fontSize: 9, color: C.muted }}>mín {p.estoque_minimo}</div>}
            </div>
          </div>
          {p.estoque_minimo > 0 && <BarH value={p.quantidade} max={p.estoque_minimo * 2} />}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ORDENS
// ══════════════════════════════════════════════════════════════
function Ordens({ showToast }) {
  const { data, loading, refetch } = useApi("/ordens/", []);
  const [filtro, setFiltro] = useState("todos");
  const [aberta, setAberta] = useState(null);
  const [otimizando, setOtimizando] = useState(null);
  const [rota, setRota] = useState({});

  const statusColor = { pendente: C.yellow, em_andamento: C.cyan, concluida: C.green, cancelada: C.muted };
  const prioColor   = { urgente: C.red, alta: C.orange, normal: C.cyan, baixa: C.muted };

  const filtradas = (data || []).filter(o => filtro === "todos" || o.status === filtro);

  const mudarStatus = async (id, status) => {
    try {
      await api("PATCH", `/ordens/${id}/status?status=${status}`);
      showToast("Status atualizado!", "ok"); refetch();
    } catch(e) { showToast(e.message, "err"); }
  };

  const otimizarRota = async (id) => {
    setOtimizando(id);
    try {
      const r = await api("POST", "/picking/otimizar", { ordem_id: id });
      setRota(prev => ({ ...prev, [id]: r }));
      showToast(`Rota otimizada! ${r.distancia_total_m}m · ${r.num_itens} itens`, "ok");
    } catch(e) {
      showToast("Picking Agent: " + e.message, "err");
    } finally { setOtimizando(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {["todos","pendente","em_andamento","concluida"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 12px", borderRadius: 20, border: `1px solid ${filtro === f ? C.cyan : C.border}`,
            background: filtro === f ? C.cyan + "20" : "transparent", color: filtro === f ? C.cyan : C.muted,
            cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 1, whiteSpace: "nowrap", transition: "all .2s"
          }}>
            {f === "todos" ? "TODAS" : f.replace("_"," ").toUpperCase()}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 13 }}>Nenhuma ordem encontrada</div>
      ) : filtradas.map(o => (
        <div key={o.id} style={{
          background: C.surface,
          border: `1px solid ${aberta === o.id ? C.cyan + "50" : C.border}`,
          borderRadius: 10, overflow: "hidden", transition: "all .2s"
        }}>
          <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setAberta(aberta === o.id ? null : o.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
                  <Mono size={12} color={C.muted} weight={400}>OS #</Mono>
                  <Mono size={14} color={C.white} weight={800}>{o.id}</Mono>
                  <Tag color={statusColor[o.status]}>{o.status.replace("_"," ")}</Tag>
                  <Tag color={prioColor[o.prioridade]}>{o.prioridade}</Tag>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{o.tipo.replace("_"," ")} · {o.cliente_fornecedor || "—"}</div>
              </div>
              <span style={{ color: C.muted, fontSize: 16, transition: "transform .2s", transform: aberta === o.id ? "rotate(180deg)" : "none" }}>▾</span>
            </div>
          </div>

          {aberta === o.id && (
            <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              {o.observacao && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, padding: "8px 12px", background: C.bg, borderRadius: 6, borderLeft: `2px solid ${C.cyan}` }}>
                  {o.observacao}
                </div>
              )}

              {o.itens?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 8 }}>// itens da ordem</div>
                  {o.itens.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <Mono size={12} color={C.cyan} weight={400}>PROD #{it.produto_id}</Mono>
                      <Mono size={12} color={C.white} weight={700}>{it.quantidade_solicitada} un</Mono>
                    </div>
                  ))}
                </div>
              )}

              {/* Picking Agent */}
              {o.status !== "concluida" && o.status !== "cancelada" && (
                <button onClick={() => otimizarRota(o.id)} disabled={otimizando === o.id} style={{
                  width: "100%", padding: "10px", marginBottom: 10, borderRadius: 8,
                  border: `1px solid ${C.cyan}50`, background: C.cyan + "10",
                  color: C.cyan, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 1, opacity: otimizando === o.id ? .6 : 1
                }}>
                  {otimizando === o.id ? "// otimizando rota..." : "⚡ ARIA PICKING — OTIMIZAR ROTA"}
                </button>
              )}

              {/* Resultado da rota */}
              {rota[o.id] && (
                <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${C.green}30` }}>
                  <div style={{ fontSize: 9, color: C.green, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 8 }}>// rota otimizada</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div style={{ textAlign: "center" }}>
                      <Mono size={20} color={C.green} weight={800}>{rota[o.id].distancia_total_m}m</Mono>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>distância total</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Mono size={20} color={C.cyan} weight={800}>{rota[o.id].num_itens}</Mono>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>itens na rota</div>
                    </div>
                  </div>
                  {rota[o.id].rota?.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                      <Mono size={10} color={C.muted} weight={400}>{String(i+1).padStart(2,"0")}</Mono>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.white }}>{item.nome}</div>
                        <Mono size={9} color={C.cyan} weight={400}>{item.localizacao}</Mono>
                      </div>
                      <Mono size={11} color={C.green} weight={700}>{item.quantidade} {item.unidade}</Mono>
                    </div>
                  ))}
                </div>
              )}

              {o.status === "pendente" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button onClick={() => { mudarStatus(o.id, "em_andamento"); }}
                    style={{ padding: "10px", borderRadius: 8, border: `1px solid ${C.cyan}50`, background: C.cyan + "15", color: C.cyan, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                    ▶ INICIAR
                  </button>
                  <button onClick={() => mudarStatus(o.id, "cancelada")}
                    style={{ padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                    ✕ CANCELAR
                  </button>
                </div>
              )}
              {o.status === "em_andamento" && (
                <button onClick={() => mudarStatus(o.id, "concluida")}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.green}50`, background: C.green + "15", color: C.green, cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                  ✓ CONCLUIR OS
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ARIA
// ══════════════════════════════════════════════════════════════
function ARIA() {
  const [msgs, setMsgs] = useState([{
    role: "aria",
    text: "Sistema online. Sou a **ARIA** — Assistente de Inteligência em Almoxarifado.\n\nDetectei itens críticos no estoque. Como posso ajudar?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const quick = ["Quais itens repor?", "Resumo do estoque", "Ordens pendentes", "Itens críticos", "Sugira reposição"];

  const enviar = async (q) => {
    const p = q || input.trim();
    if (!p || loading) return;
    setInput(""); setMsgs(m => [...m, { role: "user", text: p }]); setLoading(true);
    try {
      const d = await api("POST", "/ia/consulta", { pergunta: p });
      setMsgs(m => [...m, { role: "aria", text: d.resposta }]);
    } catch(e) {
      setMsgs(m => [...m, { role: "aria", text: "Erro ao consultar ARIA: " + e.message }]);
    } finally { setLoading(false); }
  };

  const sugerirReposicao = async () => {
    setLoading(true);
    try {
      const d = await api("POST", "/ia/sugerir-reposicao");
      setMsgs(m => [...m, { role: "user", text: "Analise e sugira reposição" }, { role: "aria", text: d.sugestoes }]);
    } catch(e) { setMsgs(m => [...m, { role: "aria", text: "Erro: " + e.message }]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn .3s ease", height: "100%" }}>
      {/* Header ARIA */}
      <div style={{
        background: C.surface, border: `1px solid #7C3AED40`, borderRadius: 12, padding: 16,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #7C3AED, transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#7C3AED20",
            border: "1px solid #7C3AED40", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 20
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: C.white }}>ARIA</div>
            <div style={{ fontSize: 10, color: "#7C3AED", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>IA LOGÍSTICA · ANTHROPIC</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, color: C.green, fontFamily: "'JetBrains Mono', monospace" }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12,
        minHeight: 220, maxHeight: 360, padding: "4px 0"
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .2s ease" }}>
            <div style={{
              maxWidth: "88%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: m.role === "user" ? C.cyan + "20" : C.surface,
              border: `1px solid ${m.role === "user" ? C.cyan + "40" : C.border}`,
              fontSize: 12, lineHeight: 1.7, color: C.text, whiteSpace: "pre-line"
            }}>
              {m.role === "aria" && (
                <div style={{ fontSize: 9, color: "#7C3AED", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 6 }}>ARIA</div>
              )}
              {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 6, padding: "10px 14px", background: C.surface, borderRadius: "12px 12px 12px 4px", width: 70, border: `1px solid ${C.border}` }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, background: "#7C3AED", borderRadius: "50%", animation: `pulse ${0.6 + i * 0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Ações rápidas */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {quick.map(q => (
          <button key={q} onClick={() => enviar(q)} style={{
            fontSize: 9, padding: "5px 10px", borderRadius: 20,
            border: "1px solid #7C3AED40", background: "#7C3AED10", color: "#7C3AED",
            cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: .5,
            transition: "all .15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#7C3AED25"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#7C3AED10"; }}
          >{q}</button>
        ))}
        <button onClick={sugerirReposicao} style={{
          fontSize: 9, padding: "5px 10px", borderRadius: 20,
          border: `1px solid ${C.orange}40`, background: C.orange + "10", color: C.orange,
          cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: .5
        }}>📊 Análise Completa</button>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviar()}
          placeholder="// perguntar para a ARIA..."
          style={{
            flex: 1, background: C.surface, border: "1px solid #7C3AED40",
            borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 13,
            outline: "none", fontFamily: "'JetBrains Mono', monospace"
          }}
          onFocus={e => e.currentTarget.style.borderColor = "#7C3AED"}
          onBlur={e => e.currentTarget.style.borderColor = "#7C3AED40"}
        />
        <button onClick={() => enviar()} disabled={!input.trim() || loading} style={{
          padding: "12px 16px", background: "#7C3AED20", border: "1px solid #7C3AED50",
          borderRadius: 10, cursor: "pointer", color: "#7C3AED", fontWeight: 700,
          fontSize: 16, opacity: !input.trim() || loading ? .4 : 1, transition: "all .2s"
        }}>➤</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CADASTRO
// ══════════════════════════════════════════════════════════════
function Cadastro({ showToast, onSalvo }) {
  const [form, setForm] = useState({ codigo: "", nome: "", unidade: "UN", estoque_minimo: 0, categoria: "", fornecedor: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.codigo || !form.nome) { showToast("Código e nome são obrigatórios", "err"); return; }
    setLoading(true);
    try {
      await api("POST", "/produtos/", form);
      showToast("Produto cadastrado!", "ok");
      setForm({ codigo: "", nome: "", unidade: "UN", estoque_minimo: 0, categoria: "", fornecedor: "" });
      onSalvo?.();
    } catch(e) { showToast(e.message, "err"); }
    finally { setLoading(false); }
  };

  const fields = [
    { k: "codigo", l: "Código *", p: "CAB001", upper: true },
    { k: "nome", l: "Nome *", p: "Cabo Elétrico 1.5mm" },
    { k: "categoria", l: "Categoria", p: "Elétrico, EPI, Mecânico..." },
    { k: "fornecedor", l: "Fornecedor", p: "WEG, 3M, SKF..." },
    { k: "unidade", l: "Unidade", p: "UN, KG, M, L..." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn .3s ease" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.green}30`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.green, letterSpacing: 2, marginBottom: 6 }}>// novo produto</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>Cadastrar Produto</div>
      </div>

      {fields.map(({ k, l, p, upper }) => (
        <Card key={k}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 8 }}>// {l.toLowerCase()}</div>
          <input
            value={form[k]} onChange={e => set(k, upper ? e.target.value.toUpperCase() : e.target.value)}
            placeholder={p}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 15, fontWeight: 600, boxSizing: "border-box", fontFamily: k === "codigo" ? "'JetBrains Mono', monospace" : "inherit" }}
          />
        </Card>
      ))}

      <Card>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 8 }}>// estoque mínimo</div>
        <input type="number" value={form.estoque_minimo} onChange={e => set("estoque_minimo", parseFloat(e.target.value) || 0)} min="0"
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.cyan, fontSize: 24, fontWeight: 800, boxSizing: "border-box", fontFamily: "'JetBrains Mono', monospace" }} />
      </Card>

      <button onClick={salvar} disabled={loading} style={{
        padding: 16, borderRadius: 12, border: `1px solid ${C.green}50`,
        background: C.green + "15", color: C.green, fontWeight: 800, fontSize: 14,
        cursor: loading ? "default" : "pointer", fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: 1, opacity: loading ? .6 : 1, transition: "all .2s"
      }}>
        {loading ? "// salvando..." : "// CADASTRAR PRODUTO"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════
const TABS = [
  { id: "dash",  icon: "◈", label: "Dashboard" },
  { id: "cole",  icon: "◉", label: "Coletor"   },
  { id: "esto",  icon: "▦", label: "Estoque"   },
  { id: "ord",   icon: "≡", label: "Ordens"    },
  { id: "aria",  icon: "◎", label: "ARIA"      },
  { id: "cad",   icon: "+", label: "Cadastrar" },
];

export default function App() {
  const [op, setOp] = useState(null);
  const [tab, setTab] = useState("dash");
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "ok") => setToast({ msg, type });

  if (!op) return <Login onLogin={setOp} />;

  const renderTab = () => {
    switch(tab) {
      case "dash": return <Dashboard operador={op} />;
      case "cole": return <Coletor operador={op} showToast={showToast} />;
      case "esto": return <Estoque showToast={showToast} />;
      case "ord":  return <Ordens showToast={showToast} />;
      case "aria": return <ARIA />;
      case "cad":  return <Cadastro showToast={showToast} onSalvo={() => setTab("esto")} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.bg + "F0", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`, padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 2, height: 28, background: `linear-gradient(180deg, ${C.cyan}, transparent)` }} />
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, color: C.white, letterSpacing: -1, lineHeight: 1 }}>SLR</div>
            <div style={{ fontSize: 8, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>LOGÍSTICA ROVIE</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, background: C.green, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>ONLINE</span>
          </div>
          <button onClick={() => setOp(null)} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.cyan }}>{op.sigla || op.nome.slice(0,2).toUpperCase()}</div>
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ padding: "16px 20px 90px", maxWidth: 520, margin: "0 auto" }}>
        {renderTab()}
      </main>

      {/* Nav bottom */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: C.bg + "F5", backdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.border}`, display: "flex",
        maxWidth: "100%"
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "10px 0 12px", border: "none", background: "none", cursor: "pointer",
            borderTop: `2px solid ${tab === t.id ? C.cyan : "transparent"}`,
            transition: "all .2s"
          }}>
            <span style={{ fontSize: 16, color: tab === t.id ? C.cyan : C.muted, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 8, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", color: tab === t.id ? C.cyan : C.muted, letterSpacing: 1 }}>
              {t.label.toUpperCase()}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
