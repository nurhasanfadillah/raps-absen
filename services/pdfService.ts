import { PayrollReport, Employee } from '../types';
import { HALF_DAY_THRESHOLD_TIME } from '../config';

const COMPANY_NAME = "PT. REDONE BERKAH MANDIRI UTAMA";
const COMPANY_ADDRESS = "Gedung Office, Jl. Contoh No. 123, Jakarta Indonesia";
// Updated Official Logo URL (Sidebar/Landscape Version for Reports)
const COMPANY_LOGO_URL = "https://lh3.googleusercontent.com/d/1fINTQmAuWDJdHosZ_bMXjOXXGqbtmsja";

// Helper to format currency
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Helper for Jakarta Timezone
const formatJakartaDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

export const generatePayslipPDF = (item: any, report: PayrollReport) => {
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Slip Gaji - ${item.employeeName}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #fff;
            color: #1f2937;
            -webkit-print-color-adjust: exact;
          }
          
          .payslip-container {
            width: 100%;
            max-width: 210mm; /* A4 Width */
            height: 99mm; /* Approx 1/3 of A4 (297mm / 3) */
            border: 1px solid #e5e7eb;
            background: #fff;
            position: relative;
            box-sizing: border-box;
            padding: 25px 30px;
            margin: 0 auto;
          }

          /* Header Section */
          .header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #dc2626; /* Brand Red */
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo {
            height: 45px;
            width: auto;
            margin-right: 20px;
          }
          .company-info h1 {
            font-size: 16px;
            font-weight: 800;
            margin: 0;
            color: #111;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .company-info p {
            font-size: 10px;
            color: #6b7280;
            margin: 2px 0 0 0;
          }
          .payslip-title {
            margin-left: auto;
            text-align: right;
          }
          .payslip-title h2 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: #dc2626;
            text-transform: uppercase;
          }
          .payslip-title p {
            font-size: 10px;
            margin: 2px 0 0 0;
            color: #4b5563;
          }

          /* Info Grid */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            font-size: 11px;
          }
          .info-group strong {
            display: block;
            color: #6b7280;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .info-group span {
            font-weight: 600;
            color: #111;
          }

          /* Earnings & Deductions Table */
          .financials {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 20px;
          }
          .financials th {
            text-align: left;
            padding: 8px 10px;
            background-color: #f9fafb;
            color: #374151;
            text-transform: uppercase;
            font-size: 9px;
            font-weight: 700;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
          }
          .financials td {
            padding: 6px 10px;
            border-bottom: 1px solid #f3f4f6;
            color: #1f2937;
          }
          .amount-col {
            text-align: right;
            font-family: 'Courier New', Courier, monospace;
            font-weight: 600;
          }
          .subtext {
            display: block;
            font-size: 9px;
            color: #9ca3af;
            font-style: italic;
          }
          .deduction {
            color: #dc2626;
          }

          /* Net Pay Section */
          .net-pay-section {
            background-color: #fef2f2;
            border: 1px solid #fee2e2;
            padding: 10px 15px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .net-label {
            font-size: 12px;
            font-weight: 700;
            color: #991b1b;
            text-transform: uppercase;
          }
          .net-amount {
            font-size: 18px;
            font-weight: 800;
            color: #dc2626;
          }

          /* Footer */
          .footer {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }

          @media print {
            .payslip-container {
               page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <!-- Header -->
          <div class="header">
            <img src="${COMPANY_LOGO_URL}" alt="Logo" class="logo" />
            <div class="company-info">
              <h1>${COMPANY_NAME}</h1>
              <p>Human Resource Management System</p>
            </div>
            <div class="payslip-title">
              <h2>Slip Gaji</h2>
              <p>Periode: ${formatJakartaDate(report.periodStart)} - ${formatJakartaDate(report.periodEnd)}</p>
            </div>
          </div>

          <!-- Employee Info -->
          <div class="info-grid">
            <div class="info-group">
               <strong>Karyawan</strong>
               <span>${item.employeeName}</span>
               <div style="font-size:9px; color:#666; margin-top:1px;">ID: ${item.employeeId}</div>
            </div>
             <div class="info-group">
               <strong>Jabatan</strong>
               <span>${item.role}</span>
            </div>
             <div class="info-group">
               <strong>Kehadiran</strong>
               <span>${item.totalEffectiveDays} Hari Efektif</span>
               <div style="font-size:9px; color:#666; margin-top:1px;">(Full: ${item.totalFullDays}, Half: ${item.totalHalfDays})</div>
            </div>
             <div class="info-group" style="text-align:right;">
               <strong>Tanggal Cetak</strong>
               <span>${formatJakartaDate(new Date())}</span>
            </div>
          </div>

          <!-- Financial Table -->
          <table class="financials">
            <thead>
              <tr>
                <th width="50%">Deskripsi</th>
                <th width="20%">Rate / Unit</th>
                <th class="amount-col">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Gaji Pokok
                  <span class="subtext">Berdasarkan ${item.totalEffectiveDays} hari kerja efektif</span>
                </td>
                <td>${formatMoney(item.baseSalary)}</td>
                <td class="amount-col">${formatMoney(item.totalBasePay)}</td>
              </tr>
              <tr>
                <td>
                  Uang Lembur
                  <span class="subtext">Total ${item.totalOvertimeHours} jam lembur</span>
                </td>
                <td>${formatMoney(item.overtimeRate)}/jam</td>
                <td class="amount-col">${formatMoney(item.totalOvertimePay)}</td>
              </tr>
              <tr>
                <td>Potongan Kasbon / Lainnya</td>
                <td>-</td>
                <td class="amount-col deduction">(${formatMoney(item.totalDeductions)})</td>
              </tr>
            </tbody>
          </table>

          <!-- Total -->
          <div class="net-pay-section">
            <span class="net-label">Total Gaji Bersih</span>
            <span class="net-amount">${formatMoney(item.netSalary)}</span>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>Dokumen ini sah dan dicetak secara otomatis oleh sistem RAPS.</div>
            <div>Halaman 1 dari 1</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const win = window.open('', '', 'height=600,width=900');
  if (win) {
    win.document.write(content);
    win.document.close();
    // Use timeout to allow image to load
    setTimeout(() => {
        win.print();
    }, 500);
  }
};

export const generateReportPDF = (report: PayrollReport) => {
   const content = `
    <html>
      <head>
        <title>Laporan Penggajian - ${COMPANY_NAME}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; }
          
          .header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px;
          }
          .logo { height: 50px; margin-right: 20px; }
          .company-name { font-size: 20px; font-weight: 800; text-transform: uppercase; color: #111; }
          .report-title { font-size: 16px; margin-top: 5px; color: #555; }
          
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 12px;
            background: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }

          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          thead th { 
            background-color: #1f2937; 
            color: #fff; 
            padding: 10px 8px; 
            text-align: left; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tbody td { 
            padding: 8px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          tbody tr:nth-child(even) { background-color: #f9fafb; }
          
          .amount { font-family: 'Courier New', monospace; text-align: right; font-weight: 600; }
          .center { text-align: center; }
          .total-row { 
            background-color: #f3f4f6; 
            font-weight: bold; 
          }
          .total-row td {
            border-top: 2px solid #374151;
            padding: 12px 8px;
            font-size: 12px;
          }
          
          .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${COMPANY_LOGO_URL}" alt="Logo" class="logo" />
          <div>
            <div class="company-name">${COMPANY_NAME}</div>
            <div class="report-title">Laporan Rekapitulasi Gaji Karyawan</div>
          </div>
        </div>

        <div class="meta">
          <div><strong>ID Laporan:</strong> ${report.id}</div>
          <div><strong>Periode:</strong> ${formatJakartaDate(report.periodStart)} s/d ${formatJakartaDate(report.periodEnd)}</div>
          <div><strong>Tanggal Cetak:</strong> ${formatJakartaDate(new Date())}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">ID</th>
              <th width="20%">Nama Karyawan</th>
              <th width="10%">Jabatan</th>
              <th width="10%" class="center">Kehadiran</th>
              <th width="10%" class="amount">Gaji Pokok</th>
              <th width="15%" class="amount">Total Gaji Dasar</th>
              <th width="10%" class="amount">Lembur</th>
              <th width="10%" class="amount">Potongan</th>
              <th width="10%" class="amount">Gaji Bersih</th>
            </tr>
          </thead>
          <tbody>
            ${report.items.map(item => `
              <tr>
                <td>${item.employeeId}</td>
                <td><strong>${item.employeeName}</strong></td>
                <td>${item.role}</td>
                <td class="center">${item.totalEffectiveDays} Hari</td>
                <td class="amount">${formatMoney(item.baseSalary)}</td>
                <td class="amount">${formatMoney(item.totalBasePay)}</td>
                <td class="amount" style="color: #059669;">${formatMoney(item.totalOvertimePay)}</td>
                <td class="amount" style="color: #dc2626;">${item.totalDeductions > 0 ? '(' + formatMoney(item.totalDeductions) + ')' : '-'}</td>
                <td class="amount" style="font-weight:800;">${formatMoney(item.netSalary)}</td>
              </tr>
            `).join('')}
            
            <tr class="total-row">
              <td colspan="5" style="text-align:right; text-transform:uppercase;">Grand Total</td>
              <td class="amount">${formatMoney(report.items.reduce((acc, curr) => acc + curr.totalBasePay, 0))}</td>
              <td class="amount">${formatMoney(report.items.reduce((acc, curr) => acc + curr.totalOvertimePay, 0))}</td>
              <td class="amount" style="color: #dc2626;">(${formatMoney(report.items.reduce((acc, curr) => acc + curr.totalDeductions, 0))})</td>
              <td class="amount" style="font-size:14px;">${formatMoney(report.totalPayout)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Dicetak oleh Administrator via Sistem RAPS.
        </div>
      </body>
    </html>
  `;
  
  const win = window.open('', '', 'height=700,width=1000');
  if (win) {
    win.document.write(content);
    win.document.close();
    setTimeout(() => {
        win.print();
    }, 500);
  }
};