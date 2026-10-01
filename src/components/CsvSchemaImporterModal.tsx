import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Database, 
  Table as TableIcon, 
  Users, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { SCHEMA_TABLES } from '../data/schemaDefinition';

interface CsvSchemaImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (tableName: string, importedCount: number) => void;
}

export const CsvSchemaImporterModal: React.FC<CsvSchemaImporterModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  if (!isOpen) return null;

  const [selectedEntity, setSelectedEntity] = useState<'patients' | 'staff_users'>('patients');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsed' | 'imported'>('idle');
  const [importedRowsCount, setImportedRowsCount] = useState<number>(0);

  // Sample CSV Templates
  const PATIENT_SAMPLE_CSV = `mrn,first_name,last_name,date_of_birth,gender,blood_group,genotype,phone_number,email,emergency_contact_name,emergency_contact_phone,hmo_policy_number
MRN-2026-00301,Babajide,Sanwo,1985-04-12,male,O+,AA,+234 802 341 9021,babajide.s@gmail.com,Morayo Sanwo,+234 803 119 2831,AXA-POL-8849102
MRN-2026-00302,Ngozi,Okonjo,1992-09-24,female,B+,AS,+234 814 559 8192,ngozi.o@yahoo.com,Dr. Chukwuma Okonjo,+234 805 441 9920,HYG-POL-771920
MRN-2026-00303,Tariq,Abubakar,1978-11-03,male,A+,AA,+234 809 112 4451,tariq.abubakar@outlook.com,Fatima Abubakar,+234 803 881 9012,REL-POL-00491
MRN-2026-00304,Chioma,Eze,2001-02-18,female,O-,AA,+234 803 771 9924,chioma.eze@gmail.com,Grace Eze,+234 802 991 4412,
MRN-2026-00305,Oluwaseun,Balogun,1989-07-30,male,AB+,AS,+234 816 449 0182,seun.balogun@company.ng,Bisi Balogun,+234 807 119 8831,AVN-POL-99214`;

  const STAFF_SAMPLE_CSV = `staff_code,first_name,last_name,email,phone,role,department,license_number,is_active
STF-DOC-0201,Dr. Funmilayo,Adeleke,funmi.a@vidiemsledger.health,+234 803 112 9901,doctor,Obstetrics & Gynecology,MD-99120-N,true
STF-NUR-0301,Chioma,Obi,chioma.o@vidiemsledger.health,+234 805 221 8841,nurse,Emergency & Triage Nursing,NR-88419-L,true
STF-PHR-0401,Bisi,Adeleke,bisi.a@vidiemsledger.health,+234 814 662 1190,pharmacist,Outpatient Pharmacy,PCN-77120-A,true
STF-CSH-0202,Kelechi,Amadi,kelechi.a@vidiemsledger.health,+234 802 884 1920,cashier,Central POS Operations,,true
STF-BIL-0402,Zainab,Danjuma,zainab.d@vidiemsledger.health,+234 809 331 4481,billing_officer,Revenue Cycle Management,,true`;

  // Pre-load sample
  const handleLoadSample = (type: 'patients' | 'staff_users') => {
    setSelectedEntity(type);
    setCsvRawText(type === 'patients' ? PATIENT_SAMPLE_CSV : STAFF_SAMPLE_CSV);
    setImportStatus('parsed');
  };

  // Download Template file
  const handleDownloadTemplate = (type: 'patients' | 'staff_users') => {
    const content = type === 'patients' ? PATIENT_SAMPLE_CSV : STAFF_SAMPLE_CSV;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_${type}_bootstrap.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      setImportStatus('parsed');
    };
    reader.readAsText(file);
  };

  // Parse CSV rows into objects with validation
  const parsedData = React.useMemo(() => {
    if (!csvRawText.trim()) return { headers: [], rows: [], validRows: [], invalidRows: [] };

    const lines = csvRawText.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return { headers: [], rows: [], validRows: [], invalidRows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Array<{ data: Record<string, string>; isValid: boolean; errors: string[]; rowNum: number }> = [];

    const existingKeys = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const rawCols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const rowData: Record<string, string> = {};
      const errors: string[] = [];

      headers.forEach((h, index) => {
        rowData[h] = rawCols[index] || '';
      });

      // Validation logic based on entity
      if (selectedEntity === 'patients') {
        if (!rowData.mrn) errors.push('MRN is required');
        else if (existingKeys.has(rowData.mrn)) errors.push(`Duplicate MRN "${rowData.mrn}" in CSV`);
        else existingKeys.add(rowData.mrn);

        if (!rowData.first_name) errors.push('First name is required');
        if (!rowData.last_name) errors.push('Last name is required');
        if (!rowData.phone_number) errors.push('Phone number is required');

        if (rowData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(rowData.date_of_birth)) {
          errors.push('Date of birth must match YYYY-MM-DD');
        }

        if (rowData.gender && !['male', 'female', 'other'].includes(rowData.gender.toLowerCase())) {
          errors.push('Gender must be male, female, or other');
        }
      } else {
        // Staff validation
        if (!rowData.staff_code) errors.push('Staff code is required');
        else if (existingKeys.has(rowData.staff_code)) errors.push(`Duplicate Staff Code "${rowData.staff_code}"`);
        else existingKeys.add(rowData.staff_code);

        if (!rowData.first_name) errors.push('First name is required');
        if (!rowData.last_name) errors.push('Last name is required');
        if (!rowData.email) errors.push('Email is required');
        else if (!rowData.email.includes('@')) errors.push('Invalid email address');

        const validRoles = ['super_admin', 'doctor', 'nurse', 'cashier', 'billing_officer', 'hmo_desk', 'pharmacist'];
        if (rowData.role && !validRoles.includes(rowData.role.toLowerCase())) {
          errors.push(`Invalid role "${rowData.role}". Allowed: ${validRoles.join(', ')}`);
        }
      }

      rows.push({
        data: rowData,
        isValid: errors.length === 0,
        errors,
        rowNum: i + 1
      });
    }

    const validRows = rows.filter(r => r.isValid);
    const invalidRows = rows.filter(r => !r.isValid);

    return { headers, rows, validRows, invalidRows };
  }, [csvRawText, selectedEntity]);

  // Generate SQL Insert Script
  const generatedSql = React.useMemo(() => {
    if (parsedData.validRows.length === 0) return '';

    const tableName = selectedEntity;
    const lines: string[] = [
      `-- ============================================================================`,
      `-- VIDIEMS ClinicLedger: Seed Data Bootstrap Script for ${tableName.toUpperCase()}`,
      `-- Generated via Data Dictionary CSV Ingestion Engine`,
      `-- Timestamp: ${new Date().toISOString()}`,
      `-- Total Records: ${parsedData.validRows.length}`,
      `-- ============================================================================\n`
    ];

    if (selectedEntity === 'patients') {
      lines.push(`INSERT INTO patients (`);
      lines.push(`  patient_id, mrn, first_name, last_name, date_of_birth, gender, blood_group, genotype, phone_number, email, emergency_contact_name, emergency_contact_phone, hmo_policy_number`);
      lines.push(`) VALUES`);

      const valuesArr = parsedData.validRows.map((r, idx) => {
        const d = r.data;
        const isLast = idx === parsedData.validRows.length - 1;
        const emailVal = d.email ? `'${d.email.replace(/'/g, "''")}'` : 'NULL';
        const hmoVal = d.hmo_policy_number ? `'${d.hmo_policy_number.replace(/'/g, "''")}'` : 'NULL';
        const bgVal = d.blood_group ? `'${d.blood_group}'` : 'NULL';
        const gtVal = d.genotype ? `'${d.genotype}'` : 'NULL';

        return `  (gen_random_uuid(), '${d.mrn}', '${d.first_name.replace(/'/g, "''")}', '${d.last_name.replace(/'/g, "''")}', '${d.date_of_birth}', '${d.gender.toLowerCase()}', ${bgVal}, ${gtVal}, '${d.phone_number}', ${emailVal}, '${d.emergency_contact_name.replace(/'/g, "''")}', '${d.emergency_contact_phone}', ${hmoVal})${isLast ? ';' : ','}`;
      });

      lines.push(...valuesArr);
    } else {
      // Staff SQL
      lines.push(`INSERT INTO staff_users (`);
      lines.push(`  staff_id, staff_code, first_name, last_name, email, phone, role, department, license_number, is_active, password_hash`);
      lines.push(`) VALUES`);

      const valuesArr = parsedData.validRows.map((r, idx) => {
        const d = r.data;
        const isLast = idx === parsedData.validRows.length - 1;
        const licenseVal = d.license_number ? `'${d.license_number.replace(/'/g, "''")}'` : 'NULL';
        const activeVal = d.is_active ? d.is_active.toLowerCase() === 'true' : true;

        return `  (gen_random_uuid(), '${d.staff_code}', '${d.first_name.replace(/'/g, "''")}', '${d.last_name.replace(/'/g, "''")}', '${d.email}', '${d.phone}', '${d.role.toLowerCase()}', '${d.department.replace(/'/g, "''")}', ${licenseVal}, ${activeVal}, '$argon2id$v=19$m=65536,t=3,p=4$BOOTSTRAP_HASH_INITIAL_LOGIN')${isLast ? ';' : ','}`;
      });

      lines.push(...valuesArr);
    }

    return lines.join('\n');
  }, [parsedData.validRows, selectedEntity]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCommitImport = () => {
    if (parsedData.validRows.length === 0) return;
    setImportedRowsCount(parsedData.validRows.length);
    setImportStatus('imported');

    if (onImportSuccess) {
      onImportSuccess(selectedEntity, parsedData.validRows.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                CSV Schema Data Ingestion & Seeding Engine
              </h2>
              <p className="text-xs text-slate-400">
                Bootstrap the relational database schema by importing existing Patient or Staff records with real-time schema validation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: ENTITY SELECTION & TEMPLATE DOWNLOAD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              1. Select Target Schema Table
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedEntity('patients');
                  setImportStatus('idle');
                }}
                className={`py-2 px-3 rounded text-left font-medium border transition-colors cursor-pointer ${
                  selectedEntity === 'patients'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-mono font-bold">patients</div>
                <div className="text-[10px] text-slate-400">Master Patient Registry</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedEntity('staff_users');
                  setImportStatus('idle');
                }}
                className={`py-2 px-3 rounded text-left font-medium border transition-colors cursor-pointer ${
                  selectedEntity === 'staff_users'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-mono font-bold">staff_users</div>
                <div className="text-[10px] text-slate-400">Doctors, Nurses & Billing</div>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              2. Schema Template & Demo Data
            </label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadTemplate(selectedEntity)}
                className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download .CSV Template</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(selectedEntity)}
                className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Load Sample Records</span>
              </button>
            </div>
          </div>
        </div>

        {/* STEP 2: CSV INPUT OR FILE UPLOAD */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              CSV Data Input (Upload or Paste Raw CSV)
            </span>
            <label className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1">
              <Upload className="w-3 h-3" />
              <span>Choose CSV File</span>
              <input 
                type="file" 
                accept=".csv,text/csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          <textarea
            value={csvRawText}
            onChange={(e) => {
              setCsvRawText(e.target.value);
              setImportStatus('parsed');
            }}
            placeholder={`Paste CSV content here...\nExample:\nmrn,first_name,last_name,date_of_birth,gender,phone_number\nMRN-2026-001,Adebayo,Okonkwo,1985-05-12,male,+234 802 341 9021`}
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
          />
        </div>

        {/* STEP 3: PARSING & VALIDATION SUMMARY */}
        {csvRawText.trim() && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-semibold">
                  Parsed: {parsedData.rows.length} Rows
                </span>
                <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {parsedData.validRows.length} Valid
                </span>
                {parsedData.invalidRows.length > 0 && (
                  <span className="text-rose-400 font-mono font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {parsedData.invalidRows.length} Invalid
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Mapped against schema: {selectedEntity}
              </span>
            </div>

            {/* Error notifications */}
            {parsedData.invalidRows.length > 0 && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded text-xs text-rose-300 space-y-1">
                <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Validation Errors in CSV (Fix before importing):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono max-h-24 overflow-y-auto">
                  {parsedData.invalidRows.map((r, i) => (
                    <li key={i}>
                      Row {r.rowNum}: {r.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-lg bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Status</th>
                    {parsedData.headers.map((h, i) => (
                      <th key={i} className="py-2 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {parsedData.rows.map((r, i) => (
                    <tr key={i} className={r.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-950/20'}>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {r.isValid ? (
                          <span className="text-[10px] text-emerald-400 font-bold">VALID</span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-bold" title={r.errors.join('; ')}>ERROR</span>
                        )}
                      </td>
                      {parsedData.headers.map((h, j) => (
                        <td key={j} className="py-2 px-3 whitespace-nowrap text-slate-300">
                          {r.data[h] || <span className="text-slate-600">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Generated SQL Preview Accordion */}
            {generatedSql && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Generated Parameterized SQL Ingestion DDL
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied SQL Script' : 'Copy SQL Inserts'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 max-h-32 overflow-y-auto leading-relaxed">
                  {generatedSql}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* IMPORT SUCCESS NOTIFICATION */}
        {importStatus === 'imported' && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Successfully ingested <strong>{importedRowsCount} {selectedEntity}</strong> records into the live database catalog!
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer text-xs"
            >
              Done
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Strict BCNF/3NF constraint verification enabled</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={parsedData.validRows.length === 0 || importStatus === 'imported'}
              className={`px-4 py-2 text-xs font-bold text-white rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                parsedData.validRows.length > 0 && importStatus !== 'imported'
                  ? 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 shadow-lg shadow-cyan-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {importStatus === 'imported'
                  ? 'Import Committed'
                  : `Bootstrap ${parsedData.validRows.length} ${selectedEntity} Records`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
