import React, { useState } from 'react';
import { Certificate } from '../../types';
import { X, Award, Shield, CheckCircle, Printer, Copy, Check, QrCode, Flame } from 'lucide-react';

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[95vh] overflow-y-auto">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
            <Award className="w-4 h-4" />
            <span>Documento de Habilitação & Registro Profissional</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition cursor-pointer"
              title="Copiar código de autenticidade"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : certificate.code}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-8 sm:p-12 rounded-none bg-gradient-to-b from-[#0c0b0e] to-[#121418] border-4 border-double border-orange-600/40 text-center relative overflow-hidden shadow-2xl">
          {/* Watermark Emblem */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Flame className="w-96 h-96 text-orange-500" />
          </div>

          {/* Certificate Header */}
          <div className="space-y-2 mb-8">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-orange-400 uppercase">
              <Shield className="w-4 h-4 text-orange-500" />
              <span>{certificate.organizationName}</span>
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Certificado de Conclusão e Habilitação
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Registrado sob Livro de Atas nº 12 / Folha 88 — {certificate.normaReferencia}
            </p>
          </div>

          {/* Certificate Body Text */}
          <div className="space-y-6 max-w-2xl mx-auto my-8">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Certificamos para os devidos fins de direito e comprovação profissional que
            </p>

            <div className="py-2 border-b-2 border-orange-500/40 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-3xl font-extrabold text-orange-400 tracking-wide">
                {certificate.studentName}
              </h2>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              {certificate.studentDoc || 'Documento de Identidade Funcional Militar / RG Validado'}
            </p>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              concluiu com êxito e total aproveitamento teórico-prático o curso de{' '}
              <strong className="text-white font-bold">{certificate.courseTitle}</strong>, com carga horária total de{' '}
              <strong className="text-orange-400 font-bold">{certificate.hoursTotal} Horas</strong>, estando apto(a) a exercer as funções operacionais de prevenção, combate a incêndio, resgate técnico e atendimento pré-hospitalar conforme a legislação vigente.
            </p>
          </div>

          {/* Signatures & Security Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-800/80 items-end">
            <div className="space-y-1 text-center">
              <div className="w-40 mx-auto border-b border-slate-700 pb-1 text-xs font-mono text-white">
                {certificate.instructorName}
              </div>
              <div className="text-[10px] text-slate-400 uppercase">Instrutor Chefe Responsável</div>
            </div>

            {/* QR Code Validation */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="p-2 rounded-none bg-white text-black shadow-lg">
                <img
                  src={certificate.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VALID'}
                  alt="QR Code Autenticidade"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle className="w-3 h-3" /> Autenticidade Verificada
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                Código: {certificate.code}
              </div>
            </div>

            <div className="space-y-1 text-center">
              <div className="w-40 mx-auto border-b border-slate-700 pb-1 text-xs font-mono text-white">
                Comandante Rogério Viana
              </div>
              <div className="text-[10px] text-slate-400 uppercase">Diretor Geral de Ensino</div>
            </div>
          </div>

          {/* Date of Issue */}
          <div className="mt-8 text-[11px] text-slate-400 font-mono">
            Emitido em {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')} • Válido em todo o território nacional
          </div>
        </div>
      </div>
    </div>
  );
};
