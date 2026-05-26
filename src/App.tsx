import React, { useState, useEffect, useRef } from "react";
import { Sticker, Team, AlbumStats } from "./types";
import { TEAMS, generateDefaultStickers } from "./data";
import { exportToCSV, downloadCSV } from "./csvHelper";
import StickerGrid from "./components/StickerGrid";
import CsvModal from "./components/CsvModal";
import Toast, { ToastMessage } from "./components/Toast";
import {
  Trophy,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Heart,
  HelpCircle,
  Sparkles,
  Info,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LOCAL_STORAGE_KEY = "copa_stickers_tracker_v2";

export default function App() {
  // 1. Core State
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [activeScrollTeam, setActiveScrollTeam] = useState<string>("FWC");
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<any>(null);

  // 2. Initialize from localStorage or default
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Sticker[];
        // Sanity check: Ensure we have the right amount of stickers and valid teams
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultList = generateDefaultStickers();
          const hasInvalidTeam = parsed.some(
            (s) => !TEAMS.some((t) => t.id === s.teamId),
          );
          if (parsed.length !== defaultList.length || hasInvalidTeam) {
            setStickers(defaultList);
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify(defaultList),
            );
          } else {
            setStickers(parsed);
          }
        } else {
          setStickers(generateDefaultStickers());
        }
      } catch (err) {
        console.error(
          "Falha ao ler dados do localStorage. Iniciando padrão.",
          err,
        );
        setStickers(generateDefaultStickers());
      }
    } else {
      setStickers(generateDefaultStickers());
    }
  }, []);

  // Track currently active visible team for sticky side navigation
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-130px 0px -60% 0px", // Offset of the sticky top header
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isProgrammaticScrollRef.current) {
        return; // Ignore intersection observer updates while scrolling programmatically
      }
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace("team-section-", "");
          setActiveScrollTeam(id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    TEAMS.forEach((team) => {
      const el = document.getElementById(`team-section-${team.id}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [stickers]); // run when stickers state updates the visible layout.

  // Automatically scroll the active team shortcut button into view horizontally inside the ribbon
  useEffect(() => {
    const activeBtn = document.getElementById(
      `global-shortcut-${activeScrollTeam}`,
    );
    const ribbon = document.getElementById("global-shortcuts-ribbon");
    if (activeBtn && ribbon) {
      const ribbonRect = ribbon.getBoundingClientRect();
      const activeRect = activeBtn.getBoundingClientRect();
      const offsetLeft = activeRect.left - ribbonRect.left + ribbon.scrollLeft;
      const targetScrollLeft =
        offsetLeft - ribbonRect.width / 2 + activeRect.width / 2;
      ribbon.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
    }
  }, [activeScrollTeam]);

  // Keep top (FWC) and bottom (COCA) active team states synchronized safely on raw page scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;

      const isBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 100;
      const isTop = window.scrollY < 80;

      if (isBottom) {
        setActiveScrollTeam("COCA");
      } else if (isTop) {
        setActiveScrollTeam("FWC");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Sync to localStorage when modified
  const saveStickers = (updatedStickers: Sticker[]) => {
    setStickers(updatedStickers);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedStickers));
  };

  // 4. Toast actions
  const addToast = (message: string, type: "success" | "error" | "info") => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 5. Calculate statistics
  const totalStickersCount = stickers.length;
  const ownedStickersCount = stickers.filter((s) => s.owned).length;
  const missingStickersCount = totalStickersCount - ownedStickersCount;
  const totalDuplicatesCount = stickers.reduce(
    (sum, s) => sum + s.duplicates,
    0,
  );
  const completionPercent =
    totalStickersCount > 0
      ? Math.round((ownedStickersCount / totalStickersCount) * 100)
      : 0;

  const stats: AlbumStats = {
    total: totalStickersCount,
    owned: ownedStickersCount,
    missing: missingStickersCount,
    duplicates: totalDuplicatesCount,
    percent: completionPercent,
  };

  // 6. Sticker interactions
  const handleToggleOwned = (id: string) => {
    const index = stickers.findIndex((s) => s.id === id);
    if (index !== -1) {
      const updated = [...stickers];
      const sticker = updated[index];
      const newOwned = !sticker.owned;

      updated[index] = {
        ...sticker,
        owned: newOwned,
        // If they no longer own it, duplicates must be 0
        duplicates: newOwned ? sticker.duplicates : 0,
      };

      saveStickers(updated);
    }
  };

  const handleBulkSetOwned = (teamId: string, owned: boolean) => {
    const updated = stickers.map((sticker) => {
      if (sticker.teamId === teamId) {
        return {
          ...sticker,
          owned: owned,
          duplicates: owned ? sticker.duplicates : 0,
        };
      }
      return sticker;
    });

    saveStickers(updated);
    const teamName = TEAMS.find((t) => t.id === teamId)?.name || teamId;
    addToast(
      owned
        ? `Todas as figurinhas de ${teamName} marcadas como obtidas! 🇧🇷`
        : `Limpamos suas figurinhas de ${teamName}. Progresso resetado nesta seleção.`,
      owned ? "success" : "info",
    );
  };

  const handleUpdateLabel = (id: string, label: string) => {
    const index = stickers.findIndex((s) => s.id === id);
    if (index !== -1) {
      const updated = [...stickers];
      updated[index] = {
        ...updated[index],
        label: label.trim() || undefined,
      };
      saveStickers(updated);
      addToast(`Identificação da figurinha atualizada!`, "success");
    }
  };

  // 7. CSV Export
  const handleExportCSV = () => {
    try {
      if (stickers.length === 0) {
        addToast("Não há figurinhas para exportar.", "error");
        return;
      }
      // Generate object mapping team IDs to their names
      const teamNamesMap: Record<string, string> = {};
      TEAMS.forEach((t) => {
        teamNamesMap[t.id] = t.name;
      });

      const csvContent = exportToCSV(stickers, teamNamesMap);
      downloadCSV(
        csvContent,
        `album_copa_progresso_${completionPercent}percent.csv`,
      );
      addToast(
        "Exportação concluída! Verifique sua pasta de downloads. 📥",
        "success",
      );
    } catch (err) {
      console.error(err);
      addToast(
        "Infelizmente, ocorreu um erro ao gerar a exportação CSV.",
        "error",
      );
    }
  };

  // 8. CSV Import Apply
  const handleApplyImport = (
    importedData: Partial<Sticker>[],
    mode: "merge" | "replace",
  ) => {
    let baseStickers =
      mode === "replace" ? generateDefaultStickers() : [...stickers];

    // Build map of identifier (id or code) to values
    const updated = baseStickers.map((sticker) => {
      // Find matching entry in CSV
      const match = importedData.find(
        (csvCell) =>
          (csvCell.id &&
            csvCell.id.toLowerCase() === sticker.id.toLowerCase()) ||
          (csvCell.code &&
            csvCell.code.replace(/\s+/g, "").toLowerCase() ===
              sticker.code.replace(/\s+/g, "").toLowerCase()),
      );

      if (match) {
        return {
          ...sticker,
          owned: match.owned !== undefined ? match.owned : sticker.owned,
          duplicates:
            match.duplicates !== undefined
              ? match.duplicates
              : sticker.duplicates,
          label: match.label !== undefined ? match.label : sticker.label,
        };
      }
      return sticker;
    });

    saveStickers(updated);
  };

  // 9. Full Reset Action
  const handleResetAll = () => {
    const defaultList = generateDefaultStickers();
    saveStickers(defaultList);
    setShowResetConfirm(false);
    addToast("O seu álbum foi zerado completamente.", "info");
  };

  // 10. Core Filters Pipeline
  const filteredStickers = stickers;

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400/20 selection:text-amber-100 relative overflow-x-clip"
      id="main-application-viewport"
    >
      {/* 🔮 Mesh gradient styling background */}
      <div className="mesh-bg"></div>

      {/* 🏆 HERO HEADER HEADER ROW (STICKY) */}
      <header
        className="sticky top-0 z-40 bg-[#070b19]/95 backdrop-blur-md border-b border-white/5 shadow-xl select-none"
        id="main-app-header"
      >
        {/* Subtle background effects */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-slate-500 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[250px] h-[250px] rounded-full bg-amber-400 blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3.5 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
            {/* Title Block */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-md flex items-center justify-center select-none animate-pulse-subtle"
                id="logo-icon-container"
              >
                <Trophy className="w-5 h-5 font-black stroke-[2.5]" />
              </div>
              <div>
                <h1
                  className="text-xl md:text-2xl font-black tracking-tight text-white leading-none"
                  id="app-title-header"
                >
                  Figurinhas da Copa 2026 ⚽
                </h1>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Total Faltante Info Panel */}
              <div
                className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1.5 select-none shadow-sm"
                id="header-missing-indicator-small"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                    Faltas
                  </span>
                  <span className="text-xs font-extrabold text-rose-400 leading-none mt-1">
                    {stats.missing}{" "}
                    <span className="text-[8px] font-mono text-slate-500">
                      / {stats.total}
                    </span>
                  </span>
                </div>
                <div className="p-0.5 rounded bg-rose-500/10 text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </div>

              {/* Import CSV Modal Button */}
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/5 flex items-center gap-2 cursor-pointer h-9"
                id="header-action-import"
                title="Fazer upload de CSV para sincronizar"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Upload (CSV)</span>
                <span className="sm:hidden">Upload</span>
              </button>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer h-9"
                id="header-action-export"
                title="Exportar suas figurinhas para uma planilha Excel/CSV"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 🧭 NAVIGATION shortcuts row inside global sticky header */}
        <div className="border-t border-white/5 bg-slate-900/40 py-1.5 md:py-2 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="flex overflow-x-auto md:flex-wrap gap-1.5 pb-1.5 md:pb-0 scrollbar-none snap-x justify-start"
              id="global-shortcuts-ribbon"
            >
              {TEAMS.map((team) => {
                const isActive = activeScrollTeam === team.id;
                return (
                  <button
                    key={team.id}
                    id={`global-shortcut-${team.id}`}
                    onClick={() => {
                      const el = document.getElementById(
                        `team-section-${team.id}`,
                      );
                      if (el) {
                        isProgrammaticScrollRef.current = true;
                        setActiveScrollTeam(team.id);
                        if (scrollTimeoutRef.current) {
                          clearTimeout(scrollTimeoutRef.current);
                        }
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        scrollTimeoutRef.current = setTimeout(() => {
                          isProgrammaticScrollRef.current = false;
                        }, 850);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase shrink-0 snap-center cursor-pointer transition-all border ${
                      isActive
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/25 scale-105 font-black"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/5"
                    }`}
                    title={team.name}
                  >
                    {team.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* 🧭 APP MAIN BODY WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1.5 md:pt-4 pb-8">
        {/* QUICK TOUR ALERT BAR */}
        <div className="mb-2.5 md:mb-4 bg-white/5 border border-white/5 rounded-xl py-2 md:py-2.5 px-3 md:px-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              Como usar: Toque nas figurinhas para marcar ou desmarcar do álbum.
              No menu flutuante do topo, use as abreviações rápidas para rolar a
              tela diretamente até a seleção desejada!
            </p>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 shrink-0 cursor-pointer"
            id="toggle-instructions-btn"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showGuide ? "Ocultar Detalhes" : "Ver Guia Completo"}</span>
          </button>
        </div>

        {/* DETAILED ACCORDION GUIDE */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden glass-panel mb-6 p-6 space-y-4 shadow-xl"
              id="guide-accordion-content"
            >
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Guia de Utilização do Organizador de Figurinhas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
                <div className="space-y-2">
                  <h5 className="font-extrabold text-white flex items-center gap-1.5">
                    <span className="p-1 px-2 rounded bg-white/10 text-amber-400 font-mono">
                      1
                    </span>
                    Persistência e Auto-salvamento
                  </h5>
                  <p className="leading-relaxed text-slate-400">
                    Cada alteração feita clicando nas figurinhas salva seu
                    progresso na memória local (localStorage) de seu navegador.
                    Você pode recarregar ou retornar para continuar sempre de
                    onde parou.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-extrabold text-white flex items-center gap-1.5">
                    <span className="p-1 px-2 rounded bg-white/10 text-amber-400 font-mono">
                      2
                    </span>
                    Importação e Mesclagem Inteligente
                  </h5>
                  <p className="leading-relaxed text-slate-400">
                    Ao fazer o upload (CSV), você pode optar por{" "}
                    <strong>Mesclar Dados</strong>. Isso evita perder seu
                    progresso atual: as figurinhas contidas no arquivo serão
                    unidas com as que você já possui. Ou use Sobrescrever para
                    carregar o estado idêntico ao do CSV.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-extrabold text-white flex items-center gap-1.5">
                    <span className="p-1 px-2 rounded bg-white/10 text-amber-400 font-mono">
                      3
                    </span>
                    Estrutura de Planilha Compatível
                  </h5>
                  <p className="leading-relaxed text-slate-400">
                    Você pode gerar seu próprio arquivo usando Excel ou Google
                    Sheets. Certifique-se de que a planilha possui colunas
                    intituladas como <code>id</code> ou <code>code</code>, além
                    de <code>owned</code> (usar 1 para obtido).
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STICKER GRID CONTENT */}
        <div className="relative" id="main-content-scroller">
          <StickerGrid
            stickers={filteredStickers}
            teams={TEAMS}
            onToggleOwned={handleToggleOwned}
            onBulkSetOwned={handleBulkSetOwned}
          />
        </div>
      </main>

      {/* 🔮 FOOTER BAR SECTION */}
      <footer
        className="bg-slate-950/40 border-t border-white/5 text-slate-400 text-xs py-8 mt-12 shrink-0 select-none relative z-10 font-sans"
        id="main-app-footer"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center items-center gap-1 font-bold text-slate-300">
            <span>
              Desenvolvido com carinho para os colecionadores de figurinhas do
              álbum da Copa do Mundo
            </span>
            <Heart className="w-4.5 h-4.5 text-rose-500 fill-rose-500" />
          </div>

          <div className="flex justify-center items-center gap-1 font-bold text-slate-300">
            <span>
              <a
                href="https://github.com/renatoaranda/world-cup-stickers"
                className="text-rose-400 hover:text-rose-300 underline"
              >
                @renatoaranda
              </a>
            </span>
          </div>
          <div className="text-slate-500 max-w-lg mx-auto leading-relaxed">
            Este aplicativo é privado e seguro. Seus dados não são enviados para
            nenhum servidor ou nuvem corporativa; eles permanecem 100% gravados
            em localStorage no seu dispositivo local. Faça backups periódicos
            através do botão "Exportar CSV". Caso queira importar ou restaurar
            seu progresso, use o botão "Upload CSV" para carregar seu arquivo
            salvo. O aplicativo é totalmente gratuito, sem anúncios ou compras
            internas, e foi criado por um fã para outros fãs. Aproveite a
            organização do seu álbum e boa sorte completando sua coleção de
            figurinhas da Copa do Mundo! 🌍⚽
          </div>
          <div className="text-[10px] text-slate-600 font-mono">
            {new Date().getFullYear()} • Controle de Figurinhas v2.2.0 •
            Totalmente sem anúncios
          </div>
        </div>
      </footer>

      {/* ⚠️ DUAL RESET CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {showResetConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 py-8"
            id="reset-confirm-modal"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a]/95 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 border border-white/10 backdrop-blur-xl text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white">
                Tem certeza que deseja zerar o álbum?
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Esta ação irá marcar todas as 660 figurinhas como "Não obtidas",
                remover todos os nomes de jogadores cadastrados e limpar
                quaisquer figurinhas repetidas salvas no banco de dados local.
              </p>

              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-300 font-bold mt-3">
                ⚠️ Atenção: Esta ação não pode ser desfeita após aplicada!
              </div>

              <div className="flex gap-3 justify-center pt-5">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  id="cancel-reset-btn"
                >
                  Voltar ao Álbum
                </button>
                <button
                  onClick={handleResetAll}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
                  id="confirm-reset-btn"
                >
                  Sim, Limpar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📥 CSV FILE UPLOAD MODAL COMPONENT */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onApplyImport={handleApplyImport}
        onAddToast={addToast}
      />

      {/* 🔔 FLOATING NOTIFICATION WRAPPER */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
