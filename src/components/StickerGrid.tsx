import React from "react";
import { Sticker, Team } from "../types";
import { Check, Info, ClipboardCopy, Trash2 } from "lucide-react";

interface StickerGridProps {
  stickers: Sticker[];
  teams: Team[];
  onToggleOwned: (id: string) => void;
  onBulkSetOwned: (teamId: string, owned: boolean) => void;
}

export default function StickerGrid({
  stickers,
  teams,
  onToggleOwned,
  onBulkSetOwned,
}: StickerGridProps) {
  // Group stickers by team
  const stickersByTeam = stickers.reduce<Record<string, Sticker[]>>(
    (acc, sticker) => {
      if (!acc[sticker.teamId]) {
        acc[sticker.teamId] = [];
      }
      acc[sticker.teamId].push(sticker);
      return acc;
    },
    {},
  );

  // Find teams that actually have matching stickers after filter is applied
  const activeTeams = teams.filter(
    (team) => stickersByTeam[team.id]?.length > 0,
  );

  if (activeTeams.length === 0) {
    return (
      <div
        className="glass-panel p-12 text-center flex flex-col items-center justify-center min-h-[300px]"
        id="no-matching-stickers"
      >
        <div className="w-16 h-16 bg-white/5 text-amber-400 border border-white/5 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-black text-white">
          Nenhuma figurinha correspondente
        </h4>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Tente ajustar sua busca ou seus filtros para encontrar as figurinhas
          desejadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="sticker-grid-sections-container">
      {activeTeams.map((team) => {
        const teamStickers = stickersByTeam[team.id];
        const ownedCount = teamStickers.filter((s) => s.owned).length;
        const totalCount = teamStickers.length;
        const completionRate = Math.round((ownedCount / totalCount) * 100);

        return (
          <div
            key={team.id}
            className="glass-panel p-5 shadow-xl scroll-mt-[100px] md:scroll-mt-[145px]"
            id={`team-section-${team.id}`}
          >
            {/* Country Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="text-3xl leading-none select-none"
                  role="img"
                  aria-label={team.name}
                >
                  {team.flag}
                </span>
                <div>
                  <h4 className="text-lg font-black text-white flex items-center gap-2">
                    {team.name}
                    <span className="text-xs font-mono font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                      {team.id}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {team.group}
                  </p>
                </div>
              </div>

              {/* Progress and actions */}
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex flex-col items-end shrink-0 select-none">
                  <span className="text-xs font-bold text-slate-300">
                    Progresso: {ownedCount} / {totalCount} ({completionRate}%)
                  </span>
                  <div className="w-28 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onBulkSetOwned(team.id, true)}
                    className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    title="Marcar toda a seleção como obtida"
                    id={`bulk-check-${team.id}`}
                  >
                    <ClipboardCopy className="w-3.5 h-3.5" />
                    <span>Todas</span>
                  </button>
                  <button
                    onClick={() => onBulkSetOwned(team.id, false)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    title="Remover todas desta seleção"
                    id={`bulk-clear-${team.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Zerar</span>
                  </button>
                </div> */}
              </div>
            </div>
            {/* Sticker Numbers Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {teamStickers.map((sticker) => {
                const isSpecial = team.id === "FWC";
                return (
                  <div
                    key={sticker.id}
                    onClick={() => onToggleOwned(sticker.id)}
                    className={`relative rounded-xl p-2.5 flex flex-col justify-between h-[80px] cursor-pointer transition-all duration-200 group overflow-hidden ${
                      sticker.owned
                        ? isSpecial
                          ? "sticker-special-got"
                          : "sticker-got"
                        : isSpecial
                          ? "sticker-special-missing"
                          : "sticker-missing"
                    }`}
                    id={`sticker-card-${sticker.id}`}
                  >
                    {/* Badge / Special Star or Number */}
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black tracking-wider opacity-60">
                        {sticker.teamId}
                      </span>
                    </div>

                    {/* Big center number */}
                    <div className="flex flex-col items-center justify-center flex-1 my-0.5">
                      <span className="text-sm font-extrabold font-mono tracking-tight leading-none">
                        {sticker.number}
                      </span>
                    </div>

                    {/* Little check overlay */}
                    {sticker.owned && (
                      <div className="absolute top-1 right-1 pointer-events-none opacity-10">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
