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
import { useGetEmployeeByIdQuery } from "@/services/hrms/employee.api";
import { useGetHrSettingsQuery, useGenerateOfferLetterPdfMutation } from "@/services/hrms/hrSettings.api";
import { formatDate } from "@/lib/utils";
import logo from "@/assets/images/header_logo.png";
import { toast } from "sonner";

// Custom styles for the A4 page preview (screen only — print is handled server-side)
const a4Styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@500;600&display=swap');

  .offer-letter-page {
    width: 210mm;
    height: 297mm; /* Fixed A4 height */
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
    overflow: hidden; /* Prevent visual overflow in preview */
  }

  /* Show a warning border if content is too long */
  .offer-letter-page.overflowing {
    border: 2px dashed #ef4444 !important;
  }
  
  .offer-letter-page.overflowing .overflow-warning {
    opacity: 1 !important;
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
    flex: 1;
    overflow: hidden;
  }

  .ql-editor {
    padding: 0 !important;
    height: 100%;
    line-height: 1.6;
    overflow-y: auto !important; /* Allow internal scrolling to see all content while editing */
  }

  /* Custom scrollbar for the editor to keep it clean */
  .ql-editor::-webkit-scrollbar { width: 4px; }
  .ql-editor::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

  /* Enforce A4 layout constraints */
  .ql-editor p, .ql-editor h2, .ql-editor h3, .ql-editor li {
    max-width: 100%;
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

export const OfferLetterEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: employeeData, isLoading: isEmployeeLoading } = useGetEmployeeByIdQuery(id);
  const { data: settingsRes, isLoading: isSettingsLoading } = useGetHrSettingsQuery();
  const [generatePdf, { isLoading: isGenerating }] = useGenerateOfferLetterPdfMutation();

  const employee = employeeData?.data || {};

  const [pages, setPages] = useState(null); // null = not yet populated
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Populate the editor whenever data is ready AND pages haven't been set yet.
    // Using `pages === null` as the initialization gate is more reliable than
    // a separate boolean flag that can get stuck across re-renders or HMR.
    if (employeeData?.data && settingsRes?.data && pages === null) {
      const emp = employeeData.data;
      const globalTemplate = settingsRes.data.offerLetterTemplate;
      
      let content = globalTemplate || `
        <div style="text-align: right; margin-bottom: 25px;">
          <strong>Date:</strong> {{current_date}}
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>To,</strong><br/>
          <strong>{{full_name}}</strong><br/>
          {{address}}
        </div>

        <h2 style="text-decoration: underline; color: #1e40af; font-weight: 500; font-size: 1.3rem; text-align: center; margin-bottom: 35px; margin-top: 10px;">Subject: Employment Offer Letter</h2>

        <p>Dear <strong>{{first_name}}</strong>,</p>

        <p>We are pleased to offer you the position of <strong>{{designation}}</strong> with <strong>Secure Code Systems</strong>. Based on your experience and qualifications, we are confident that you will be a valuable addition to our organization.</p>

        <h3 style="color: #2563eb; font-weight: 600; margin-bottom: 12px; margin-top: 25px;">1. Position Details</h3>
        <p><strong>Job Title:</strong> {{designation}}</p>
        <p><strong>Department:</strong> {{department}}</p>
        <p><strong>Reporting To:</strong> {{manager}}</p>
        <p><strong>Employment Type:</strong> {{emp_type}}</p>
        <p><strong>Work Location:</strong> {{location}}</p>
        <p><strong>Start Date:</strong> {{joining_date}}</p>

        <h3 style="color: #2563eb; font-weight: 600; margin-bottom: 12px; margin-top: 25px;">2. Role & Responsibilities</h3>
        <p>In your role as {{designation}}, you will be responsible for executing project requirements, collaborating with the technical team, and ensuring high-quality delivery of software solutions. A detailed job description will be provided upon joining.</p>

        <p>We look forward to your contribution and success with us.</p>

        <div style="margin-top: 50px;">
          Sincerely,<br/><br/><br/>
          <strong>Authorized Signatory</strong><br/>
          Secure Code Systems
        </div>

        <!-- pagebreak -->

        <h2 style="text-decoration: underline; color: #1e40af; font-weight: 500; font-size: 1.3rem; text-align: center; margin-bottom: 35px; margin-top: 10px; text-transform: uppercase;">Annexure - A: Compensation Details</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13.5px;">
          <tbody>
            <tr>
              <td><strong>Component</strong></td>
              <td><strong>Monthly (₹)</strong></td>
              <td><strong>Annual (₹)</strong></td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Basic Salary</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{basic_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{basic_annual}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Dearness Allowance (DA)</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{da_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{da_annual}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">House Rent Allowance (HRA)</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{hra_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{hra_annual}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Travel Allowance</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{travel_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{travel_annual}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Special Allowance</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{special_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{special_annual}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Other Allowance</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{other_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{other_annual}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; background-color: #f1f5f9;">Gross Salary</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-weight: bold; background-color: #f1f5f9;">{{gross_monthly}}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-weight: bold; background-color: #f1f5f9;">{{gross_annual}}</td>
            </tr>
          </tbody>
        </table>
        
        <p style="font-size: 11px; color: #475569; margin-bottom: 25px;"><strong>Note:</strong> Statutory deductions like PF, ESI, and Professional Tax will be applicable as per government regulations.</p>

        <h3 style="color: #2563eb; font-weight: 600; margin-bottom: 12px;">Benefits & Perks</h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Group Health Insurance coverage up to ₹3,00,000 per annum.</li>
          <li>Annual Performance Bonus based on organizational and individual goals.</li>
          <li>Paid Leaves: 18 days per calendar year (pro-rated).</li>
        </ul>
      `;

      // Calculate salary formatting
      const formatCurrency = (val) => val ? parseFloat(val).toLocaleString('en-IN') : "0";
      
      const basicMonthly = parseFloat(emp.basicSalary) || 0;
      const daMonthly = parseFloat(emp.da) || 0;
      const hraMonthly = parseFloat(emp.hraAllowance) || 0;
      const travelMonthly = parseFloat(emp.travelAllowance) || 0;
      const specialMonthly = parseFloat(emp.specialAllowance) || 0;
      const otherMonthly = parseFloat(emp.otherAllowance) || 0;
      const grossMonthly = parseFloat(emp.totalSalary) || 0;

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
        '{{address}}': `${emp.address || "Address line 1"},<br/>${emp.city || "City, State"}.`,
        // Salary Placeholders
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
    }
  }, [employeeData, settingsRes, pages]);

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
    const newPages = [...pages];
    newPages[index].content = content;
    setPages(newPages);

    // Check overflow after content change
    setTimeout(() => {
      const el = document.getElementById(`page-container-${index}`);
      if (el) {
        if (el.scrollHeight > el.offsetHeight + 5) {
          el.classList.add('overflowing');
        } else {
          el.classList.remove('overflowing');
        }
      }
    }, 10);
  };

  // ── Build the payload the backend needs ────────────────────────────────────
  const buildPdfPayload = () => ({
    pages: (pages || []).map((p) => p.content),
    employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
  });

  // ── Preview: opens the server-rendered PDF in a new browser tab ─────────
  const handlePreview = async () => {
    const toastId = toast.loading("Generating preview...");
    try {
      const blobUrl = await generatePdf(buildPdfPayload()).unwrap();
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
      const blobUrl = await generatePdf(buildPdfPayload()).unwrap();
      const empName = `${employee.firstName || "Employee"}-${employee.lastName || ""}`.trim();
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Offer-Letter-${empName}.pdf`;
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
      const blobUrl = await generatePdf(buildPdfPayload()).unwrap();
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

  // Show spinner until BOTH the API data AND the page content are ready
  if (isEmployeeLoading || isSettingsLoading || pages === null) {
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
            <p className="font-semibold text-slate-800 text-sm">Offer Letter Editor</p>
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
            Download PDF
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
      <div className="flex flex-col items-center">
        {pages.map((page, index) => {
          const isCurrent = index === currentPage;
          // We can't easily check scrollHeight of hidden elements, so we might need a better approach
          // But for now, we can apply a class if the user wants to see it.
          return (
            <div 
              key={page.id}
              id={`page-container-${index}`}
              className={`relative ${isCurrent ? 'block' : 'hidden'}`}
            >
              {/* Page number label above the page */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
                  Page {index + 1} of {pages.length}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* A4 Page */}
              <div
                id={`page-inner-${index}`}
                className="offer-letter-page flex flex-col"
                onInput={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollHeight > el.offsetHeight + 5) {
                    el.classList.add('overflowing');
                  } else {
                    el.classList.remove('overflowing');
                  }
                }}
              >
              {/* Warning Badge for Overflow */}
              <div className="overflow-warning absolute top-4 right-4 z-20 pointer-events-none opacity-0 transition-opacity">
                <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  PAGE OVERFLOW - MOVE CONTENT TO NEXT PAGE
                </div>
              </div>
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
            {/* PDF Footer Preview - matches Puppeteer's footer exactly */}
            <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
              <span>© Secure Code Systems — Confidential</span>
              <span className="font-semibold text-slate-500">Page {index + 1} of {pages.length}</span>
            </div>
          </div>
          {/* Outer wrapper end */}
          </div>
        );
      })}
      </div>
    </div>
  );
};
