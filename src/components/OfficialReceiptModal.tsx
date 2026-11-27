import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Printer,
  Copy,
  Check,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { Complaint, CATEGORIES, DEPARTMENTS, WARDS, getSLADurationHours } from '../data/mockData';
import { tCategoryName, tSubcategory, tDepartment, tWard, tPriority, tStatus } from '../i18n/translations';

interface OfficialReceiptModalProps {
  complaint: Complaint;
  onClose: () => void;
  language?: 'en' | 'hi';
}

/**
 * Generates a deterministic SVG QR Code matrix for the grievance URL
 */
function DeterministicSvgQr({ data, size = 120 }: { data: string; size?: number }) {
  // Simple deterministic 21x21 QR-like matrix generator based on hash for pure offline rendering
  const matrixSize = 21;
  const grid: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // Finder patterns at top-left, top-right, bottom-left
  const addFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startRow + r][startCol + c] = isBorder || isCenter;
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, 14);
  addFinder(14, 0);

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Hash string into data modules
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Don't overwrite finders
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= 13) ||
        (r >= 13 && c < 8) ||
        (r === 6 || c === 6)
      ) {
        continue;
      }
      const bit = Math.abs(Math.sin(hash + r * matrixSize + c)) > 0.45;
      grid[r][c] = bit;
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-1">
      {grid.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.1}
              height={cellSize + 0.1}
              fill="#0F1B2D"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function OfficialReceiptModal({ complaint, onClose, language = 'en' }: OfficialReceiptModalProps) {
  const isHi = language === 'hi';
  const [qrImgFailed, setQrImgFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const category = CATEGORIES.find((c) => c.id === complaint.categoryId);
  const department = DEPARTMENTS.find((d) => d.id === complaint.departmentId);
  const ward = WARDS.find((w) => w.id === complaint.wardId);
  const slaHours = getSLADurationHours(complaint.priority);

  const trackingUrl = `${window.location.origin}/track/${encodeURIComponent(complaint.id)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTrackingUrl = async () => {
    try {
      await navigator.clipboard?.writeText(trackingUrl);
      setCopiedLink(true);
      toast.success(isHi ? '✓ ट्रैकिंग लिंक कॉपी हो गया!' : '✓ Tracking URL copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error(isHi ? 'लिंक कॉपी नहीं हो सका।' : 'Could not copy link.');
    }
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    if (phone.length <= 4) return phone;
    return phone.slice(0, 3) + '••••' + phone.slice(-4);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* PRINT-OPTIMIZED STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-receipt-print-area, #official-receipt-print-area * {
            visibility: visible;
          }
          #official-receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* MODAL CONTROL HEADER */}
        <div className="no-print bg-[#0F1B2D] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#FF6A2A]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isHi ? 'आधिकारिक शिकायत पावती पर्ची' : 'Official Grievance Acknowledgment Slip'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTrackingUrl}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? (isHi ? 'कॉपी हुआ' : 'Copied') : isHi ? 'लिंक कॉपी करें' : 'Copy Link'}
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#FF6A2A] hover:bg-[#E55A1F] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              {isHi ? 'प्रिंट / PDF सहेजें' : 'Print / Save PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div id="official-receipt-print-area" className="p-8 text-slate-800 space-y-6 bg-white relative">
          {/* Subtle Government Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <div className="text-center font-serif">
              <span className="text-8xl font-black block">{isHi ? 'समाधान सेतु' : 'SAMADHAN SETU'}</span>
              <span className="text-4xl font-bold block">{isHi ? 'राष्ट्रीय राजधानी क्षेत्र दिल्ली सरकार' : 'GOVERNMENT OF NCT OF DELHI'}</span>
            </div>
          </div>

          {/* OFFICIAL HEADER */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center font-serif font-black text-sm text-slate-900">
                SS
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 font-serif">
                  {isHi ? 'राष्ट्रीय राजधानी क्षेत्र दिल्ली सरकार / नगर निगम निवारण पोर्टल' : 'Government of NCT of Delhi / Municipal Redressal Portal'}
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  {isHi ? 'सत्यमेव जयते • समाधान सेतु एकीकृत शिकायत निवारण प्रणाली' : 'सत्यमेव जयते • Samadhan Setu Unified Grievance Redressal System'}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-block bg-slate-900 text-white font-mono font-bold text-[10px] px-3 py-0.5 uppercase tracking-widest rounded-xs">
                {isHi ? 'नागरिक शिकायत पावती (आधिकारिक प्रमाण)' : 'Citizen Grievance Acknowledgment (नागरिक पावती)'}
              </span>
            </div>
          </div>

          {/* REFERENCE BAR & QR CODE */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                {isHi ? 'आधिकारिक शिकायत पंजीकरण संख्या' : 'Official Grievance Registration Number'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-[#0F1B2D] block">
                {complaint.id}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isHi ? 'दर्ज करने की तिथि:' : 'Date of Lodging:'}{' '}
                  <strong>{new Date(complaint.createdAt).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center p-2 bg-white border border-slate-300 rounded-lg shadow-xs">
              {!qrImgFailed ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackingUrl)}`}
                  alt={`QR code for ${complaint.id}`}
                  width={90}
                  height={90}
                  onError={() => setQrImgFailed(true)}
                  className="w-[90px] h-[90px] object-contain"
                />
              ) : (
                <DeterministicSvgQr data={trackingUrl} size={90} />
              )}
              <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase tracking-wider font-bold">
                {isHi ? 'सत्यापन हेतु स्कैन करें' : 'Scan to Verify'}
              </span>
            </div>
          </div>

          {/* GRIEVANCE SPECIFICATIONS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-slate-200 rounded-xl p-4">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'नागरिक विवरण' : 'Citizen Profile'}
                </span>
                <p className="font-bold text-slate-900 text-sm">{complaint.citizenName}</p>
                <p className="text-slate-600 font-mono text-[11px]">
                  {isHi ? 'फ़ोन:' : 'Phone:'} {maskPhone(complaint.citizenPhone)}
                </p>
                {complaint.citizenEmail && (
                  <p className="text-slate-600 text-[11px]">{isHi ? 'ईमेल:' : 'Email:'} {complaint.citizenEmail}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'शिकायत श्रेणी' : 'Grievance Category'}
                </span>
                <p className="font-bold text-slate-900">
                  {tCategoryName(complaint.categoryId, language, category?.name || 'General Civic Infrastructure')}
                </p>
                <p className="text-slate-600 text-[11px]">
                  {isHi ? 'उप-श्रेणी:' : 'Subcategory:'} {tSubcategory(complaint.subcategory, language)}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'नियुक्त विभाग' : 'Designated Department'}
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {tDepartment(complaint.departmentId, language, department?.name || 'Municipal Corporation Division')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'स्थान क्षेत्राधिकार' : 'Location Jurisdiction'}
                </span>
                <p className="font-bold text-slate-900">{complaint.address}</p>
                <p className="text-slate-600 text-[11px]">
                  {tWard(complaint.wardId, language, ward?.name || 'Ward Area')}, {complaint.city || (isHi ? 'दिल्ली' : 'Delhi')} - {complaint.pincode}
                </p>
                <p className="font-mono text-[10px] text-slate-500">
                  GPS: {complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'प्राथमिकता एवं SLA लक्ष्य' : 'Priority & SLA Target'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                      complaint.priority === 'critical'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : complaint.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {isHi ? `${tPriority(complaint.priority, 'hi')} प्राथमिकता` : `${complaint.priority} Priority`}
                  </span>
                  <span className="font-semibold text-slate-700 text-[11px]">
                    {isHi ? `${slaHours} घंटे अधिकतम SLA` : `${slaHours} Hours Maximum SLA`}
                  </span>
                </div>
                <p className="text-slate-500 text-[10px] mt-1">
                  {isHi ? 'लक्ष्यित समाधान समय:' : 'Target Resolution:'} {new Date(complaint.slaDeadline).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'वर्तमान स्थिति' : 'Current Processing State'}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {tStatus(complaint.status, language)}
                </span>
              </div>
            </div>
          </div>

          {/* SUMMARY OF GRIEVANCE */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isHi ? 'शिकायत का विवरण' : 'Grievance Description'}
            </span>
            <h4 className="font-bold text-slate-900 text-xs">{complaint.title}</h4>
            <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* OFFICIAL FOOTER & DIGITAL STAMP */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isHi ? 'मान्यता प्राप्त नागरिक चार्टर दस्तावेज़' : 'Valid Citizen Charter Instrument'}
              </p>
              <p>
                {isHi
                  ? 'यह कंप्यूटर जनित पावती है। भौतिक हस्ताक्षर की आवश्यकता नहीं है।'
                  : 'Computer generated acknowledgment. No physical signature required.'}
              </p>
              <p className="font-mono text-[9px]">URL: {trackingUrl}</p>
            </div>

            <div className="border-2 border-dashed border-slate-400 rounded-xl p-3 text-center min-w-[160px] bg-slate-50/50">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 block">
                {isHi ? 'समाधान सेतु' : 'SAMADHAN SETU'}
              </span>
              <span className="text-[8px] text-emerald-700 font-bold block">
                {isHi ? 'डिजिटल रूप से प्रमाणित' : 'DIGITALLY CERTIFIED'}
              </span>
              <span className="text-[8px] font-mono text-slate-500 block">
                PORTAL AUTH: SEC-2026-NCT
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            {isHi ? 'रसीद बंद करें' : 'Close Receipt'}
          </button>
          <button
            onClick={handlePrint}
            className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#FF6A2A]" />
            {isHi ? 'आधिकारिक रसीद प्रिंट करें' : 'Print Official Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}

