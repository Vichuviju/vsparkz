import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, UploadCloud, Plus, Edit2, Trash2, CheckCircle2, Check } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

export function AddFreelancer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [activeStep, setActiveStep] = useState(1);
  const [recordId, setRecordId] = useState(id || null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '', email: '', mobile: '', whatsapp: '', gender: '', dob: '', 
    address: '', city: '', state: '', country: '', pincode: '',
    experience: '', designation: '', empType: '', freelancerType: '', noticePeriod: '',
    linkedin: '', portfolio: '', primarySkills: '', otherSkills: '', skillLevel: '',
    software: '', languages: '', dailyHours: '', weeklyDays: '', timezone: '', comms: '',
    resume: '', idProof: '', hourlyRate: '', projectRate: '', availability: '',
    reviewerScore: '', assignedTo: '', adminApproval: 'pending'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docUploads, setDocUploads] = useState({ resume: null, idProof: null });
  const [skillPricing, setSkillPricing] = useState([]);

  const handleDocChange = (e, type) => {
    const file = e.target.files[0];
    if (file) setDocUploads(prev => ({ ...prev, [type]: file }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      api.get(`/admin/freelancers/${id}`)
        .then(({ data }) => {
          const item = data.data || data;
          setFormData(prev => ({
            ...prev,
            fullName: item.name || '',
            email: item.email || '',
            mobile: item.phone || '',
            dailyHours: item.delivery_days?.toString() || '',
            empType: item.company_or_individual === 'company' ? 'agency' : 'freelancer',
            ...(item.pricing || {})
          }));
          
          if (Array.isArray(item.skills) && item.skills.length > 0 && typeof item.skills[0] === 'object') {
            setSkillPricing(item.skills);
          } else if (Array.isArray(item.skills) && item.skills[0]) {
            setSkillPricing([{ id: Date.now(), name: item.skills[0], level: 'expert', billingType: 'hourly', rate: item.pricing?.hourlyRate || '' }]);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode]);

  const steps = [
    { id: 1, label: 'Personal & Contact' },
    { id: 2, label: 'Professional Details' },
    { id: 3, label: 'Skills & Services' },
    { id: 4, label: 'Portfolio & Documents' },
    { id: 5, label: 'Pricing & Availability' },
    { id: 6, label: 'Review & Assignment' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = ['fullName', 'email', 'mobile', 'gender', 'address', 'city', 'state', 'country', 'experience', 'primarySkills'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'Required';
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleSaveNext = async () => {
    if (validate()) {
      setIsSaving(true);
      setApiError(null);
      
      try {
        const payload = {
          name: formData.fullName,
          email: formData.email,
          phone: formData.mobile,
          skills: skillPricing.length > 0 ? skillPricing : [formData.primarySkills, formData.otherSkills].filter(Boolean),
          service_category_ids: [],
          portfolio_links: formData.portfolio ? [formData.portfolio] : [],
          delivery_days: parseInt(formData.dailyHours) || 7,
          commission_percent: 0,
          company_or_individual: formData.empType === 'agency' ? 'company' : 'individual',
          availability: 'available',
          is_active: true,
          // Stuffing all the extra form steps data into the flexible pricing JSON column
          pricing: {
            whatsapp: formData.whatsapp, gender: formData.gender, dob: formData.dob,
            address: formData.address, city: formData.city, state: formData.state, country: formData.country,
            experience: formData.experience, designation: formData.designation, contractType: formData.contractType,
            proficiency: formData.proficiency, software: formData.software, linkedin: formData.linkedin,
            hourlyRate: formData.hourlyRate, projectRate: formData.projectRate, dailyHours: formData.dailyHours,
            immediateJoin: formData.immediateJoin, internalScore: formData.internalScore, assignedManager: formData.assignedManager,
            approvalStatus: formData.approvalStatus
          }
        };

        if (recordId) {
          await api.put(`/admin/freelancers/${recordId}`, payload);
        } else {
          const res = await api.post('/admin/freelancers', payload);
          setRecordId(res.data?.id || res.data?.data?.id);
        }
        
        toast.success(`Step ${activeStep} saved successfully!`);
        setActiveStep(prev => prev < 6 ? prev + 1 : prev);
        
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || 'Failed to save freelancer';
        setApiError(errMsg);
        toast.error(errMsg);
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.error('Please fill all required fields correctly');
    }
  };

  const inputClass = (fieldName) => `w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-semibold text-slate-700 ${
    errors[fieldName] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Freelancer Data...</div>;
  }

  return (
    <div className="font-sans min-h-0">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
          <span>Freelancers</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800">{isEditMode ? 'Edit' : 'Add'} Freelancer</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit' : 'Add'} Freelancer</h1>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigate('/freelancers')} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">
              Cancel
            </button>
            <button onClick={handleSaveNext} disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/30 transition-colors text-sm disabled:opacity-70">
              {isSaving ? 'Saving...' : 'Save & Next'}
            </button>
          </div>
        </div>
        {apiError && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl">{apiError}</div>}
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-6 flex items-center justify-between overflow-x-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center shrink-0 cursor-pointer" onClick={() => setActiveStep(step.id)}>
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all ${
              activeStep === step.id ? 'bg-blue-50/80' : 'opacity-60 hover:opacity-100'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-[1.5px] ${
                activeStep === step.id 
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm' 
                  : (activeStep > step.id ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-slate-400 bg-transparent')
              }`}>
                {activeStep > step.id ? '✓' : step.id}
              </div>
              <span className={`text-xs font-bold tracking-wide ${activeStep === step.id ? 'text-blue-700' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && <div className={`w-10 md:w-16 h-px mx-1 ${activeStep > step.id ? 'bg-green-500' : 'bg-slate-100'}`}></div>}
          </div>
        ))}
      </div>

      {/* Main Form Content - 4 Columns */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Col 1: Personal Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Personal Information</h2>
          <div className="space-y-4">
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" className={inputClass('fullName')} />
                {errors.fullName && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.fullName}</span>}
              </div>
              <div className="w-24 shrink-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Photo</label>
                <div 
                  className="h-[38px] w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group overflow-hidden relative"
                  onClick={() => document.getElementById('freelancerPhotoUpload').click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                  )}
                  <input id="freelancerPhotoUpload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" className={inputClass('email')} />
              {errors.email && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.email}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Mobile Number <span className="text-red-500">*</span></label>
              <div className="flex">
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center border-r-0 shrink-0">🇮🇳 +91</div>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile" className={`rounded-l-none ${inputClass('mobile')}`} />
              </div>
              {errors.mobile && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.mobile}</span>}
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">WhatsApp</label>
              <div className="flex">
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center border-r-0 shrink-0">🇮🇳 +91</div>
                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" className={`rounded-l-none ${inputClass('whatsapp')}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass('gender')}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.gender}</span>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">DOB</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass('dob')} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Address <span className="text-red-500">*</span></label>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter complete address" rows={2} className={`${inputClass('address')} resize-none`}></textarea>
              {errors.address && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.address}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">City <span className="text-red-500">*</span></label>
                <select name="city" value={formData.city} onChange={handleChange} className={inputClass('city')}>
                  <option value="">Select</option>
                  <option value="CHE">Chennai</option>
                  <option value="BLR">Bangalore</option>
                </select>
                {errors.city && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.city}</span>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">State <span className="text-red-500">*</span></label>
                <select name="state" value={formData.state} onChange={handleChange} className={inputClass('state')}>
                  <option value="">Select</option>
                  <option value="TN">Tamil Nadu</option>
                  <option value="KA">Karnataka</option>
                </select>
                {errors.state && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.state}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Country <span className="text-red-500">*</span></label>
                <select name="country" value={formData.country} onChange={handleChange} className={inputClass('country')}>
                  <option value="">Select</option>
                  <option value="IN">India</option>
                </select>
                {errors.country && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.country}</span>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className={inputClass('pincode')} />
              </div>
            </div>

          </div>
        </div>

        {/* Col 2: Professional Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Professional Details</h2>
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Experience (Yrs) <span className="text-red-500">*</span></label>
                <input type="text" name="experience" value={formData.experience} onChange={handleChange} placeholder="Years" className={inputClass('experience')} />
                {errors.experience && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.experience}</span>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="E.g UI/UX" className={inputClass('designation')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Emp. Type</label>
                <select name="empType" value={formData.empType} onChange={handleChange} className={inputClass('empType')}>
                  <option value="">Select</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="part-time">Part Time</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Freelancer Type</label>
                <select name="freelancerType" value={formData.freelancerType} onChange={handleChange} className={inputClass('freelancerType')}>
                  <option value="">Select</option>
                  <option value="individual">Individual</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Notice Period</label>
              <select name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} className={inputClass('noticePeriod')}>
                <option value="">Select</option>
                <option value="immediate">Immediate</option>
                <option value="15-days">15 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">LinkedIn Profile</label>
              <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/" className={inputClass('linkedin')} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Portfolio Website</label>
              <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://yourwebsite.com" className={inputClass('portfolio')} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Resume</label>
              <div className="h-24 w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all group">
                <UploadCloud className="w-6 h-6 text-blue-400 mb-2 group-hover:text-blue-600 transition-colors" />
                <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">Upload Resume<br/><span className="text-[8px] text-slate-400">PDF, DOCX (Max 5MB)</span></span>
              </div>
            </div>

          </div>
        </div>

        {/* Col 3: Skills & Expertise */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Skills & Expertise</h2>
          <div className="space-y-4">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Primary Skills <span className="text-red-500">*</span></label>
              <select name="primarySkills" value={formData.primarySkills} onChange={handleChange} className={inputClass('primarySkills')}>
                <option value="">Select Skills</option>
                <option value="design">UI/UX Design</option>
                <option value="development">Web Development</option>
                <option value="marketing">Digital Marketing</option>
              </select>
              {errors.primarySkills && <span className="text-[10px] text-red-500 font-bold block mt-1">{errors.primarySkills}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Other Skills</label>
              <select name="otherSkills" value={formData.otherSkills} onChange={handleChange} className={inputClass('otherSkills')}>
                <option value="">Select Skills</option>
                <option value="seo">SEO</option>
                <option value="video">Video Editing</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wide">Skill Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(lvl => (
                  <label key={lvl} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="skillLevel" value={lvl.toLowerCase()} checked={formData.skillLevel === lvl.toLowerCase()} onChange={handleChange} className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500" />
                    <span className="text-xs font-bold text-slate-600">{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide mt-4">Software</label>
              <select name="software" value={formData.software} onChange={handleChange} className={inputClass('software')}>
                <option value="">Select Software</option>
                <option value="figma">Figma</option>
                <option value="adobe">Adobe CC</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Languages</label>
              <select name="languages" value={formData.languages} onChange={handleChange} className={inputClass('languages')}>
                <option value="">Select Languages</option>
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
              </select>
            </div>

          </div>
        </div>

        {/* Col 4: Services & Availability */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
          
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
             <h2 className="text-sm font-bold text-slate-800">Services Offered</h2>
             <button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-colors">
               <Plus className="w-3 h-3" /> Add Service
             </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-2">Service Name</th>
                  <th className="pb-2">Min Price</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 font-bold text-slate-700">Logo Design</td>
                  <td className="py-2.5 font-semibold text-slate-600">₹1,000</td>
                  <td className="py-2.5 text-right flex justify-end gap-2">
                    <button className="text-blue-500 hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-700">UI/UX Flow</td>
                  <td className="py-2.5 font-semibold text-slate-600">₹5,000</td>
                  <td className="py-2.5 text-right flex justify-end gap-2">
                    <button className="text-blue-500 hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Availability</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Daily Hours</label>
                <select name="dailyHours" value={formData.dailyHours} onChange={handleChange} className={inputClass('dailyHours')}>
                  <option value="">Select</option>
                  <option value="2-4">2-4 Hours</option>
                  <option value="4-8">4-8 Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Weekly Days</label>
                <select name="weeklyDays" value={formData.weeklyDays} onChange={handleChange} className={inputClass('weeklyDays')}>
                  <option value="">Select</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Timezone</label>
                <select name="timezone" value={formData.timezone} onChange={handleChange} className={inputClass('timezone')}>
                  <option value="">Select</option>
                  <option value="IST">IST</option>
                  <option value="EST">EST</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Comms</label>
                <select name="comms" value={formData.comms} onChange={handleChange} className={inputClass('comms')}>
                  <option value="">Select</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>
          
        </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-4xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Professional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Total Experience (Years)</label>
              <input type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" className={inputClass('experience')} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Designation / Title</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Senior SEO Expert" className={inputClass('designation')} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Entity Type</label>
              <select name="empType" value={formData.empType} onChange={handleChange} className={inputClass('empType')}>
                <option value="">Select</option>
                <option value="freelancer">Individual Freelancer</option>
                <option value="agency">Agency / Company</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Freelancer Type</label>
              <select name="freelancerType" value={formData.freelancerType} onChange={handleChange} className={inputClass('freelancerType')}>
                <option value="">Select</option>
                <option value="fulltime">Full Time</option>
                <option value="parttime">Part Time</option>
                <option value="contract">Contract Basis</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-4xl animate-fade-in mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Dynamic Skills & Services</h2>
            <button 
              onClick={() => setSkillPricing([...skillPricing, { id: Date.now(), name: '', level: 'intermediate', billingType: 'hourly', rate: '' }])}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Skill
            </button>
          </div>
          
          <div className="space-y-4">
            {skillPricing.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-500">No skills added yet.</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add Skill" to define services.</p>
              </div>
            ) : (
              skillPricing.map((skill, index) => (
                <div key={skill.id || index} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Skill / Service Name</label>
                    <input 
                      type="text" 
                      value={skill.name} 
                      onChange={(e) => {
                        const newSkills = [...skillPricing];
                        newSkills[index].name = e.target.value;
                        setSkillPricing(newSkills);
                      }} 
                      placeholder="e.g. Logo Design, SEO" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Proficiency</label>
                    <select 
                      value={skill.level || 'intermediate'} 
                      onChange={(e) => {
                        const newSkills = [...skillPricing];
                        newSkills[index].level = e.target.value;
                        setSkillPricing(newSkills);
                      }} 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div className="pt-2 md:pt-6">
                    <button 
                      onClick={() => setSkillPricing(skillPricing.filter((_, i) => i !== index))}
                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 pt-5 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">General Software / Tools (Optional)</label>
            <input type="text" name="software" value={formData.software} onChange={handleChange} placeholder="Figma, Adobe CC, Ahrefs" className={inputClass('software')} />
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-4xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Portfolio & Documents</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Portfolio / Website URL</label>
                <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://..." className={inputClass('portfolio')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">LinkedIn Profile</label>
                <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className={inputClass('linkedin')} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group relative overflow-hidden ${docUploads.resume ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                onClick={() => document.getElementById('resumeUpload').click()}
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 truncate px-4">{docUploads.resume ? docUploads.resume.name : 'Upload Resume / CV'}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">{docUploads.resume ? 'Click to replace file' : 'PDF or Word Document'}</p>
                <input id="resumeUpload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleDocChange(e, 'resume')} />
              </div>
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group relative overflow-hidden ${docUploads.idProof ? 'border-purple-400 bg-purple-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                onClick={() => document.getElementById('idProofUploadFreelancer').click()}
              >
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 group-hover:scale-110 transition-all">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 truncate px-4">{docUploads.idProof ? docUploads.idProof.name : 'Upload ID Proof'}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">{docUploads.idProof ? 'Click to replace file' : 'Aadhar, PAN, or Passport'}</p>
                <input id="idProofUploadFreelancer" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocChange(e, 'idProof')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 5 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-4xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Skill-Based Pricing Matrix</h2>
          
          <div className="mb-8">
            {skillPricing.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-500">Please go back to Step 3 and add skills first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wide hidden md:grid">
                  <div className="col-span-5">Service / Skill</div>
                  <div className="col-span-4">Billing Type</div>
                  <div className="col-span-3">Rate (₹)</div>
                </div>
                {skillPricing.map((skill, index) => (
                  <div key={skill.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="col-span-1 md:col-span-5 font-bold text-slate-700 text-sm md:pl-2">{skill.name || 'Unnamed Skill'}</div>
                    <div className="col-span-1 md:col-span-4">
                      <label className="block md:hidden text-[10px] font-bold text-slate-500 mb-1 uppercase">Billing Type</label>
                      <select 
                        value={skill.billingType || 'hourly'} 
                        onChange={(e) => {
                          const newSkills = [...skillPricing];
                          newSkills[index].billingType = e.target.value;
                          setSkillPricing(newSkills);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="hourly">Hourly Rate</option>
                        <option value="project">Per Project / Deliverable</option>
                        <option value="retainer">Monthly Retainer</option>
                      </select>
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <label className="block md:hidden text-[10px] font-bold text-slate-500 mb-1 uppercase">Rate (₹)</label>
                      <input 
                        type="number" 
                        value={skill.rate || ''} 
                        onChange={(e) => {
                          const newSkills = [...skillPricing];
                          newSkills[index].rate = e.target.value;
                          setSkillPricing(newSkills);
                        }}
                        placeholder="e.g. 1500"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">General Availability</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Daily Available Hours</label>
              <input type="number" name="dailyHours" value={formData.dailyHours} onChange={handleChange} placeholder="e.g. 8" className={inputClass('dailyHours')} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Availability Status</label>
              <select name="availability" value={formData.availability} onChange={handleChange} className={inputClass('availability')}>
                <option value="">Select</option>
                <option value="immediate">Immediate</option>
                <option value="1_week">1 Week Notice</option>
                <option value="unavailable">Currently Unavailable</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeStep === 6 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-4xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Review & Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Internal Score (1-10)</label>
              <input type="number" min="1" max="10" name="reviewerScore" value={formData.reviewerScore} onChange={handleChange} placeholder="e.g. 9" className={inputClass('reviewerScore')} />
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">Based on portfolio quality and experience.</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Assign To Manager</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={inputClass('assignedTo')}>
                <option value="">Unassigned</option>
                <option value="mgr1">Alice Walker (Projects)</option>
                <option value="mgr2">Tom Hanks (Design)</option>
                <option value="mgr3">Bob Smith (Tech)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Final Admin Approval</label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all flex-1 ${
                  formData.adminApproval === 'pending' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}>
                  <input type="radio" name="adminApproval" value="pending" checked={formData.adminApproval === 'pending'} onChange={handleChange} className="hidden" />
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${formData.adminApproval === 'pending' ? 'border-yellow-500 bg-yellow-500' : 'border-slate-300'}`}></div>
                  <span className={`text-xs font-bold ${formData.adminApproval === 'pending' ? 'text-yellow-700' : 'text-slate-600'}`}>Pending Review</span>
                </label>
                
                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all flex-1 ${
                  formData.adminApproval === 'approved' ? 'border-green-400 bg-green-50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}>
                  <input type="radio" name="adminApproval" value="approved" checked={formData.adminApproval === 'approved'} onChange={handleChange} className="hidden" />
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${formData.adminApproval === 'approved' ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}></div>
                  <span className={`text-xs font-bold ${formData.adminApproval === 'approved' ? 'text-green-700' : 'text-slate-600'}`}>Approved</span>
                </label>

                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all flex-1 ${
                  formData.adminApproval === 'rejected' ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}>
                  <input type="radio" name="adminApproval" value="rejected" checked={formData.adminApproval === 'rejected'} onChange={handleChange} className="hidden" />
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${formData.adminApproval === 'rejected' ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}></div>
                  <span className={`text-xs font-bold ${formData.adminApproval === 'rejected' ? 'text-red-700' : 'text-slate-600'}`}>Rejected</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
