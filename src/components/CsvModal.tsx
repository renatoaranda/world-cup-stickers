import React, { useState, useRef } from 'react';
import { Sticker } from '../types';
import { parseCSV } from '../csvHelper';
import { Upload, FileCode, CheckCircle, Database, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (importedData: Partial<Sticker>[], mode: 'merge' | 'replace') => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function CsvModal({
  isOpen,
  onClose,
  onApplyImport,
  onAddToast,
}: CsvModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Sticker>[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileContent = (text: string, name: string) => {
    try {
      setErrorMsg(null);
      const data = parseCSV(text);
      if (data.length === 0) {
        throw new Error('Nenhuma figurinha válida foi identificada no arquivo.');
      }
      setParsedData(data);
      setFileName(name);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar o arquivo CSV. Verifique a formatação.');
      setParsedData(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setErrorMsg('Por favor, faça upload apenas de arquivos CSV (.csv)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleFileContent(text, file.name);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleFileContent(text, file.name);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleApply = (mode: 'merge' | 'replace') => {
    if (parsedData) {
      onApplyImport(parsedData, mode);
      onAddToast(
        mode === 'merge' 
          ? 'Figurinhas mescladas com sucesso!' 
          : 'Álbum substituído completamente pelos dados do CSV!',
        'success'
      );
      handleClose();
    }
  };

  const handleClose = () => {
    setParsedData(null);
    setFileName('');
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const totalImported = parsedData?.length || 0;
  const ownedCount = parsedData?.filter((s) => s.owned).length || 0;
  const labeledCount = parsedData?.filter((s) => s.label).length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="csv-import-modal">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0f172a]/95 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 border border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Importar Figurinhas via CSV</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Carregue um arquivo CSV para atualizar ou restaurar suas figurinhas.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                id="close-csv-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs font-semibold flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold">Falha ao importar o arquivo</div>
                  <p className="font-medium mt-1 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {!parsedData ? (
              /* DROP ZONE */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  isDragging
                    ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
                id="csv-drag-drop-zone"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                
                <div className={`p-4 rounded-full mb-3 ${isDragging ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                  <Upload className="w-8 h-8" />
                </div>

                <h4 className="text-sm font-bold text-white">
                  {isDragging ? 'Solte o arquivo aqui!' : 'Arraste seu arquivo CSV ou clique para buscar'}
                </h4>
                
                <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                  O arquivo deve ter colunas identificadoras como <span className="font-mono text-amber-400 font-bold">id</span> ou <span className="font-mono text-amber-400 font-bold">code</span>, além de <span className="font-mono font-bold">owned</span>.
                </p>
              </div>
            ) : (
              /* PREVIEW DATA */
              <div className="space-y-6" id="csv-import-preview">
                {/* File info banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                  <FileCode className="w-10 h-10 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-white text-sm truncate">{fileName}</h5>
                    <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">{totalImported} figurinhas encontradas no arquivo</p>
                  </div>
                </div>

                {/* Statistics Box */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Visualização das alterações no Álbum
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Obtidas</span>
                      <p className="text-lg font-black text-emerald-400 mt-0.5">{ownedCount}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Nomeadas</span>
                      <p className="text-lg font-black text-indigo-400 mt-0.5">{labeledCount}</p>
                    </div>
                  </div>
                </div>

                {/* Select Mode and Actions */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Selecione o método de importação
                  </label>

                  {/* ACTION: MERGE */}
                  <button
                    onClick={() => handleApply('merge')}
                    className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/5 hover:bg-emerald-500/5 transition-all flex items-start gap-3 cursor-pointer group"
                    id="apply-import-merge"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                      <Database className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm flex items-center justify-between">
                        <span>Mesclar Dados (Recomendado)</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Atualiza as figurinhas do arquivo mantendo as que você já possui e apenas somando ou ajustando as repetidas e nomes.
                      </p>
                    </div>
                  </button>

                  {/* ACTION: REPLACE */}
                  <button
                    onClick={() => handleApply('replace')}
                    className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-rose-500/30 bg-white/5 hover:bg-rose-500/5 transition-all flex items-start gap-3 cursor-pointer group"
                    id="apply-import-replace"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
                      <X className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm flex items-center justify-between">
                        <span>Substituir Tudo (Sobrescrever)</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Limpa totalmente o seu álbum atual e carrega exatamente o estado que está detalhado no arquivo CSV. <span className="text-rose-400 font-bold">Ação irreversível!</span>
                      </p>
                    </div>
                  </button>
                </div>

                {/* Back button */}
                <div className="flex justify-start">
                  <button
                    onClick={() => {
                      setParsedData(null);
                      setFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    id="csv-back-to-upload"
                  >
                    ← Carregar outro arquivo
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

