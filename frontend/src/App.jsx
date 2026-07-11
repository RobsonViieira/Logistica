// ============================================================
// GLM - Gerenciador de Logística Modular
// Frontend React PWA - Roda em celular básico como coletor
// ============================================================

import { useState, useEffect, useCallback } from "react";

// URL da API (ajuste para seu EC2)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Hooks e utilitários ───────────────────────────────────────
function useApi(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, deps);
  return { data, loading, error, refetch: fetchData };
}

async function apiCall(method, endpoint, body = null) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erro na requisição");
  return data;
}

// ── Componentes UI ────────────────────────────────────────────

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-700",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${className}`}>
      {children}
    </div>
  );
}

function KpiCard({ icon, label, value, color = "blue", sub }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-orange-500",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} text-white p-4 shadow`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
      {sub && <div className="text-xs opacity-75 mt-1">{sub}</div>}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);
  const bg = type === "success" ? "bg-green-600" : "bg-red-600";
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${bg} text-white px-5 py-3 rounded-xl shadow-xl text-sm max-w-xs text-center`}>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TELAS
// ══════════════════════════════════════════════════════════════

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ showToast }) {
  const { data, loading, refetch } = useApi("/dashboard/", []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-center text-gray-500 py-10">Sem dados</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon="📦" label="Produtos" value={data.total_produtos} color="blue" />
        <KpiCard icon="⚠️" label="Alertas" value={data.alertas_estoque} color="red" sub="abaixo do mínimo" />
        <KpiCard icon="🔄" label="Movimentações" value={data.total_movimentacoes} color="green" />
        <KpiCard icon="📋" label="Ordens Pendentes" value={data.ordens_pendentes} color="yellow" />
      </div>

      {data.itens_criticos?.length > 0 && (
        <Card>
          <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
            <span>🚨</span> Itens Críticos
          </h3>
          <div className="space-y-2">
            {data.itens_criticos.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.produto_nome}</p>
                  <p className="text-xs text-gray-500">{item.produto_codigo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{item.quantidade} {item.unidade}</p>
                  <p className="text-xs text-gray-400">mín: {item.estoque_minimo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-bold text-gray-700 mb-3">⚡ Últimas Movimentações</h3>
        {data.ultimas_movimentacoes?.length > 0 ? (
          <div className="space-y-2">
            {data.ultimas_movimentacoes.map((m) => (
              <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{m.tipo === "entrada" ? "📥" : m.tipo === "saida" ? "📤" : "🔧"}</span>
                  <div>
                    <p className="text-sm font-medium capitalize">{m.tipo}</p>
                    <p className="text-xs text-gray-400">Produto #{m.produto_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{m.quantidade}</p>
                  <p className="text-xs text-gray-400">{new Date(m.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">Nenhuma movimentação ainda</p>
        )}
      </Card>

      <button
        onClick={refetch}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition"
      >
        🔄 Atualizar Dashboard
      </button>
    </div>
  );
}

// ── Estoque ───────────────────────────────────────────────────
function Estoque({ showToast }) {
  const { data: estoque, loading, refetch } = useApi("/estoque/", []);
  const [busca, setBusca] = useState("");
  const [soAlertas, setSoAlertas] = useState(false);

  const filtrado = (estoque || []).filter((e) => {
    const match = e.produto_nome.toLowerCase().includes(busca.toLowerCase()) ||
                  e.produto_codigo.toLowerCase().includes(busca.toLowerCase());
    return match && (!soAlertas || e.alerta);
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="🔍 Buscar por nome ou código..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setSoAlertas(!soAlertas)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            soAlertas ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {soAlertas ? "⚠️ Só alertas" : "Todos"}
        </button>
        <button onClick={refetch} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
          🔄
        </button>
      </div>

      <div className="space-y-2">
        {filtrado.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhum item encontrado</p>
        ) : (
          filtrado.map((item) => (
            <Card key={item.produto_id} className={item.alerta ? "border-red-200 bg-red-50" : ""}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.alerta && <span className="text-red-500 text-xs">⚠️</span>}
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.produto_nome}</p>
                  </div>
                  <p className="text-xs text-gray-500">{item.produto_codigo}</p>
                  {item.categoria && <Badge color="blue">{item.categoria}</Badge>}
                  {item.localizacao && (
                    <p className="text-xs text-blue-600 mt-1">📍 {item.localizacao}</p>
                  )}
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className={`text-lg font-bold ${item.alerta ? "text-red-600" : "text-gray-800"}`}>
                    {item.quantidade}
                  </p>
                  <p className="text-xs text-gray-500">{item.unidade}</p>
                  {item.estoque_minimo > 0 && (
                    <p className="text-xs text-gray-400">mín: {item.estoque_minimo}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ── Coletor (Movimentação via celular) ───────────────────────
function Coletor({ showToast }) {
  const [codigo, setCodigo] = useState("");
  const [produto, setProduto] = useState(null);
  const [tipo, setTipo] = useState("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [referencia, setReferencia] = useState("");
  const [operador, setOperador] = useState(localStorage.getItem("glm_operador") || "");
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const buscarProduto = async () => {
    if (!codigo.trim()) return;
    setBuscando(true);
    try {
      const data = await apiCall("GET", `/produtos/${codigo.trim().toUpperCase()}`);
      setProduto(data);
    } catch {
      showToast("Produto não encontrado: " + codigo, "error");
      setProduto(null);
    } finally {
      setBuscando(false);
    }
  };

  const registrar = async () => {
    if (!produto || !quantidade || parseFloat(quantidade) <= 0) {
      showToast("Preencha todos os campos corretamente", "error");
      return;
    }
    setSalvando(true);
    try {
      await apiCall("POST", "/movimentacoes/", {
        produto_id: produto.id,
        tipo,
        quantidade: parseFloat(quantidade),
        referencia: referencia || null,
        operador: operador || "operador",
      });
      localStorage.setItem("glm_operador", operador);
      showToast(`${tipo === "entrada" ? "📥 Entrada" : "📤 Saída"} registrada com sucesso!`, "success");
      setCodigo("");
      setProduto(null);
      setQuantidade("");
      setReferencia("");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0">
        <h2 className="text-white font-bold text-lg mb-1">📱 Coletor</h2>
        <p className="text-blue-100 text-sm">Registre movimentações pelo celular</p>
      </Card>

      <div className="flex gap-2">
        <button
          onClick={() => setTipo("entrada")}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
            tipo === "entrada" ? "bg-green-600 text-white shadow" : "bg-gray-100 text-gray-600"
          }`}
        >
          📥 Entrada
        </button>
        <button
          onClick={() => setTipo("saida")}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
            tipo === "saida" ? "bg-red-600 text-white shadow" : "bg-gray-100 text-gray-600"
          }`}
        >
          📤 Saída
        </button>
      </div>

      <Card>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Código do produto</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="Ex: CAB001 ou escaneie QR"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && buscarProduto()}
            className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
          />
          <button
            onClick={buscarProduto}
            disabled={buscando}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {buscando ? "..." : "🔎"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          💡 No celular: use leitor QR do sistema operacional e cole o código aqui
        </p>
      </Card>

      {produto && (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-blue-800">{produto.nome}</p>
                <p className="text-xs text-blue-600">{produto.codigo} • {produto.unidade}</p>
                {produto.categoria && <Badge color="blue">{produto.categoria}</Badge>}
              </div>
              <button onClick={() => setProduto(null)} className="text-gray-400 text-lg">✕</button>
            </div>
          </Card>

          <Card>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantidade ({produto.unidade})</label>
            <input
              type="number"
              placeholder="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full mt-1 px-3 py-3 border border-gray-200 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Referência</label>
              <input
                type="text"
                placeholder="NF, OS, Pedido..."
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </Card>
            <Card>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Operador</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </Card>
          </div>

          <button
            onClick={registrar}
            disabled={salvando}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition ${
              tipo === "entrada" ? "bg-green-600" : "bg-red-600"
            } disabled:opacity-50`}
          >
            {salvando ? "Registrando..." : tipo === "entrada" ? "✅ Confirmar Entrada" : "✅ Confirmar Saída"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Ordens de Serviço ─────────────────────────────────────────
function Ordens({ showToast }) {
  const { data: ordens, loading, refetch } = useApi("/ordens/", []);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [expandida, setExpandida] = useState(null);
  const [atualizando, setAtualizando] = useState(null);

  const statusColor = { pendente: "yellow", em_andamento: "blue", concluida: "green", cancelada: "gray" };
  const prioridadeColor = { baixa: "gray", normal: "blue", alta: "orange", urgente: "red" };

  const mudarStatus = async (ordemId, novoStatus) => {
    setAtualizando(ordemId);
    try {
      await apiCall("PATCH", `/ordens/${ordemId}/status?status=${novoStatus}`);
      showToast("Status atualizado!", "success");
      refetch();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setAtualizando(null);
    }
  };

  const filtradas = (ordens || []).filter(o => !filtroStatus || o.status === filtroStatus);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "pendente", "em_andamento", "concluida"].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filtroStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {s === "" ? "Todas" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Nenhuma ordem encontrada</p>
      ) : (
        filtradas.map((o) => (
          <Card key={o.id} className={expandida === o.id ? "ring-2 ring-blue-300" : ""}>
            <div className="flex justify-between items-start" onClick={() => setExpandida(expandida === o.id ? null : o.id)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700">OS #{o.id}</span>
                  <Badge color={statusColor[o.status]}>{o.status.replace("_", " ")}</Badge>
                  <Badge color={prioridadeColor[o.prioridade]}>{o.prioridade}</Badge>
                </div>
                <p className="text-sm text-gray-600 capitalize">{o.tipo.replace("_", " ")}</p>
                {o.cliente_fornecedor && <p className="text-xs text-gray-400">📍 {o.cliente_fornecedor}</p>}
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{new Date(o.criado_em).toLocaleDateString("pt-BR")}</p>
                <p className="text-lg">{expandida === o.id ? "▲" : "▼"}</p>
              </div>
            </div>

            {expandida === o.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                {o.observacao && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">💬 {o.observacao}</p>}
                
                {o.itens?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">ITENS DA ORDEM</p>
                    {o.itens.map((item) => (
                      <div key={item.id} className="flex justify-between py-1 text-sm border-b border-gray-50">
                        <span>Produto #{item.produto_id}</span>
                        <span className="font-medium">{item.quantidade_solicitada} un</span>
                      </div>
                    ))}
                  </div>
                )}

                {o.status === "pendente" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => mudarStatus(o.id, "em_andamento")}
                      disabled={atualizando === o.id}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      ▶ Iniciar
                    </button>
                    <button
                      onClick={() => mudarStatus(o.id, "cancelada")}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                )}
                {o.status === "em_andamento" && (
                  <button
                    onClick={() => mudarStatus(o.id, "concluida")}
                    disabled={atualizando === o.id}
                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                  >
                    ✅ Concluir OS
                  </button>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

// ── Assistente IA ─────────────────────────────────────────────
function AssistenteIA({ showToast }) {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [sugestaoReposicao, setSugestaoReposicao] = useState(null);
  const [carregandoReposicao, setCarregandoReposicao] = useState(false);

  const perguntas_rapidas = [
    "Quais itens precisam de reposição urgente?",
    "Como está o estoque geral?",
    "Quantas ordens estão pendentes?",
    "Me dê um resumo da situação atual",
    "Quais são os itens mais críticos?",
  ];

  const consultar = async (q = pergunta) => {
    if (!q.trim()) return;
    setCarregando(true);
    setResposta(null);
    try {
      const data = await apiCall("POST", "/ia/consulta", { pergunta: q });
      setResposta(data.resposta);
    } catch (e) {
      showToast("Erro ao consultar IA: " + e.message, "error");
    } finally {
      setCarregando(false);
    }
  };

  const sugerirReposicao = async () => {
    setCarregandoReposicao(true);
    setSugestaoReposicao(null);
    try {
      const data = await apiCall("POST", "/ia/sugerir-reposicao");
      setSugestaoReposicao(data.sugestoes);
    } catch (e) {
      showToast("Erro: " + e.message, "error");
    } finally {
      setCarregandoReposicao(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-0">
        <h2 className="text-white font-bold text-lg">🤖 ARIA</h2>
        <p className="text-purple-100 text-sm">Assistente de Inteligência em Almoxarifado</p>
      </Card>

      <button
        onClick={sugerirReposicao}
        disabled={carregandoReposicao}
        className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold active:scale-95 transition disabled:opacity-50"
      >
        {carregandoReposicao ? "🔄 Analisando estoque..." : "📊 Sugerir Reposição com IA"}
      </button>

      {sugestaoReposicao && (
        <Card className="border-orange-200 bg-orange-50">
          <h3 className="font-bold text-orange-700 mb-2">📋 Análise de Reposição</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sugestaoReposicao}</p>
        </Card>
      )}

      <Card>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Perguntas rápidas</p>
        <div className="flex flex-wrap gap-2">
          {perguntas_rapidas.map((p) => (
            <button
              key={p}
              onClick={() => { setPergunta(p); consultar(p); }}
              className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-200 active:bg-purple-100"
            >
              {p}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <label className="text-xs font-semibold text-gray-500 uppercase">Sua pergunta</label>
        <textarea
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex: Qual produto está mais crítico no estoque?"
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          onClick={() => consultar()}
          disabled={carregando || !pergunta.trim()}
          className="w-full mt-2 py-3 bg-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 active:scale-95 transition"
        >
          {carregando ? "🔄 Consultando ARIA..." : "💬 Perguntar para ARIA"}
        </button>
      </Card>

      {resposta && (
        <Card className="border-purple-200 bg-purple-50">
          <h3 className="font-bold text-purple-700 mb-2">🤖 ARIA responde:</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{resposta}</p>
        </Card>
      )}
    </div>
  );
}

// ── Cadastro de Produto ───────────────────────────────────────
function CadastroProduto({ showToast, onSalvo }) {
  const [form, setForm] = useState({
    codigo: "", nome: "", descricao: "", unidade: "UN",
    estoque_minimo: 0, categoria: "", fornecedor: ""
  });
  const [salvando, setSalvando] = useState(false);

  const campos = [
    { key: "codigo", label: "Código *", placeholder: "Ex: CAB001", upper: true },
    { key: "nome", label: "Nome *", placeholder: "Ex: Cabo Elétrico 1.5mm" },
    { key: "categoria", label: "Categoria", placeholder: "Ex: Elétrico, EPI, Mecânico..." },
    { key: "fornecedor", label: "Fornecedor", placeholder: "Ex: WEG, 3M..." },
    { key: "unidade", label: "Unidade", placeholder: "UN, KG, M, CX, L..." },
  ];

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const salvar = async () => {
    if (!form.codigo || !form.nome) {
      showToast("Código e nome são obrigatórios", "error");
      return;
    }
    setSalvando(true);
    try {
      await apiCall("POST", "/produtos/", form);
      showToast("✅ Produto cadastrado com sucesso!", "success");
      setForm({ codigo: "", nome: "", descricao: "", unidade: "UN", estoque_minimo: 0, categoria: "", fornecedor: "" });
      onSalvo?.();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="bg-gradient-to-br from-teal-600 to-teal-700 border-0">
        <h2 className="text-white font-bold text-lg">➕ Novo Produto</h2>
        <p className="text-teal-100 text-sm">Cadastre um produto no sistema</p>
      </Card>

      {campos.map(({ key, label, placeholder, upper }) => (
        <Card key={key}>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
          <input
            type="text"
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => set(key, upper ? e.target.value.toUpperCase() : e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </Card>
      ))}

      <Card>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estoque Mínimo</label>
        <input
          type="number"
          value={form.estoque_minimo}
          onChange={(e) => set("estoque_minimo", parseFloat(e.target.value) || 0)}
          min="0"
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        />
      </Card>

      <button
        onClick={salvar}
        disabled={salvando}
        className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg active:scale-95 transition disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "💾 Cadastrar Produto"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════
const TABS = [
  { id: "dashboard", icon: "🏠", label: "Início" },
  { id: "coletor", icon: "📱", label: "Coletor" },
  { id: "estoque", icon: "📦", label: "Estoque" },
  { id: "ordens", icon: "📋", label: "Ordens" },
  { id: "ia", icon: "🤖", label: "ARIA" },
  { id: "cadastro", icon: "➕", label: "Cadastrar" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const renderTab = () => {
    const props = { showToast };
    switch (tab) {
      case "dashboard": return <Dashboard {...props} />;
      case "coletor": return <Coletor {...props} />;
      case "estoque": return <Estoque {...props} />;
      case "ordens": return <Ordens {...props} />;
      case "ia": return <AssistenteIA {...props} />;
      case "cadastro": return <CadastroProduto {...props} onSalvo={() => setTab("estoque")} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-black text-gray-800 text-lg leading-none">GLM</h1>
          <p className="text-xs text-gray-400">Gerenciador Logístico Modular</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="px-4 py-4 pb-24">
        {renderTab()}
      </main>

      {/* Nav Bar inferior (mobile-first) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 shadow-xl">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2 transition ${
                tab === t.id ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">{t.label}</span>
              {tab === t.id && (
                <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
