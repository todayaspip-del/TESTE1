import React, { useState } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import { CertificateModal } from '../certificate/CertificateModal';
import { Award, ShieldCheck, CheckCircle, Search, QrCode, ExternalLink, Flame } from 'lucide-react';
import { Certificate } from '../../types';

export const StudentCertificates: React.FC = () => {
  const { certificates, getCertificateByCode } = useLmsData();
  const { currentUser } = useAuth();

  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null | undefined>(undefined);

  const userCertificates = currentUser
    ? certificates.filter((c) => c.studentId === currentUser.id)
    : [];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    const found = getCertificateByCode(searchCode);
    setVerifiedCert(found || null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Certificações Oficiais & Habilitação Profissional</span>
        </div>
        <h1 className="text-2xl font-black text-white">
          Registro de Diplomas NBR 14608 e Portarias Estaduais
        </h1>
        <p className="text-xs text-slate-400">
          Validação pública com código de autenticidade criptográfico e verificação por QR Code.
        </p>
      </div>

      {/* Public Certificate Validator Tool */}
      <div className="p-6 rounded-none bg-[#121418] border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Validador Público de Autenticidade de Certificado
        </h3>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => {
              setSearchCode(e.target.value);
              setVerifiedCert(undefined);
            }}
            placeholder="Digite o código do certificado (ex: BC-2026-BR-9842)..."
            className="flex-1 px-4 py-2.5 rounded-none bg-[#0c0b0e] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-orange-950/40"
          >
            Consultar Registro
          </button>
        </form>

        {/* Verification Result */}
        {verifiedCert !== undefined && (
          <div className="pt-2">
            {verifiedCert ? (
              <div className="p-4 rounded-none bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      CERTIFICADO AUTÊNTICO E ATIVO
                    </div>
                    <div className="text-xs text-slate-200">
                      Aluno: <strong className="text-white">{verifiedCert.studentName}</strong> • {verifiedCert.courseTitle} ({verifiedCert.hoursTotal}h)
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCert(verifiedCert)}
                  className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Abrir Certificado
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-none bg-red-950/30 border border-red-500/40 text-xs text-red-200">
                Nenhum certificado registrado com o código <strong>{searchCode}</strong>. Verifique o número e tente novamente.
              </div>
            )}
          </div>
        )}
      </div>

      {/* User's Certificates Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-400" />
          Seus Certificados Emitidos
        </h2>

        {userCertificates.length === 0 ? (
          <div className="p-12 text-center bg-[#121418] border border-slate-800 rounded-none space-y-2">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              Você ainda não possui certificados emitidos. Conclua 100% das aulas e avaliações do curso para desbloquear a emissão.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCertificates.map((cert) => (
              <div
                key={cert.id}
                className="p-6 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition flex flex-col justify-between gap-4 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-none bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-mono font-bold">
                      {cert.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{cert.courseTitle}</h3>
                  <p className="text-xs text-slate-300">
                    Carga Horária Homologada: <strong className="text-orange-400">{cert.hoursTotal} Horas</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Norma: {cert.normaReferencia}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Habilitado</span>
                  </div>

                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
                  >
                    <span>Visualizar / Imprimir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Certificate Modal */}
      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};
