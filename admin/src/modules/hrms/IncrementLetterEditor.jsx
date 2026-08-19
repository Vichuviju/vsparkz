import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';
import { useGetEmployeeByIdQuery, useGetSalaryHistoryQuery } from "@/services/hrms/employee.api";
import { useGetHrSettingsQuery, useGenerateOfferLetterPdfMutation } from "@/services/hrms/hrSettings.api";
import { formatDate } from "@/lib/utils";
import logo from "@/assets/images/header_logo.png";
import { toast } from "sonner";

// Custom styles for the A4 page preview (screen only — print is handled server-side)
const a4Styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@500;600&display=swap');

  .offer-letter-page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 20mm;
    margin: 10mm auto;
    background: white;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
    position: relative;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    box-sizing: border-box;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  .preview-header-main { margin-bottom: 25px; }
  .preview-header-brand-row { display: flex; justify-content: space-between; align-items: flex-start; }

  .preview-company-name {
    font-family: 'Lora', serif;
    font-size: 2.2rem;
    color: #4351b5;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }

  .preview-tagline {
    letter-spacing: 0.25em;
    font-size: 0.65rem;
    color: #4351b5;
    text-transform: uppercase;
    font-weight: 700;
    text-align: right;
  }

  .preview-divider {
    border-bottom: 2px solid #4351b5;
    margin-top: 15px;
    margin-bottom: 20px;
  }

  .ql-container.ql-snow {
    border: none !important;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
  }

  .ql-editor {
    padding: 0 !important;
    min-height: 200mm;
    line-height: 1.6;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  /* Table Styles (ReactQuill strips inline table styles, so we enforce them globally) */
  .ql-editor table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    margin-top: 10px;
  }
  .ql-editor td, .ql-editor th {
    border: 1px solid #cbd5e1;
    padding: 8px 10px;
  }
  .ql-editor tr:first-child td {
    background-color: #f1f5f9;
    font-weight: bold;
  }
  .ql-editor td:nth-child(1) { text-align: left; width: 40%; }
  .ql-editor td:nth-child(2), .ql-editor td:nth-child(3) { text-align: right; width: 30%; }

  .ql-toolbar.ql-snow {
    border: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc;
    position: sticky;
    top: 0;
    z-index: 10;
  }
`;

export const IncrementLetterEditor = () => {
  const { id, historyId } = useParams();
  const navigate = useNavigate();
  const { data: employeeData, isLoading: isEmployeeLoading } = useGetEmployeeByIdQuery(id);
  const { data: historyRes, isLoading: isHistoryLoading } = useGetSalaryHistoryQuery(id);
  const { data: settingsRes, isLoading: isSettingsLoading } = useGetHrSettingsQuery();
  const [generatePdf, { isLoading: isGenerating }] = useGenerateOfferLetterPdfMutation();

  const employee = employeeData?.data || {};
  const salaryHistory = historyRes?.data || [];

  const [pages, setPages] = useState(null); // null = not yet populated
  const [currentPage, setCurrentPage] = useState(0);
  const [lastProcessedId, setLastProcessedId] = useState(null);

  useEffect(() => {
    const compositeId = `${id}-${historyId || 'current'}`;
    
    if (employeeData?.data && settingsRes?.data && historyRes?.data && lastProcessedId !== compositeId) {
      const emp = employeeData.data;
      
      // Find current and previous records.
      // IMPORTANT: sort so the current record is ALWAYS first, then others sorted
      // by their ULID ID descending (newer ULIDs are lexicographically greater).
      // This is needed because all records can share the same effectiveFrom date,
      // making a pure date-sort non-deterministic.
      const history = [...historyRes.data].sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        // Both same isCurrent status — sort by id descending (ULID is time-ordered)
        return String(b.id) > String(a.id) ? 1 : -1;
      });
      
      // If historyId is provided, we are generating for a specific past record
      const selectedRecord = historyId 
        ? history.find(h => String(h.id) === String(historyId))
        : (history.find(h => h.isCurrent) || history[0]);

      // The record immediately before the selected one in our sorted list
      const selectedIdx = history.findIndex(h => String(h.id) === String(selectedRecord?.id));
      const previousRecord = selectedIdx !== -1 && history[selectedIdx + 1] ? history[selectedIdx + 1] : null;

      let content = `
        <div style="text-align: right; margin-bottom: 25px;">
          <strong>Date:</strong> {{current_date}}
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>To,</strong><br/>
          <strong>{{full_name}}</strong><br/>
          {{address}}
        </div>

        <h2 style="text-decoration: underline; color: #1e40af; font-weight: 500; font-size: 1.3rem; text-align: center; margin-bottom: 35px; margin-top: 10px;">Subject: Salary Increment Letter</h2>

        <p>Dear <strong>{{first_name}}</strong>,</p>

        <p>We are pleased to inform you that, in recognition of your performance and contribution to <strong>Secure Code Systems</strong>, your salary has been revised.</p>

        <p>Your monthly salary has been incremented by <strong>₹{{increment_amount}}</strong>, raising your gross salary from <strong>₹{{old_salary}}</strong> to <strong>₹{{gross_monthly}}</strong> per month, effective from <strong>{{effective_date}}</strong>.</p>

        <p>Your designation remains <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.</p>
        
        <p>Please find the details of your revised compensation structure in <strong>Annexure - A</strong> below.</p>

        <p>We look forward to your continued contribution and success with us.</p>

        <div style="margin-top: 50px;">
          Sincerely,<br/><br/><br/>
          <strong>Authorized Signatory</strong><br/>
          Secure Code Systems
        </div>

        <!-- pagebreak -->

        <h2 style="text-decoration: underline; color: #1e40af; font-weight: 500; font-size: 1.3rem; text-align: center; margin-bottom: 35px; margin-top: 10px; text-transform: uppercase;">Annexure - A: Revised Compensation Details</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13.5px;">
          <tbody>
            <tr>
              <td><strong>Component</strong></td>
              <td><strong>Monthly (₹)</strong></td>
              <td><strong>Annual (₹)</strong></td>
            </tr>
            <tr>
              <td>Basic Salary</td>
              <td>{{basic_monthly}}</td>
              <td>{{basic_annual}}</td>
            </tr>
            <tr>
              <td>Dearness Allowance (DA)</td>
              <td>{{da_monthly}}</td>
              <td>{{da_annual}}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td>{{hra_monthly}}</td>
              <td>{{hra_annual}}</td>
            </tr>
            <tr>
              <td>Travel Allowance</td>
              <td>{{travel_monthly}}</td>
              <td>{{travel_annual}}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td>{{special_monthly}}</td>
              <td>{{special_annual}}</td>
            </tr>
            <tr>
              <td>Other Allowance</td>
              <td>{{other_monthly}}</td>
              <td>{{other_annual}}</td>
            </tr>
            <tr>
              <td><strong>Gross Salary</strong></td>
              <td><strong>{{gross_monthly}}</strong></td>
              <td><strong>{{gross_annual}}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <p style="font-size: 11px; color: #475569; margin-bottom: 25px;"><strong>Note:</strong> Statutory deductions like PF, ESI, and Professional Tax will be applicable as per government regulations.</p>
      `;

      // Calculate salary formatting
      const formatCurrency = (val) => val ? parseFloat(val).toLocaleString('en-IN') : "0";
      
      // Use details from selectedRecord if available, else from master (fallback)
      const source = selectedRecord || emp;
      
      const basicMonthly = parseFloat(source.basicSalary) || 0;
      const daMonthly = parseFloat(source.da) || 0;
      const hraMonthly = parseFloat(source.hraAllowance) || 0;
      const travelMonthly = parseFloat(source.travelAllowance) || 0;
      const specialMonthly = parseFloat(source.specialAllowance) || 0;
      const otherMonthly = parseFloat(source.otherAllowance) || 0;
      const grossMonthly = parseFloat(source.totalSalary) || 0;
      const oldSalary = previousRecord ? parseFloat(previousRecord.totalSalary) : null;
      const incrementVal = oldSalary ? (grossMonthly - oldSalary) : 0;

      if (!oldSalary || incrementVal <= 0) {
        // If no previous record or no increase, use a simpler establishment text
        const revisionText = `<p>We are pleased to inform you that your compensation structure has been established at <strong>₹{{gross_monthly}}</strong> per month, effective from <strong>{{effective_date}}</strong>.</p>`;
        
        // Replace the "incremented by..." paragraph with the "established at..." paragraph
        content = content.replace(
          /<p>Your monthly salary has been incremented by <strong>₹{{increment_amount}}<\/strong>, raising your gross salary from <strong>₹{{old_salary}}<\/strong> to <strong>₹{{gross_monthly}}<\/strong> per month, effective from <strong>{{effective_date}}<\/strong>.<\/p>/, 
          revisionText
        );
      }

      // Replace placeholders
      const placeholders = {
        '{{first_name}}': emp.firstName || "",
        '{{last_name}}': emp.lastName || "",
        '{{full_name}}': `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        '{{emp_code}}': emp.empCode || "",
        '{{designation}}': emp.designation || "Admin",
        '{{department}}': emp.departmentName || "Engineering",
        '{{manager}}': emp.managerName || "System Admin",
        '{{emp_type}}': emp.employmentType || "Permanent",
        '{{joining_date}}': formatDate(emp.joiningDate) || "—",
        '{{location}}': emp.workLocation || "Chennai",
        '{{current_date}}': formatDate(new Date()),
        '{{effective_date}}': selectedRecord ? formatDate(selectedRecord.effectiveFrom) : formatDate(new Date()),
        '{{address}}': `${emp.address || "Address line 1"},<br/>${emp.city || "City, State"}.`,
        // Salary Placeholders
        '{{increment_amount}}': oldSalary ? formatCurrency(grossMonthly - oldSalary) : "—",
        '{{old_salary}}': oldSalary ? formatCurrency(oldSalary) : "—",
        '{{salary}}': formatCurrency(grossMonthly * 12),
        '{{basic_monthly}}': formatCurrency(basicMonthly),
        '{{basic_annual}}': formatCurrency(basicMonthly * 12),
        '{{da_monthly}}': formatCurrency(daMonthly),
        '{{da_annual}}': formatCurrency(daMonthly * 12),
        '{{hra_monthly}}': formatCurrency(hraMonthly),
        '{{hra_annual}}': formatCurrency(hraMonthly * 12),
        '{{travel_monthly}}': formatCurrency(travelMonthly),
        '{{travel_annual}}': formatCurrency(travelMonthly * 12),
        '{{special_monthly}}': formatCurrency(specialMonthly),
        '{{special_annual}}': formatCurrency(specialMonthly * 12),
        '{{other_monthly}}': formatCurrency(otherMonthly),
        '{{other_annual}}': formatCurrency(otherMonthly * 12),
        '{{gross_monthly}}': formatCurrency(grossMonthly),
        '{{gross_annual}}': formatCurrency(grossMonthly * 12),
      };

      Object.entries(placeholders).forEach(([key, value]) => {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, value);
      });

      // Split content into multiple pages if pagebreak tag is present
      const splitPages = content.split(/<!--\s*pagebreak\s*-->/).map((pageContent, idx) => ({
        id: Date.now() + idx,
        content: pageContent.trim()
      }));

      setPages(splitPages);
      setLastProcessedId(compositeId);
    }
  }, [employeeData, settingsRes, historyRes, lastProcessedId, id, historyId]);

  const handleAddPage = () => {
    if (!pages) return;
    const newPage = { id: Date.now(), content: "<p>Continue typing here...</p>" };
    setPages([...pages, newPage]);
    setCurrentPage(pages.length);
  };

  const handleDeletePage = (index) => {
    if (!pages || pages.length === 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setCurrentPage(Math.max(0, index - 1));
  };

  const handleContentChange = (content, index) => {
    if (!pages) return;
    const newPages = [...pages];
    newPages[index].content = content;
    setPages(newPages);
  };

  // ── Build the payload the backend needs ────────────────────────────────────
  const buildPdfPayload = () => ({
    pages: pages.map((p) => p.content),
    employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
  });

  // ── Preview: opens the server-rendered PDF in a new browser tab ─────────
  const handlePreview = async () => {
    const toastId = toast.loading("Generating preview...");
    try {
      const { data: blobUrl } = await generatePdf(buildPdfPayload());
      window.open(blobUrl, "_blank");
      toast.success("PDF preview opened in a new tab", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate preview", { id: toastId });
    }
  };

  // ── Download: triggers a file download of the server-rendered PDF ────────
  const handleDownload = async () => {
    const toastId = toast.loading("Generating PDF...");
    try {
      const { data: blobUrl } = await generatePdf(buildPdfPayload());
      const empName = `${employee.firstName || "Employee"}-${employee.lastName || ""}`.trim();
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Increment-Letter-${empName}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF", { id: toastId });
    }
  };

  // ── Print: browser native print dialog ──────────────────────────────────
  const handlePrint = async () => {
    const toastId = toast.loading("Preparing print view...");
    try {
      const { data: blobUrl } = await generatePdf(buildPdfPayload());
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
      toast.dismiss(toastId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to prepare print view", { id: toastId });
    }
  };

  if (isEmployeeLoading || isSettingsLoading || isHistoryLoading || pages === null) {
    return (
      <div className="p-10 text-center flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading Offer Letter Template...
      </div>
    );
  }

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 pb-20">
      <style>{a4Styles}</style>
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Increment Letter Editor</p>
            <p className="text-xs text-slate-500">{employee.firstName} {employee.lastName} — {employee.empCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <Button
            variant="outline"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => toast.success("Draft saved successfully to employee records")}
          >
            <Plus className="h-4 w-4" />
            Save Draft
          </Button>

          {/* Preview PDF in new tab */}
          <Button
            variant="outline"
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={handlePreview}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview PDF
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={handlePrint}
            disabled={isGenerating}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>

          {/* Download */}
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Increment Letter
          </Button>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="max-w-[1000px] mx-auto mt-6 px-6">
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">
              Page {currentPage + 1} of {pages.length}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={currentPage === pages.length - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleAddPage}>
              <Plus className="h-4 w-4" />
              Add Page
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeletePage(currentPage)}
              disabled={pages.length === 1}
            >
              <Trash2 className="h-4 w-4" />
              Delete Page
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Page Canvas — screen-only editor preview */}
      <div>
        {pages.map((page, index) => (
          <div 
            key={page.id}
            className={`offer-letter-page ${index === currentPage ? 'flex' : 'hidden'}`}
          >
            {/* Header Design — Only on first page */}
            {index === 0 && (
              <div className="mb-4">
                <div className="flex items-end justify-between">
                    {/* Left: Logo Image */}
                    <div className="flex flex-col items-center">
                        <img src={logo} alt="SCS Logo" className="h-[70px] w-auto object-contain" />
                    </div>

                    {/* Right: Company Name & Tagline */}
                    <div className="flex flex-col items-end">
                        <h1 className="preview-company-name">Secure Code Systems</h1>
                        <p className="preview-tagline">THINK | PROCESS | GROW</p>
                    </div>
                </div>

                {/* Info Section (Address & Contact Info) */}
                <div className="grid grid-cols-2 text-[11px] text-slate-600 mt-4">
                    <div className="text-left">
                        <p>No.21, A.K.R Nagar, 3rd Street, Sri Devi Garden, Valasaravakkam,</p>
                        <p>Chennai-600087. PH: 044 - 4864 5464</p>
                    </div>
                    <div className="text-right">
                        <p>GST IN: <span className="font-bold">33AOPPY8739K1ZV</span></p>
                        <p>E: <span className="text-blue-600 underline">info@securecodesystems.com</span></p>
                        <p className="text-blue-600 underline">www.securecodesystems.com</p>
                    </div>
                </div>

                <div className="preview-divider"></div>
              </div>
            )}

            {/* Content Area — ReactQuill Editor */}
            <div className="flex-grow">
              <ReactQuill
                theme="snow"
                value={page.content}
                onChange={(content) => handleContentChange(content, index)}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{'list': 'ordered'}, {'list': 'bullet'}],
                    [{ 'align': [] }],
                    ['link', 'clean']
                  ],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
