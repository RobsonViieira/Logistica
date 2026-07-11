// ============================================================
// SLR — Software de Logística Rovie v2.0
// Melhorias: QR Cam, Login PIN, QR Generator, Gráficos
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Dados mock ────────────────────────────────────────────────
const PRODUTOS_MOCK = [
  { id:1,  codigo:"CAB001", nome:"Cabo Elétrico 1.5mm",    unidade:"M",   categoria:"Elétrico",   qtd:250, min:100, loc:"RA-P1-N1", fornecedor:"WEG" },
  { id:2,  codigo:"CAB002", nome:"Cabo Elétrico 2.5mm",    unidade:"M",   categoria:"Elétrico",   qtd:60,  min:80,  loc:"RA-P1-N2", fornecedor:"WEG" },
  { id:3,  codigo:"CON001", nome:"Conector RJ45",           unidade:"UN",  categoria:"Rede",       qtd:15,  min:50,  loc:"RA-P2-N1", fornecedor:"Furukawa" },
  { id:4,  codigo:"PAR001", nome:"Parafuso M6x20",          unidade:"CX",  categoria:"Fixação",    qtd:25,  min:10,  loc:"RB-P1-N1", fornecedor:"Ciser" },
  { id:5,  codigo:"OLE001", nome:"Óleo Lubrificante ISO 46",unidade:"L",   categoria:"Manutenção", qtd:5,   min:20,  loc:"RB-P2-N1", fornecedor:"Mobil" },
  { id:6,  codigo:"EPI001", nome:"Luva Nitrílica M",        unidade:"PAR", categoria:"EPI",        qtd:12,  min:30,  loc:"RC-P1-N1", fornecedor:"Danny" },
  { id:7,  codigo:"EPI002", nome:"Óculos de Segurança",     unidade:"UN",  categoria:"EPI",        qtd:20,  min:15,  loc:"RC-P1-N2", fornecedor:"3M" },
  { id:8,  codigo:"ROL001", nome:"Rolamento 6205",           unidade:"UN",  categoria:"Mecânico",   qtd:2,   min:5,   loc:"RC-P2-N1", fornecedor:"SKF" },
  { id:9,  codigo:"FUS001", nome:"Fusível 16A",              unidade:"UN",  categoria:"Elétrico",   qtd:30,  min:25,  loc:"RD-P1-N1", fornecedor:"Schneider" },
  { id:10, codigo:"COR001", nome:"Correia V A42",            unidade:"UN",  categoria:"Mecânico",   qtd:1,   min:3,   loc:"RD-P1-N2", fornecedor:"Gates" },
];

// Gera histórico de movs dos últimos 7 dias para gráficos
const gerarHistorico = () => {
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit" });
    dias.push({
      label,
      entradas: Math.floor(Math.random() * 12) + 2,
      saidas:   Math.floor(Math.random() * 8)  + 1,
    });
  }
  return dias;
};

const MOVS_MOCK = [
  { id:1, tipo:"entrada", produto:"CAB001", nome:"Cabo 1.5mm",    qtd:500, ref:"NF-8821", op:"Maria S.",  data:"2026-07-10 14:32" },
  { id:2, tipo:"saida",   produto:"EPI001", nome:"Luva Nitrílica", qtd:8,  ref:"OS-0041", op:"João P.",   data:"2026-07-10 11:15" },
  { id:3, tipo:"entrada", produto:"ROL001", nome:"Rolamento 6205", qtd:5,  ref:"NF-8800", op:"Carlos M.", data:"2026-07-09 16:45" },
  { id:4, tipo:"saida",   produto:"OLE001", nome:"Óleo ISO 46",    qtd:15, ref:"OS-0039", op:"Maria S.",  data:"2026-07-09 09:00" },
  { id:5, tipo:"entrada", produto:"FUS001", nome:"Fusível 16A",    qtd:50, ref:"NF-8795", op:"João P.",   data:"2026-07-08 13:20" },
];

const ORDENS_MOCK = [
  { id:1, tipo:"separacao",   status:"pendente",     prioridade:"urgente", cliente:"Linha Prod. A",   obs:"Manutenção corretiva — parada",  itens:[{prod:"ROL001",qtd:2},{prod:"COR001",qtd:1}], data:"2026-07-11 08:00" },
  { id:2, tipo:"recebimento", status:"em_andamento", prioridade:"normal",  cliente:"WEG Equipamentos",obs:"NF 12345 — pedido semanal",      itens:[{prod:"CAB001",qtd:500},{prod:"CAB002",qtd:300}], data:"2026-07-10 14:00" },
  { id:3, tipo:"expedicao",   status:"concluida",    prioridade:"alta",    cliente:"Manutenção Geral",obs:"Entrega de EPIs para turno C",   itens:[{prod:"EPI001",qtd:20},{prod:"EPI002",qtd:10}], data:"2026-07-09 07:30" },
];

const OPERADORES = [
  { id:1, nome:"João P.",   pin:"1234", cargo:"Almoxarife",   avatar:"👷" },
  { id:2, nome:"Maria S.",  pin:"5678", cargo:"Supervisora",  avatar:"👩‍💼" },
  { id:3, nome:"Carlos M.", pin:"9012", cargo:"Operador",     avatar:"🧑‍🔧" },
];

const CHAT_MOCK = [{ role:"aria", text:"Olá! Sou a ARIA 🤖 Detectei 7 itens críticos e 2 ordens pendentes. Como posso ajudar?" }];
const RESPOSTAS_IA = {
  "reposi": "📋 **Reposição Urgente:**\n\n🔴 Críticos:\n• Rolamento 6205 — pedir 10 un\n• Correia V A42 — pedir 5 un\n• Óleo ISO 46 — pedir 50 L\n\n🟡 Esta semana:\n• Conector RJ45 — pedir 100 un\n• Luva Nitrílica — pedir 60 par",
  "estoque": "📦 **Resumo:** 10 SKUs | 7 em alerta (70%)\n\n✅ OK: Cabo 1.5mm, Parafuso M6, Óculos, Fusível\n⚠️ Críticos: Rolamento, Correia, Óleo, Luva, Conector, Cabo 2.5mm",
  "ordem": "📋 **Ordens:**\n• OS #1 — Separação URGENTE (Linha A)\n• OS #2 — Recebimento em andamento\n• OS #4 — Aguardando operador\n\n💡 OS #1 é crítica — processar antes das 12h.",
  "default": "Posso ajudar com reposição, localização, ordens e previsão de demanda. O que precisa?"
};

const catColor = { "Elétrico":"#3b82f6","Rede":"#8b5cf6","Fixação":"#f59e0b","Manutenção":"#6b7280","EPI":"#10b981","Mecânico":"#ef4444" };
const prioCor  = { urgente:"#ef4444", alta:"#f59e0b", normal:"#3b82f6", baixa:"#9ca3af" };
const statusCor= { pendente:"#f59e0b", em_andamento:"#3b82f6", concluida:"#10b981", cancelada:"#9ca3af" };

const alerta = (p) => p.qtd <= p.min;
const pct    = (q, m) => m === 0 ? 100 : Math.min(100, Math.round((q / m) * 100));

// ── Componentes base ──────────────────────────────────────────
function Badge({ children, color="#3b82f6" }) {
  return <span style={{ background:color+"22", color, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{children}</span>;
}
function Card({ children, style={} }) {
  return <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid #f1f5f9", ...style }}>{children}</div>;
}
function ProgressBar({ value }) {
  const c = value <= 30 ? "#ef4444" : value <= 70 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ height:5, background:"#e2e8f0", borderRadius:4, overflow:"hidden", marginTop:6 }}>
      <div style={{ height:"100%", width:`${value}%`, background:c, borderRadius:4, transition:"width .5s" }} />
    </div>
  );
}
function Spinner() {
  return <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
    <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
  </div>;
}
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); });
  return (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:9999,
      background: type==="ok" ? "#16a34a" : "#dc2626", color:"#fff",
      padding:"12px 22px", borderRadius:14, fontSize:13, fontWeight:700,
      boxShadow:"0 8px 30px rgba(0,0,0,.3)", maxWidth:300, textAlign:"center", zIndex:9999 }}>
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 🔐 TELA DE LOGIN COM PIN
// ══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [op, setOp] = useState(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [shake, setShake] = useState(false);

  const digitar = (d) => {
    if (pin.length >= 4) return;
    const novo = pin + d;
    setPin(novo);
    if (novo.length === 4) verificar(novo);
  };

  const verificar = (p) => {
    if (op && op.pin === p) {
      onLogin(op);
    } else {
      setShake(true);
      setErro("PIN incorreto. Tente novamente.");
      setTimeout(() => { setPin(""); setShake(false); setErro(""); }, 800);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes shake{0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)}}`}</style>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>📦</div>
        <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:-2 }}>SLR</div>
        <div style={{ fontSize:12, color:"#94a3b8", letterSpacing:3, textTransform:"uppercase" }}>Software de Logística Rovie</div>
      </div>

      {!op ? (
        // Seleção de operador
        <div style={{ width:"100%", maxWidth:340 }}>
          <p style={{ color:"#94a3b8", textAlign:"center", marginBottom:16, fontSize:13 }}>Quem é você?</p>
          {OPERADORES.map(o => (
            <button key={o.id} onClick={() => setOp(o)}
              style={{ width:"100%", padding:"14px 18px", marginBottom:10, background:"rgba(255,255,255,.07)",
                border:"1px solid rgba(255,255,255,.12)", borderRadius:14, color:"#fff", cursor:"pointer",
                display:"flex", alignItems:"center", gap:14, transition:"all .2s" }}>
              <span style={{ fontSize:28 }}>{o.avatar}</span>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{o.nome}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{o.cargo}</div>
              </div>
              <span style={{ marginLeft:"auto", color:"#475569" }}>›</span>
            </button>
          ))}
          <button onClick={() => onLogin({ id:0, nome:"Demo", cargo:"Visitante", avatar:"👤", pin:"0000" })}
            style={{ width:"100%", padding:"12px", background:"transparent", border:"1px dashed #475569",
              borderRadius:14, color:"#64748b", cursor:"pointer", fontSize:13, marginTop:6 }}>
            Entrar como visitante (demo)
          </button>
        </div>
      ) : (
        // Teclado PIN
        <div style={{ width:"100%", maxWidth:280, textAlign:"center" }}>
          <div style={{ marginBottom:24 }}>
            <span style={{ fontSize:28 }}>{op.avatar}</span>
            <p style={{ color:"#fff", fontWeight:700, fontSize:16, margin:"6px 0 2px" }}>{op.nome}</p>
            <p style={{ color:"#94a3b8", fontSize:12 }}>{op.cargo}</p>
          </div>

          {/* Pontos do PIN */}
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:24,
            animation: shake ? "shake .4s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:16, height:16, borderRadius:"50%",
                background: pin.length > i ? "#3b82f6" : "rgba(255,255,255,.2)",
                transition:"background .15s", border:"2px solid rgba(255,255,255,.3)" }} />
            ))}
          </div>

          {erro && <p style={{ color:"#f87171", fontSize:12, marginBottom:16 }}>{erro}</p>}

          {/* Teclado numérico */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
              <button key={i} onClick={() => d === "⌫" ? setPin(p=>p.slice(0,-1)) : d !== "" && digitar(String(d))}
                style={{ padding:"18px 0", background: d===""?"transparent":"rgba(255,255,255,.1)",
                  border:"1px solid rgba(255,255,255,.1)", borderRadius:12, color:"#fff",
                  fontSize:20, fontWeight:700, cursor: d===""?"default":"pointer",
                  visibility: d===""?"hidden":"visible", transition:"all .1s" }}>
                {d}
              </button>
            ))}
          </div>

          <button onClick={() => setOp(null)}
            style={{ marginTop:20, background:"transparent", border:"none", color:"#64748b", cursor:"pointer", fontSize:13 }}>
            ← Trocar operador
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 📷 LEITOR QR COM CÂMERA
// ══════════════════════════════════════════════════════════════
function QRScanner({ onRead, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("Iniciando câmera...");
  const [manual, setManual] = useState("");

  useEffect(() => {
    let active = true;
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (!active) { stream.getTracks().forEach(t=>t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStatus("Aponte para o QR Code do produto");
        }

        // Usa BarcodeDetector se disponível (Chrome/Android nativo)
        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({ formats:["qr_code","code_128","ean_13","code_39"] });
          const scan = async () => {
            if (!active || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                onRead(codes[0].rawValue);
                return;
              }
            } catch {}
            if (active) requestAnimationFrame(scan);
          };
          videoRef.current?.addEventListener("playing", () => requestAnimationFrame(scan));
        } else {
          setStatus("Câmera ativa — digite o código manualmente");
        }
      } catch(e) {
        setStatus("Câmera não disponível — use o campo manual abaixo");
      }
    }
    startCam();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t=>t.stop());
    };
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", zIndex:500,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      
      {/* Viewfinder */}
      <div style={{ position:"relative", width:280, height:280, marginBottom:24 }}>
        <video ref={videoRef} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:16 }}
          muted playsInline />
        {/* Cantos do scanner */}
        {[["0","0"],["0","auto"],["auto","0"],["auto","auto"]].map(([t,b],i)=>(
          <div key={i} style={{ position:"absolute",
            top: t==="0"?"0":undefined, bottom: b==="auto"?undefined:"0",
            left: i<2?"0":undefined, right: i>=2?"0":undefined,
            width:28, height:28,
            borderTop: i<2?"3px solid #3b82f6":undefined,
            borderBottom: i>=2?"3px solid #3b82f6":undefined,
            borderLeft: i%2===0?"3px solid #3b82f6":undefined,
            borderRight: i%2===1?"3px solid #3b82f6":undefined,
            borderRadius: i===0?"8px 0 0 0":i===1?"0 0 0 8px":i===2?"0 8px 0 0":"0 0 8px 0"
          }} />
        ))}
        {/* Linha de scan animada */}
        <div style={{ position:"absolute", left:8, right:8, height:2, background:"#3b82f6",
          boxShadow:"0 0 8px #3b82f6", animation:"scanline 2s linear infinite", top:"50%" }} />
        <style>{`@keyframes scanline{0%{top:10%}50%{top:88%}100%{top:10%}}`}</style>
      </div>

      <p style={{ color:"#94a3b8", fontSize:13, marginBottom:20, textAlign:"center", maxWidth:260 }}>{status}</p>

      {/* Input manual */}
      <div style={{ display:"flex", gap:8, width:"100%", maxWidth:280 }}>
        <input value={manual} onChange={e=>setManual(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==="Enter"&&manual&&onRead(manual)}
          placeholder="Ou digite o código"
          style={{ flex:1, padding:"12px 14px", borderRadius:12, border:"1.5px solid #334155",
            background:"#1e293b", color:"#fff", fontSize:14, outline:"none", fontFamily:"monospace" }}
        />
        <button onClick={()=>manual&&onRead(manual)}
          style={{ padding:"12px 16px", background:"#2563eb", border:"none", borderRadius:12, color:"#fff", cursor:"pointer", fontSize:16 }}>
          ✓
        </button>
      </div>

      <button onClick={onClose}
        style={{ marginTop:24, background:"transparent", border:"1px solid #334155", color:"#94a3b8",
          padding:"10px 28px", borderRadius:10, cursor:"pointer", fontSize:13 }}>
        Cancelar
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 📄 GERADOR DE ETIQUETA QR
// ══════════════════════════════════════════════════════════════
function EtiquetaQR({ produto, onClose }) {
  const canvasRef = useRef(null);
  const [gerado, setGerado] = useState(false);

  useEffect(() => {
    // Gera QR Code via API pública (sem dependência)
    setGerado(true);
  }, []);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${produto.codigo}&bgcolor=ffffff&color=000000&margin=10`;

  const imprimir = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Etiqueta — ${produto.codigo}</title>
      <style>
        body { font-family: monospace; display:flex; flex-direction:column; align-items:center; padding:20px; }
        .etiqueta { border:2px solid #000; padding:12px; width:220px; text-align:center; }
        .codigo { font-size:22px; font-weight:900; letter-spacing:2px; margin:8px 0 4px; }
        .nome { font-size:11px; margin-bottom:4px; }
        .loc { font-size:10px; background:#000; color:#fff; padding:2px 8px; border-radius:4px; }
        img { width:160px; height:160px; }
      </style></head><body>
      <div class="etiqueta">
        <img src="${qrUrl}" />
        <div class="codigo">${produto.codigo}</div>
        <div class="nome">${produto.nome}</div>
        <div class="loc">📍 ${produto.loc}</div>
        <div style="font-size:9px;margin-top:6px;color:#666">${produto.unidade} · ${produto.categoria}</div>
      </div>
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:400,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:24, maxWidth:320, width:"100%", textAlign:"center" }}>
        <h3 style={{ fontWeight:900, color:"#1e293b", marginBottom:4 }}>🏷️ Etiqueta QR</h3>
        <p style={{ color:"#94a3b8", fontSize:12, marginBottom:16 }}>Escaneie para identificar o produto</p>

        {/* Preview da etiqueta */}
        <div style={{ border:"2px dashed #e2e8f0", borderRadius:12, padding:16, marginBottom:16 }}>
          <img src={qrUrl} alt="QR Code" style={{ width:140, height:140 }} />
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:2, marginTop:8 }}>{produto.codigo}</div>
          <div style={{ fontSize:12, color:"#64748b", margin:"4px 0" }}>{produto.nome}</div>
          <div style={{ display:"inline-block", background:"#1e293b", color:"#fff", fontSize:11, padding:"2px 10px", borderRadius:8 }}>
            📍 {produto.loc}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={imprimir} style={{ padding:"12px 0", background:"#1e293b", color:"#fff",
            border:"none", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:13 }}>
            🖨️ Imprimir
          </button>
          <button onClick={onClose} style={{ padding:"12px 0", background:"#f1f5f9", color:"#64748b",
            border:"none", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:13 }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 📊 GRÁFICO DE BARRAS (SVG puro, sem dependência)
// ══════════════════════════════════════════════════════════════
function GraficoMovimentacoes({ historico }) {
  const maxVal = Math.max(...historico.map(d => Math.max(d.entradas, d.saidas))) || 1;
  const W = 100 / historico.length;

  return (
    <Card style={{ marginBottom:0 }}>
      <div style={{ fontWeight:700, color:"#1e293b", marginBottom:12, fontSize:13 }}>📈 Movimentações — 7 dias</div>
      <div style={{ display:"flex", gap:12, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:10, height:10, background:"#22c55e", borderRadius:2 }} />
          <span style={{ fontSize:11, color:"#64748b" }}>Entradas</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:10, height:10, background:"#f87171", borderRadius:2 }} />
          <span style={{ fontSize:11, color:"#64748b" }}>Saídas</span>
        </div>
      </div>

      {/* Gráfico SVG */}
      <svg viewBox="0 0 300 100" style={{ width:"100%", height:100 }}>
        {/* Linhas de grade */}
        {[0,25,50,75,100].map(y=>(
          <line key={y} x1="0" y1={100-y} x2="300" y2={100-y} stroke="#f1f5f9" strokeWidth="1" />
        ))}

        {historico.map((d, i) => {
          const x = i * (300 / historico.length);
          const barW = (300 / historico.length) * 0.35;
          const hE = (d.entradas / maxVal) * 90;
          const hS = (d.saidas   / maxVal) * 90;
          return (
            <g key={i}>
              {/* Entrada */}
              <rect x={x + 2} y={100 - hE} width={barW} height={hE} fill="#22c55e" rx="2">
                <title>{d.label}: {d.entradas} entradas</title>
              </rect>
              {/* Saída */}
              <rect x={x + barW + 4} y={100 - hS} width={barW} height={hS} fill="#f87171" rx="2">
                <title>{d.label}: {d.saidas} saídas</title>
              </rect>
            </g>
          );
        })}
      </svg>

      {/* Labels dias */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {historico.map((d,i) => (
          <span key={i} style={{ fontSize:9, color:"#94a3b8", flex:1, textAlign:"center" }}>{d.label}</span>
        ))}
      </div>

      {/* Totais */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:14, paddingTop:12, borderTop:"1px solid #f1f5f9" }}>
        {[
          { label:"Total Entradas", val: historico.reduce((a,d)=>a+d.entradas,0), color:"#22c55e", icon:"📥" },
          { label:"Total Saídas",   val: historico.reduce((a,d)=>a+d.saidas,0),   color:"#f87171", icon:"📤" },
          { label:"Saldo",          val: historico.reduce((a,d)=>a+d.entradas-d.saidas,0), color:"#2563eb", icon:"⚡" },
        ].map(k => (
          <div key={k.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:18 }}>{k.icon}</div>
            <div style={{ fontSize:18, fontWeight:900, color:k.color, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:9, color:"#94a3b8", marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
// TELAS PRINCIPAIS
// ══════════════════════════════════════════════════════════════

function Dashboard({ produtos, movs, ordens, operador }) {
  const alertList = produtos.filter(alerta).slice(0,5);
  const pendentes = ordens.filter(o=>o.status==="pendente").length;
  const historico  = useRef(gerarHistorico()).current;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Boas-vindas */}
      <div style={{ background:"linear-gradient(135deg,#1d4ed8,#4338ca)", borderRadius:16, padding:16, color:"#fff" }}>
        <div style={{ fontSize:20 }}>{operador.avatar}</div>
        <div style={{ fontWeight:800, fontSize:16, marginTop:4 }}>Olá, {operador.nome.split(" ")[0]}!</div>
        <div style={{ fontSize:11, opacity:.8 }}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</div>
        <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
          {alertList.length > 0 && <span style={{ background:"rgba(239,68,68,.3)", fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>🚨 {alertList.length} itens críticos</span>}
          {pendentes > 0 && <span style={{ background:"rgba(251,191,36,.3)", fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>📋 {pendentes} ordens pendentes</span>}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { icon:"📦", val:produtos.length,                        label:"Produtos",      sub:"cadastrados",    c:"#2563eb" },
          { icon:"⚠️", val:produtos.filter(alerta).length,         label:"Alertas",       sub:"estoque baixo",  c:"#dc2626" },
          { icon:"🔄", val:movs.length,                            label:"Movimentações", sub:"registradas",    c:"#16a34a" },
          { icon:"📋", val:pendentes,                              label:"OS Pendentes",  sub:"aguardando",     c:"#d97706" },
        ].map(k=>(
          <div key={k.label} style={{ background:`linear-gradient(135deg,${k.c},${k.c}cc)`, borderRadius:14, padding:"14px 12px", color:"#fff" }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{k.icon}</div>
            <div style={{ fontSize:28, fontWeight:900, lineHeight:1, fontFamily:"monospace" }}>{k.val}</div>
            <div style={{ fontSize:11, opacity:.9, fontWeight:600, marginTop:3 }}>{k.label}</div>
            <div style={{ fontSize:10, opacity:.7 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <GraficoMovimentacoes historico={historico} />

      {/* Itens críticos */}
      {alertList.length > 0 && (
        <Card style={{ background:"#fff5f5", border:"1px solid #fecaca" }}>
          <div style={{ fontWeight:700, color:"#dc2626", marginBottom:10 }}>🚨 Itens Críticos</div>
          {alertList.map(p=>(
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #fee2e2" }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600 }}>{p.nome}</div>
                <div style={{ fontSize:10, color:"#94a3b8" }}>{p.codigo} · {p.loc}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, fontWeight:900, color:"#dc2626" }}>{p.qtd} {p.unidade}</div>
                <div style={{ fontSize:10, color:"#94a3b8" }}>mín {p.min}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Coletor({ produtos, onMovimentacao, showToast, operador }) {
  const [scanner, setScanner] = useState(false);
  const [codigo, setCodigo]   = useState("");
  const [produto, setProduto] = useState(null);
  const [tipo, setTipo]       = useState("entrada");
  const [qtd, setQtd]         = useState("");
  const [ref, setRef]         = useState("");
  const [etiqueta, setEtiqueta] = useState(null);

  const buscar = (cod) => {
    const c = (cod || codigo).toUpperCase().trim();
    const p = produtos.find(x => x.codigo === c);
    if (p) { setProduto(p); setCodigo(c); }
    else { showToast("❌ Produto não encontrado: " + c, "err"); }
  };

  const confirmar = () => {
    if (!produto || !qtd || parseFloat(qtd) <= 0) { showToast("Preencha todos os campos", "err"); return; }
    if (tipo==="saida" && parseFloat(qtd) > produto.qtd) { showToast(`⚠️ Estoque insuficiente! Disponível: ${produto.qtd} ${produto.unidade}`, "err"); return; }
    onMovimentacao({ tipo, produto:produto.codigo, nome:produto.nome, qtd:parseFloat(qtd), ref, op:operador.nome });
    showToast(`${tipo==="entrada"?"📥 Entrada":"📤 Saída"} registrada!`, "ok");
    setCodigo(""); setProduto(null); setQtd(""); setRef("");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {scanner && <QRScanner onRead={(v)=>{setScanner(false); buscar(v);}} onClose={()=>setScanner(false)} />}
      {etiqueta && <EtiquetaQR produto={etiqueta} onClose={()=>setEtiqueta(null)} />}

      <div style={{ background:"linear-gradient(135deg,#1d4ed8,#4338ca)", borderRadius:16, padding:16, color:"#fff" }}>
        <div style={{ fontWeight:900, fontSize:18 }}>📱 Coletor</div>
        <div style={{ fontSize:11, opacity:.8 }}>Operador: {operador.nome} · {operador.cargo}</div>
      </div>

      {/* Tipo */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {["entrada","saida"].map(t=>(
          <button key={t} onClick={()=>setTipo(t)} style={{ padding:"13px 0", borderRadius:12, border:"none",
            cursor:"pointer", fontWeight:700, fontSize:13,
            background: tipo===t?(t==="entrada"?"#16a34a":"#dc2626"):"#f1f5f9",
            color: tipo===t?"#fff":"#64748b", boxShadow: tipo===t?"0 4px 12px rgba(0,0,0,.2)":"none" }}>
            {t==="entrada"?"📥 Entrada":"📤 Saída"}
          </button>
        ))}
      </div>

      {/* Busca produto */}
      <Card>
        <label style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.5 }}>Código do produto</label>
        <div style={{ display:"flex", gap:8, marginTop:6 }}>
          <input value={codigo} onChange={e=>setCodigo(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==="Enter"&&buscar()}
            placeholder="Ex: CAB001"
            style={{ flex:1, padding:"12px", borderRadius:10, border:"1.5px solid #e2e8f0",
              fontSize:16, fontFamily:"monospace", fontWeight:700, outline:"none" }}
          />
          {/* Botão câmera QR */}
          <button onClick={()=>setScanner(true)} title="Escanear QR com câmera"
            style={{ padding:"12px 14px", background:"#0f172a", color:"#fff", border:"none",
              borderRadius:10, cursor:"pointer", fontSize:18 }}>
            📷
          </button>
          <button onClick={()=>buscar()}
            style={{ padding:"12px 14px", background:"#2563eb", color:"#fff", border:"none",
              borderRadius:10, cursor:"pointer", fontSize:16, fontWeight:700 }}>
            🔎
          </button>
        </div>
        <div style={{ marginTop:8, display:"flex", gap:4, flexWrap:"wrap" }}>
          {produtos.slice(0,6).map(p=>(
            <button key={p.id} onClick={()=>buscar(p.codigo)}
              style={{ fontSize:9, padding:"3px 8px", borderRadius:8, border:"1px solid #e2e8f0",
                background:"#f8fafc", cursor:"pointer", color:"#64748b" }}>
              {p.codigo}
            </button>
          ))}
        </div>
      </Card>

      {produto && (
        <>
          <Card style={{ background:"#eff6ff", border:"1.5px solid #bfdbfe" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:800, color:"#1e40af", fontSize:14 }}>{produto.nome}</div>
                <div style={{ fontSize:11, color:"#3b82f6", margin:"4px 0" }}>{produto.codigo} · {produto.unidade} · 📍 {produto.loc}</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  <Badge color={catColor[produto.categoria]||"#64748b"}>{produto.categoria}</Badge>
                  <Badge color={alerta(produto)?"#dc2626":"#16a34a"}>{alerta(produto)?"⚠️ Crítico":"✅ OK"}</Badge>
                </div>
                <div style={{ fontSize:11, color:"#1e40af", marginTop:6, fontWeight:700 }}>
                  Estoque atual: {produto.qtd} {produto.unidade}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <button onClick={()=>setEtiqueta(produto)} title="Gerar etiqueta QR"
                  style={{ padding:"8px 10px", background:"#f8fafc", border:"1px solid #e2e8f0",
                    borderRadius:8, cursor:"pointer", fontSize:14 }}>
                  🏷️
                </button>
                <button onClick={()=>setProduto(null)}
                  style={{ padding:"8px 10px", background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#94a3b8" }}>
                  ✕
                </button>
              </div>
            </div>
            <ProgressBar value={pct(produto.qtd, produto.min)} />
          </Card>

          <Card>
            <label style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>Quantidade ({produto.unidade})</label>
            <input type="number" value={qtd} onChange={e=>setQtd(e.target.value)} min="0.01" step="0.01"
              placeholder="0"
              style={{ display:"block", width:"100%", padding:"12px 0", textAlign:"center",
                fontSize:40, fontWeight:900, border:"none", outline:"none", color:"#1e293b",
                fontFamily:"monospace", boxSizing:"border-box" }}
            />
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["ref","Referência","NF, OS..."],["op","Operador",""]].map(([k,l,pl])=>(
              <Card key={k}>
                <label style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>{l}</label>
                <input value={k==="ref"?ref:operador.nome} readOnly={k==="op"}
                  onChange={e=>k==="ref"&&setRef(e.target.value)} placeholder={pl}
                  style={{ display:"block", width:"100%", border:"none", outline:"none", fontSize:13,
                    marginTop:4, fontWeight:600, color: k==="op"?"#94a3b8":"#1e293b",
                    background:"transparent", boxSizing:"border-box" }}
                />
              </Card>
            ))}
          </div>

          <button onClick={confirmar} style={{ padding:16, borderRadius:14, border:"none", cursor:"pointer",
            background: tipo==="entrada"?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#dc2626,#b91c1c)",
            color:"#fff", fontWeight:900, fontSize:16, boxShadow:"0 6px 20px rgba(0,0,0,.25)" }}>
            ✅ Confirmar {tipo==="entrada"?"Entrada":"Saída"}
          </button>
        </>
      )}
    </div>
  );
}

function Estoque({ produtos, showToast }) {
  const [busca, setBusca]   = useState("");
  const [soAlerta, setSoAlerta] = useState(false);
  const [cat, setCat]       = useState("Todas");
  const [etiqueta, setEtiqueta] = useState(null);
  const cats = ["Todas", ...new Set(produtos.map(p=>p.categoria))];

  const filtrado = produtos.filter(p => {
    const m = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.includes(busca.toUpperCase());
    return m && (!soAlerta || alerta(p)) && (cat==="Todas" || p.categoria===cat);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {etiqueta && <EtiquetaQR produto={etiqueta} onClose={()=>setEtiqueta(null)} />}

      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Código ou nome..."
        style={{ padding:"12px 14px", borderRadius:12, border:"1.5px solid #e2e8f0", fontSize:14, outline:"none" }}
      />
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
        <button onClick={()=>setSoAlerta(!soAlerta)} style={{ padding:"6px 12px", borderRadius:20, border:"none",
          cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap",
          background:soAlerta?"#dc2626":"#f1f5f9", color:soAlerta?"#fff":"#64748b" }}>
          ⚠️ Alertas
        </button>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{ padding:"6px 12px", borderRadius:20, border:"none",
            cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap",
            background:cat===c?"#2563eb":"#f1f5f9", color:cat===c?"#fff":"#64748b" }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ fontSize:11, color:"#94a3b8" }}>{filtrado.length} item(ns) · {filtrado.filter(alerta).length} em alerta</div>

      {filtrado.map(p=>(
        <Card key={p.id} style={{ background:alerta(p)?"#fff5f5":"#fff", border:`1px solid ${alerta(p)?"#fecaca":"#f1f5f9"}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                {alerta(p) && <span style={{ fontSize:12 }}>⚠️</span>}
                <span style={{ fontWeight:700, fontSize:13, color:"#1e293b" }}>{p.nome}</span>
              </div>
              <div style={{ fontSize:10, color:"#94a3b8", marginBottom:6 }}>
                {p.codigo} · 📍 {p.loc} · {p.fornecedor}
              </div>
              <Badge color={catColor[p.categoria]||"#64748b"}>{p.categoria}</Badge>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:900, color:alerta(p)?"#dc2626":"#1e293b", lineHeight:1 }}>{p.qtd}</div>
                <div style={{ fontSize:10, color:"#94a3b8" }}>{p.unidade}</div>
                <div style={{ fontSize:9, color:"#94a3b8" }}>mín {p.min}</div>
              </div>
              <button onClick={()=>setEtiqueta(p)} title="Gerar etiqueta QR"
                style={{ padding:"6px 8px", background:"#f8fafc", border:"1px solid #e2e8f0",
                  borderRadius:8, cursor:"pointer", fontSize:14, marginTop:2 }}>
                🏷️
              </button>
            </div>
          </div>
          <ProgressBar value={pct(p.qtd, p.min)} />
          <div style={{ fontSize:9, color:"#94a3b8", marginTop:4, textAlign:"right" }}>
            {pct(p.qtd, p.min)}% do mínimo
          </div>
        </Card>
      ))}
    </div>
  );
}

function Ordens({ ordens, onStatus, showToast }) {
  const [filtro, setFiltro] = useState("todos");
  const [aberta, setAberta] = useState(null);

  const filtradas = ordens.filter(o=>filtro==="todos"||o.status===filtro);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
        {["todos","pendente","em_andamento","concluida"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{ padding:"6px 12px", borderRadius:20, border:"none",
            cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap",
            background:filtro===f?"#2563eb":"#f1f5f9", color:filtro===f?"#fff":"#64748b" }}>
            {f==="todos"?"Todas":f.replace("_"," ")}
          </button>
        ))}
      </div>

      {filtradas.map(o=>(
        <Card key={o.id}>
          <div style={{ cursor:"pointer" }} onClick={()=>setAberta(aberta===o.id?null:o.id)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:5 }}>
                  <span style={{ fontWeight:800, color:"#1e293b" }}>OS #{o.id}</span>
                  <Badge color={statusCor[o.status]}>{o.status.replace("_"," ")}</Badge>
                  <Badge color={prioCor[o.prioridade]}>{o.prioridade}</Badge>
                </div>
                <div style={{ fontSize:12, color:"#64748b", textTransform:"capitalize" }}>
                  {o.tipo.replace("_"," ")} · {o.cliente}
                </div>
              </div>
              <span style={{ color:"#94a3b8", fontSize:18 }}>{aberta===o.id?"▲":"▼"}</span>
            </div>
          </div>

          {aberta===o.id && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f1f5f9" }}>
              {o.obs && <div style={{ fontSize:12, color:"#64748b", marginBottom:10, padding:10, background:"#f8fafc", borderRadius:8 }}>💬 {o.obs}</div>}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", marginBottom:6 }}>Itens</div>
                {o.itens.map((it,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <span style={{ fontFamily:"monospace", color:"#2563eb" }}>{it.prod}</span>
                    <span style={{ fontWeight:700 }}>{it.qtd} un</span>
                  </div>
                ))}
              </div>
              {o.status==="pendente" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <button onClick={()=>{onStatus(o.id,"em_andamento");showToast("OS iniciada!","ok")}}
                    style={{ padding:"10px 0", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>▶ Iniciar</button>
                  <button onClick={()=>{onStatus(o.id,"cancelada");showToast("OS cancelada","err")}}
                    style={{ padding:"10px 0", background:"#f1f5f9", color:"#64748b", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>✕ Cancelar</button>
                </div>
              )}
              {o.status==="em_andamento" && (
                <button onClick={()=>{onStatus(o.id,"concluida");showToast("✅ OS concluída!","ok")}}
                  style={{ width:"100%", padding:"12px 0", background:"#16a34a", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>✅ Concluir OS</button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ARIA() {
  const [msgs, setMsgs] = useState(CHAT_MOCK);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);

  const enviar = (q) => {
    const p = q || input.trim(); if (!p||loading) return;
    setInput(""); setMsgs(m=>[...m,{role:"user",text:p}]); setLoading(true);
    setTimeout(()=>{
      const key = Object.keys(RESPOSTAS_IA).find(k=>p.toLowerCase().includes(k))||"default";
      setMsgs(m=>[...m,{role:"aria",text:RESPOSTAS_IA[key]}]); setLoading(false);
    }, 1000);
  };

  const quick = ["Quais itens repor?","Como está o estoque?","Ordens pendentes?","Itens críticos?"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius:16, padding:16, color:"#fff" }}>
        <div style={{ fontWeight:900, fontSize:18 }}>🤖 ARIA</div>
        <div style={{ fontSize:11, opacity:.8 }}>Assistente de Inteligência em Almoxarifado</div>
      </div>

      <Card style={{ minHeight:240, maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:10 }}>
        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"85%", padding:"10px 14px", borderRadius:14, fontSize:12, lineHeight:1.6,
              background:m.role==="user"?"linear-gradient(135deg,#2563eb,#4f46e5)":"#f8fafc",
              color:m.role==="user"?"#fff":"#1e293b",
              border:m.role==="aria"?"1px solid #e2e8f0":"none", whiteSpace:"pre-line" }}>
              {m.role==="aria" && <span style={{ fontSize:10, fontWeight:700, color:"#7c3aed", display:"block", marginBottom:4 }}>ARIA</span>}
              {m.text.replace(/\*\*(.*?)\*\*/g,"$1")}
            </div>
          </div>
        ))}
        {loading && <div style={{ display:"flex", gap:5, padding:"10px 14px", background:"#f8fafc", borderRadius:14, width:60, border:"1px solid #e2e8f0" }}>
          {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,background:"#7c3aed",borderRadius:"50%",animation:`bounce .${6+i*2}s ease infinite alternate` }} />)}
        </div>}
        <div ref={endRef} />
      </Card>

      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {quick.map(q=>(
          <button key={q} onClick={()=>enviar(q)} style={{ fontSize:10, padding:"5px 10px", borderRadius:20,
            border:"1px solid #c4b5fd", background:"#f5f3ff", color:"#7c3aed", cursor:"pointer", fontWeight:600 }}>
            {q}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()}
          placeholder="Pergunte para a ARIA..." style={{ flex:1, padding:"12px 14px", borderRadius:12,
            border:"1.5px solid #c4b5fd", fontSize:13, outline:"none", background:"#faf5ff" }}
        />
        <button onClick={()=>enviar()} disabled={!input.trim()||loading}
          style={{ padding:"12px 16px", background:"#7c3aed", color:"#fff", border:"none", borderRadius:12,
            cursor:"pointer", fontWeight:700, fontSize:16, opacity:!input.trim()||loading?.5:1 }}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════
const TABS = [
  {id:"dash",icon:"🏠",label:"Início"},
  {id:"cole",icon:"📱",label:"Coletor"},
  {id:"esto",icon:"📦",label:"Estoque"},
  {id:"ord", icon:"📋",label:"Ordens"},
  {id:"aria",icon:"🤖",label:"ARIA"},
];

export default function App() {
  const [operador, setOperador] = useState(null);
  const [tab, setTab]           = useState("dash");
  const [produtos, setProdutos] = useState(PRODUTOS_MOCK);
  const [movs, setMovs]         = useState(MOVS_MOCK);
  const [ordens, setOrdens]     = useState(ORDENS_MOCK);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type="ok") => setToast({msg,type});

  const onMovimentacao = (mov) => {
    setProdutos(ps=>ps.map(p=>p.codigo===mov.produto
      ?{...p, qtd:mov.tipo==="entrada"?p.qtd+mov.qtd:Math.max(0,p.qtd-mov.qtd)} : p));
    setMovs(ms=>[{id:ms.length+1,...mov,data:new Date().toLocaleString("pt-BR")},...ms]);
  };

  const onStatus = (id,status) => setOrdens(os=>os.map(o=>o.id===id?{...o,status}:o));

  if (!operador) return <LoginScreen onLogin={setOperador} />;

  const renderTab = () => {
    switch(tab) {
      case "dash": return <Dashboard produtos={produtos} movs={movs} ordens={ordens} operador={operador} />;
      case "cole": return <Coletor produtos={produtos} onMovimentacao={onMovimentacao} showToast={showToast} operador={operador} />;
      case "esto": return <Estoque produtos={produtos} showToast={showToast} />;
      case "ord":  return <Ordens ordens={ordens} onStatus={onStatus} showToast={showToast} />;
      case "aria": return <ARIA />;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-5px)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        *{box-sizing:border-box} input,button{-webkit-tap-highlight-color:transparent}
      `}</style>

      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      <header style={{ position:"sticky", top:0, zIndex:50, background:"#fff", borderBottom:"1px solid #e2e8f0",
        padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 1px 8px rgba(0,0,0,.06)" }}>
        <div>
          <div style={{ fontWeight:900, fontSize:20, color:"#1e293b", letterSpacing:-1 }}>SLR</div>
          <div style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.5 }}>Logística Rovie</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {produtos.filter(alerta).length > 0 && (
            <div style={{ background:"#dc2626", color:"#fff", fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:20 }}>
              ⚠️ {produtos.filter(alerta).length}
            </div>
          )}
          <button onClick={()=>setOperador(null)}
            style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:20, padding:"4px 10px",
              cursor:"pointer", fontSize:11, color:"#64748b", display:"flex", alignItems:"center", gap:5 }}>
            <span>{operador.avatar}</span>
            <span style={{ fontWeight:600 }}>{operador.nome.split(" ")[0]}</span>
          </button>
        </div>
      </header>

      <main style={{ padding:"16px 16px 90px", maxWidth:480, margin:"0 auto" }}>
        {renderTab()}
      </main>

      <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff",
        borderTop:"1px solid #e2e8f0", display:"flex", boxShadow:"0 -4px 20px rgba(0,0,0,.08)", zIndex:50 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", padding:"8px 0 10px", border:"none", background:"none", cursor:"pointer" }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
            <span style={{ fontSize:9, marginTop:3, fontWeight:700,
              color:tab===t.id?"#2563eb":"#94a3b8", letterSpacing:.3 }}>
              {t.label}
            </span>
            {tab===t.id && <div style={{ width:20, height:2, background:"#2563eb", borderRadius:2, marginTop:2 }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}
