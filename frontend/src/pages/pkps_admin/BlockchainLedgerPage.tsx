import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Shield, CheckCircle2, AlertTriangle, Cpu, Link2, Hash, Lock,
  Layers, Activity, RefreshCw, ChevronDown, ChevronUp, Eye,
  Anchor, Network, GitBranch, Zap, Box, Database
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface BlockTx {
  id: string;
  tx_index: number;
  tx_hash: string;
  tx_type: string;
  actor_username: string | null;
  entity_type: string;
  entity_id: string;
  amount: string;
  merkle_proof: Array<{ position: 'left' | 'right'; hash: string }> | null;
  created_at: string;
}

interface Block {
  id: string;
  block_index: number;
  previous_hash: string;
  merkle_root: string;
  block_hash: string;
  nonce: number;
  difficulty: number;
  tx_count: number;
  is_anchored: boolean;
  anchor_network: string;
  anchor_tx_hash: string;
  anchor_timestamp: string | null;
  sealed_at: string;
  transactions: BlockTx[];
  tenant_code?: string;
}

interface ChainStats {
  total_blocks: number;
  total_transactions: number;
  pending_transactions: number;
  latest_block_index: number | null;
  latest_block_hash: string | null;
  anchor_network: string;
  latest_anchor_tx: string | null;
}

interface VerifyReport {
  chain_intact: boolean;
  total_blocks: number;
  total_transactions: number;
  anchored_blocks: number;
  latest_block_hash?: string;
  compromised_block?: number | null;
  error?: string;
  message?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const truncate = (str: string, start = 8, end = 6) =>
  str ? `${str.slice(0, start)}...${str.slice(-end)}` : '—';

const formatAmount = (a: string) => {
  const n = parseFloat(a);
  if (!n) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
};

const TX_COLORS: Record<string, string> = {
  GENESIS_INIT: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  LOAN_DISBURSEMENT: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LOAN_DISBURSED: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  SAVINGS_DEPOSIT: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  SHARE_ALLOTMENT: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  LOGIN_SUCCESS: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  LOGIN_FAILED: 'text-red-400 bg-red-500/10 border-red-500/30',
  TENANT_ONBOARDED: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
};

const txColor = (type: string) =>
  TX_COLORS[type] ?? 'text-slate-300 bg-slate-700/30 border-slate-600/30';

// ── Merkle Proof Visualiser ──────────────────────────────────────────────────

const MerkleProofViewer: React.FC<{ tx: BlockTx; root: string }> = ({ tx, root }) => {
  const [proofVisible, setProofVisible] = useState(false);
  const proof = tx.merkle_proof ?? [];

  return (
    <div className="mt-2">
      <button
        onClick={() => setProofVisible(v => !v)}
        className="flex items-center gap-1.5 text-xs text-cyan-400/80 hover:text-cyan-300 transition font-mono"
      >
        <GitBranch className="w-3 h-3" />
        {proofVisible ? 'Hide' : 'Show'} Merkle Proof ({proof.length} steps)
      </button>
      {proofVisible && (
        <div className="mt-2 rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-2">
            <span className="text-emerald-400">Leaf:</span>
            <span className="text-slate-300">{truncate(tx.tx_hash, 12, 8)}</span>
          </div>
          {proof.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${step.position === 'left' ? 'border-violet-500/40 text-violet-400 bg-violet-500/10' : 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'}`}>
                {step.position}
              </span>
              <span className="text-slate-400">{truncate(step.hash, 10, 8)}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono pt-1 border-t border-slate-700/50">
            <span className="text-amber-400">Root:</span>
            <span className="text-slate-300">{truncate(root, 12, 8)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Block Card ────────────────────────────────────────────────────────────────

const BlockCard: React.FC<{ block: Block; isFirst: boolean }> = ({ block, isFirst }) => {
  const [expanded, setExpanded] = useState(isFirst);

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isFirst
        ? 'border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 shadow-lg shadow-emerald-500/5'
        : 'border-slate-800/60 bg-slate-900/70'
    }`}>
      {/* Block Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-5 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Block Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isFirst
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              <Box className="w-5 h-5 stroke-[2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-100">
                  Block #{block.block_index}
                </span>
                {block.block_index === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
                    Genesis
                  </span>
                )}
                {isFirst && block.block_index > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    Latest
                  </span>
                )}
                {block.is_anchored && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider flex items-center gap-1">
                    <Anchor className="w-2.5 h-2.5" />
                    Anchored
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                Hash: {truncate(block.block_hash, 14, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {/* Stats pill row */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-slate-500">Txns</p>
                <p className="text-sm font-bold text-emerald-400">{block.tx_count}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Nonce</p>
                <p className="text-sm font-bold text-cyan-400">{block.nonce.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Difficulty</p>
                <p className="text-sm font-bold text-violet-400">{block.difficulty}</p>
              </div>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </div>
        </div>
      </button>

      {/* Expanded Block Body */}
      {expanded && (
        <div className="border-t border-slate-800/60 px-5 pb-5 space-y-5 pt-4">
          {/* Hash Chain Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Previous Hash', value: block.previous_hash, icon: Link2, color: 'text-slate-400' },
              { label: 'Merkle Root', value: block.merkle_root, icon: GitBranch, color: 'text-amber-400' },
              { label: 'Block Hash (PoW)', value: block.block_hash, icon: Hash, color: 'text-emerald-400' },
              { label: 'Anchor Tx (Polygon)', value: block.anchor_tx_hash, icon: Anchor, color: 'text-cyan-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl bg-slate-950/70 border border-slate-800/60 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
                </div>
                <p className={`font-mono text-xs ${color} break-all leading-relaxed`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-violet-400" />Nonce: <b className="text-violet-300">{block.nonce.toLocaleString()}</b></span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" />Difficulty: <b className="text-amber-300">{'0'.repeat(block.difficulty)}...</b></span>
            <span className="flex items-center gap-1"><Network className="w-3.5 h-3.5 text-cyan-400" />Network: <b className="text-cyan-300">{block.anchor_network}</b></span>
            <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-slate-400" />Sealed: <b className="text-slate-200">{new Date(block.sealed_at).toLocaleString('en-IN')}</b></span>
          </div>

          {/* Transactions */}
          {block.transactions && block.transactions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                Block Transactions ({block.transactions.length})
              </h4>
              <div className="space-y-2">
                {block.transactions.map((tx) => (
                  <div key={tx.id} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-mono">#{tx.tx_index}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${txColor(tx.tx_type)}`}>
                          {tx.tx_type}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{tx.entity_type}:{tx.entity_id}</span>
                        {tx.actor_username && (
                          <span className="text-xs text-slate-500">by <span className="text-slate-300">{tx.actor_username}</span></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {formatAmount(tx.amount) && (
                          <span className="text-xs font-bold text-emerald-400">{formatAmount(tx.amount)}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-cyan-500/70 mt-1.5 truncate">Tx: {tx.tx_hash}</p>
                    <MerkleProofViewer tx={tx} root={block.merkle_root} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const BlockchainLedgerPage: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [verifyReport, setVerifyReport] = useState<VerifyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sealing, setSealing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocksRes, statsRes] = await Promise.all([
        api.get('/audit/blockchain/'),
        api.get('/audit/blockchain/stats/'),
      ]);
      setBlocks(blocksRes.data?.results ?? blocksRes.data ?? []);
      setStats(statsRes.data);
    } catch {
      setError('Failed to load blockchain data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/audit/blockchain/verify-chain/');
      setVerifyReport(res.data);
    } catch {
      setError('Verification request failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSealBlock = async () => {
    setSealing(true);
    try {
      await api.post('/audit/blockchain/seal-block/', {});
      await fetchAll();
      await handleVerify();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || 'Seal failed.';
      setError(msg);
    } finally {
      setSealing(false);
    }
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            Blockchain Ledger Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            SHA-256 Proof-of-Work · Merkle Tree · Polygon PoS Anchored · Tamper-Evident
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition text-sm font-medium disabled:opacity-50"
          >
            <Shield className={`w-4 h-4 ${verifying ? 'animate-pulse' : ''}`} />
            {verifying ? 'Verifying…' : 'Verify Chain'}
          </button>
          <button
            onClick={handleSealBlock}
            disabled={sealing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition text-sm font-bold disabled:opacity-50"
          >
            <Lock className={`w-4 h-4 ${sealing ? 'animate-pulse' : ''}`} />
            {sealing ? 'Mining…' : 'Seal Block'}
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Blocks', value: stats.total_blocks, icon: Box, color: 'text-violet-400' },
            { label: 'Total Txns', value: stats.total_transactions, icon: Activity, color: 'text-emerald-400' },
            { label: 'Pending Txns', value: stats.pending_transactions, icon: Database, color: 'text-amber-400' },
            { label: 'Latest Block', value: stats.latest_block_index ?? '—', icon: Layers, color: 'text-cyan-400' },
            { label: 'Anchor Network', value: stats.anchor_network, icon: Network, color: 'text-sky-400' },
            { label: 'Anchored Hash', value: stats.latest_anchor_tx ? truncate(stats.latest_anchor_tx, 6, 4) : '—', icon: Anchor, color: 'text-teal-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-slate-900 border border-slate-800/60 p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
              </div>
              <p className={`text-lg font-bold ${color} font-mono truncate`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Verification Report Banner ── */}
      {verifyReport && (
        <div className={`rounded-2xl border p-5 ${
          verifyReport.chain_intact
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-red-950/30 border-red-500/40'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              verifyReport.chain_intact ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {verifyReport.chain_intact
                ? <CheckCircle2 className="w-7 h-7" />
                : <AlertTriangle className="w-7 h-7" />
              }
            </div>
            <div className="min-w-0">
              <h3 className={`text-base font-bold ${verifyReport.chain_intact ? 'text-emerald-300' : 'text-red-300'}`}>
                {verifyReport.chain_intact ? 'Cryptographic Chain Integrity VERIFIED' : 'CHAIN TAMPERED — Integrity Compromised!'}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {verifyReport.chain_intact ? verifyReport.message : verifyReport.error}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                <span>Blocks verified: <b className="text-slate-200">{verifyReport.total_blocks}</b></span>
                <span>Transactions: <b className="text-slate-200">{verifyReport.total_transactions}</b></span>
                <span>Anchored blocks: <b className="text-slate-200">{verifyReport.anchored_blocks}</b></span>
                {verifyReport.compromised_block != null && (
                  <span className="text-red-400">
                    Compromised at Block #{verifyReport.compromised_block}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Block Chain Visual ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
          Loading blockchain data…
        </div>
      ) : blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <Layers className="w-12 h-12 text-slate-700" />
          <p className="text-base">No blocks minted yet.</p>
          <p className="text-sm">Click <span className="text-emerald-400 font-semibold">Seal Block</span> to mine the Genesis Block.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <React.Fragment key={block.id}>
              <BlockCard block={block} isFirst={idx === 0} />
              {idx < blocks.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-4 bg-gradient-to-b from-slate-600 to-slate-700" />
                    <Link2 className="w-4 h-4 text-slate-600" />
                    <div className="w-px h-4 bg-gradient-to-b from-slate-700 to-slate-800" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
