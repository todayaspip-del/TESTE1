import React, { useState } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { History, ShieldCheck, Filter, Search, RotateCcw, Lock } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { auditLogs, resetData } = useLmsData();
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (
      searchTerm &&
      !log.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.userRole.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Trilha de Conformidade & Integridade</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Logs de Auditoria Imutáveis e Controle RBAC
          </h1>
          <p className="text-xs text-slate-400">
            Registro de todas as ações pedagógicas, autenticações de papéis militares, emissão de certificados e progresso de aulas.
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 text-slate-300 hover:text-orange-400 text-xs font-bold transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Base Inicial</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome de usuário, ação ou perfil..."
            className="w-full pl-10 pr-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="ALL">Todas as Ações</option>
          <option value="LESSON_PROGRESS_UPDATE">Atualização de Vídeo</option>
          <option value="LESSON_COMPLETED">Aula Concluída</option>
          <option value="CERTIFICATE_ISSUED">Certificado Emitido</option>
          <option value="QUIZ_SUBMITTED">Simulado Realizado</option>
          <option value="COMMENT_POSTED">Dúvida Postada</option>
          <option value="LESSON_SAVED">Aula Editada</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-none bg-[#121418] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0b0e] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="p-4 pl-6">Data / Hora</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Perfil RBAC</th>
                <th className="p-4">Ação Executada</th>
                <th className="p-4 pr-6">Metadados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 pl-6 text-slate-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 font-bold text-white font-sans text-xs">
                      {log.userName}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-none bg-[#0c0b0e] border border-slate-700 text-[10px] font-bold text-orange-400">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-none bg-orange-950 text-orange-400 border border-orange-800 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Base Inicial"
        message="Tem certeza que deseja limpar todas as alterações e restaurar os dados iniciais do Vulcan LMS? Todas as edições não salvas no seed serão redefinidas."
        confirmText="Restaurar Base"
        onConfirm={() => {
          resetData();
          setIsResetConfirmOpen(false);
        }}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
