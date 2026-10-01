import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FileText, Upload, CheckCircle2, AlertCircle, Clock, ShieldCheck, Search, Filter, Eye, Download } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents/');
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Digital Repository & Verification System</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Society Document Repository</h1>
          <p className="text-slate-400 text-sm mt-1">
            Store, inspect, and verify legal RTC/Utara records, member Aadhaar KYC, loan agreements, and audit documents.
          </p>
        </div>

        <button className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Document List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-100">Uploaded Documents ({documents.length})</h2>
          
          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Document Types</option>
              <option value="AADHAAR">Aadhaar KYC</option>
              <option value="RTC_UTARA">RTC Land Utara</option>
              <option value="LOAN_AGREEMENT">Loan Agreement</option>
            </select>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
            <p className="text-sm font-medium">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/40 transition space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase">
                      {doc.document_type}
                    </span>
                    <span className={`inline-flex items-center space-x-1 text-[11px] font-semibold ${
                      doc.verification_status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{doc.verification_status || 'VERIFIED'}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">{doc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs text-slate-400">
                  <span>{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                  <div className="flex space-x-2">
                    <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
