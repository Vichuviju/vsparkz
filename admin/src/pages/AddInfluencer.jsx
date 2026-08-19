import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, UploadCloud, MapPin, Star, Calendar } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

export function AddInfluencer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [activeStep, setActiveStep] = useState(1);
  const [recordId, setRecordId] = useState(id || null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '', gender: '', dob: '', email: '', mobile: '', whatsapp: '', altNumber: '',
    address: '', country: '', state: '', district: '', city: '', pincode: '', mapLocation: '',
    primaryCategory: '', contentType: '', subCategory: '', language: '', source: '', status: 'pending',
    instaHandle: '', instaFollowers: '', instaUrl: '',
    youtubeHandle: '', youtubeSubscribers: '', youtubeUrl: '',
    fbHandle: '', fbFollowers: '', fbUrl: '',
    reach: '', avgViews: '', consistency: '',
    instaMaxBudget: '', instaMinBudget: '', youtubeMaxBudget: '', youtubeMinBudget: '', fbMaxBudget: '', fbMinBudget: '',
    reviewerScore: '', assignedTo: '', adminApproval: 'pending'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docUploads, setDocUploads] = useState({ idProof: null, profileImage: null });

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
      api.get(`/admin/influencers/${id}`)
        .then(({ data }) => {
          const item = data.data || data;
          setFormData(prev => ({
            ...prev,
            fullName: item.name || '',
            email: item.email || '',
            mobile: item.phone || '',
            primaryCategory: item.category || '',
            language: item.language || '',
            status: item.status || 'pending',
            city: item.location ? item.location.split(',')[0] : '',
            ...(item.meta || {})
          }));
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode]);

  const steps = [
    { id: 1, label: 'Personal Details' },
    { id: 2, label: 'Social Media' },
    { id: 3, label: 'Audience & Content' },
    { id: 4, label: 'Pricing & Availability' },
    { id: 5, label: 'Documents' },
    { id: 6, label: 'Review & Assignment' }
  ];

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = ['fullName', 'gender', 'dob', 'email', 'mobile', 'address', 'country', 'state', 'district', 'city', 'pincode', 'primaryCategory', 'contentType'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'Required field';
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
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
          platform: 'Instagram', 
          followers: parseInt(formData.instaFollowers) || 0,
          engagement_rate: 0,
          language: formData.language || 'en',
          location: `${formData.city}, ${formData.state}`,
          category: formData.primaryCategory,
          email: formData.email,
          phone: formData.mobile,
          status: formData.status,
          meta: {
            gender: formData.gender, dob: formData.dob, whatsapp: formData.whatsapp, altNumber: formData.altNumber,
            address: formData.address, country: formData.country, state: formData.state, district: formData.district, pincode: formData.pincode, mapLocation: formData.mapLocation,
            contentType: formData.contentType, subCategory: formData.subCategory, source: formData.source,
            instaHandle: formData.instaHandle, instaFollowers: formData.instaFollowers, instaUrl: formData.instaUrl,
            youtubeHandle: formData.youtubeHandle, youtubeSubscribers: formData.youtubeSubscribers, youtubeUrl: formData.youtubeUrl,
            fbHandle: formData.fbHandle, fbFollowers: formData.fbFollowers, fbUrl: formData.fbUrl,
            reach: formData.reach, avgViews: formData.avgViews, consistency: formData.consistency,
            instaMaxBudget: formData.instaMaxBudget, instaMinBudget: formData.instaMinBudget, youtubeMaxBudget: formData.youtubeMaxBudget, youtubeMinBudget: formData.youtubeMinBudget, fbMaxBudget: formData.fbMaxBudget, fbMinBudget: formData.fbMinBudget,
            reviewerScore: formData.reviewerScore, assignedTo: formData.assignedTo, adminApproval: formData.adminApproval
          }
        };

        if (recordId) {
          await api.put(`/admin/influencers/${recordId}`, payload);
        } else {
          const res = await api.post('/admin/influencers', payload);
          setRecordId(res.data?.id || res.data?.data?.id);
        }
        
        toast.success(`Step ${activeStep} saved successfully!`);
        // Progress to next step instead of navigating away!
        setActiveStep(prev => prev < 6 ? prev + 1 : prev);
        
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || 'Failed to save influencer';
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
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Influencer Data...</div>;
  }

  return (
    <div className="font-sans min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:p-8">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
          <span>Influencers</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800">{isEditMode ? 'Edit' : 'Add'} Influencer</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit' : 'Add'} Influencer</h1>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/influencers')} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">
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

      {/* Main Form Content */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Col 1: Personal Info */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Personal Information</h2>
          <div className="space-y-4">
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" className={inputClass('fullName')} />
                {errors.fullName && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.fullName}</span>}
              </div>
              <div className="w-24 shrink-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Photo</label>
                <div 
                  className="h-[38px] w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group overflow-hidden relative"
                  onClick={() => document.getElementById('photoUpload').click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                  )}
                  <input id="photoUpload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass('gender')}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">DOB <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-1.5">
                   <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass('dob')} style={{paddingRight: 0}} />
                   <input type="text" value={calculateAge(formData.dob)} placeholder="Age" disabled className="w-10 px-1 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 text-center cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" className={inputClass('email')} />
              {errors.email && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.email}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Mobile Number <span className="text-red-500">*</span></label>
              <div className="flex">
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-2 border-r-0 shrink-0">🇮🇳 +91</div>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile number" className={`rounded-l-none ${inputClass('mobile')}`} />
              </div>
              {errors.mobile && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.mobile}</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">WhatsApp</label>
                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" className={inputClass('whatsapp')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Alt Number</label>
                <input type="tel" name="altNumber" value={formData.altNumber} onChange={handleChange} placeholder="Alternative" className={inputClass('altNumber')} />
              </div>
            </div>

          </div>
        </div>

        {/* Col 2: Address Info */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Address Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Address <span className="text-red-500">*</span></label>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter complete address" rows={3} className={`${inputClass('address')} resize-none`}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Country <span className="text-red-500">*</span></label>
                <select name="country" value={formData.country} onChange={handleChange} className={inputClass('country')}>
                  <option value="">Select</option>
                  <option value="IN">India</option>
                  <option value="US">USA</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">State <span className="text-red-500">*</span></label>
                <select name="state" value={formData.state} onChange={handleChange} className={inputClass('state')}>
                  <option value="">Select</option>
                  <option value="TN">Tamil Nadu</option>
                  <option value="KL">Kerala</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">District <span className="text-red-500">*</span></label>
                <select name="district" value={formData.district} onChange={handleChange} className={inputClass('district')}>
                  <option value="">Select</option>
                  <option value="CHE">Chennai</option>
                  <option value="CBE">Coimbatore</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">City <span className="text-red-500">*</span></label>
                <select name="city" value={formData.city} onChange={handleChange} className={inputClass('city')}>
                  <option value="">Select</option>
                  <option value="AnnaNagar">Anna Nagar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode <span className="text-red-500">*</span></label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter pincode" className={inputClass('pincode')} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Google Map Location</label>
              <div className="relative">
                <input type="text" name="mapLocation" value={formData.mapLocation} onChange={handleChange} placeholder="Search location" className={`pr-10 ${inputClass('mapLocation')}`} />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Basic Details */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Basic Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Primary Category <span className="text-red-500">*</span></label>
              <select name="primaryCategory" value={formData.primaryCategory} onChange={handleChange} className={inputClass('primaryCategory')}>
                <option value="">Select Category</option>
                <option value="tech">Technology</option>
                <option value="fashion">Fashion & Beauty</option>
                <option value="food">Food & Beverage</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Content Type <span className="text-red-500">*</span></label>
              <select name="contentType" value={formData.contentType} onChange={handleChange} className={inputClass('contentType')}>
                <option value="">Select Content Type</option>
                <option value="video">Video Shorts/Reels</option>
                <option value="blog">Blog Posts</option>
                <option value="photo">Photography</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Sub Category</label>
                <select name="subCategory" value={formData.subCategory} onChange={handleChange} className={inputClass('subCategory')}>
                  <option value="">Select</option>
                  <option value="gadgets">Gadgets</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Language</label>
                <select name="language" value={formData.language} onChange={handleChange} className={inputClass('language')}>
                  <option value="">Select</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Source / Reference</label>
              <input type="text" name="source" value={formData.source} onChange={handleChange} placeholder="How did you find?" className={inputClass('source')} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass('status')}>
                <option value="pending">Pending</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Added By</label>
                <input type="text" value="Admin User" disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Created Date</label>
                <div className="relative">
                  <input type="text" value={new Date().toLocaleDateString('en-GB')} disabled className="w-full pl-3 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 cursor-not-allowed" />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Col 4: Quick Tips */}
        <div className="xl:col-span-1">
          <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600 fill-purple-100" />
              </div>
              <h2 className="text-sm font-bold text-purple-900">Quick Tips</h2>
            </div>
            <ul className="space-y-4 mt-6">
              <li className="flex items-start gap-2.5 text-xs font-semibold text-purple-800 leading-snug">
                <span className="text-purple-400 mt-0.5">▸</span> Ensure all <span className="text-red-500 font-bold">*</span> marked fields are filled to save the form.
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-purple-800 leading-snug">
                <span className="text-purple-400 mt-0.5">▸</span> Age auto-calculates when Date of Birth is provided.
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-purple-800 leading-snug">
                <span className="text-purple-400 mt-0.5">▸</span> Data is securely cached in browser state as you navigate steps.
              </li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {activeStep === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center text-xs font-black">IG</span>
              Instagram Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Handle / Username</label>
                <input type="text" name="instaHandle" value={formData.instaHandle} onChange={handleChange} placeholder="@username" className={inputClass('instaHandle')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Followers Count</label>
                <input type="number" name="instaFollowers" value={formData.instaFollowers} onChange={handleChange} placeholder="e.g. 10000" className={inputClass('instaFollowers')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Profile URL</label>
                <input type="url" name="instaUrl" value={formData.instaUrl} onChange={handleChange} placeholder="https://instagram.com/..." className={inputClass('instaUrl')} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-xs font-black">YT</span>
              YouTube Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Channel Name</label>
                <input type="text" name="youtubeHandle" value={formData.youtubeHandle} onChange={handleChange} placeholder="Channel name" className={inputClass('youtubeHandle')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Subscribers</label>
                <input type="number" name="youtubeSubscribers" value={formData.youtubeSubscribers} onChange={handleChange} placeholder="e.g. 50000" className={inputClass('youtubeSubscribers')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Channel URL</label>
                <input type="url" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} placeholder="https://youtube.com/..." className={inputClass('youtubeUrl')} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-black">FB</span>
              Facebook Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Page Name</label>
                <input type="text" name="fbHandle" value={formData.fbHandle} onChange={handleChange} placeholder="Page name" className={inputClass('fbHandle')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Followers</label>
                <input type="number" name="fbFollowers" value={formData.fbFollowers} onChange={handleChange} placeholder="e.g. 5000" className={inputClass('fbFollowers')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Page URL</label>
                <input type="url" name="fbUrl" value={formData.fbUrl} onChange={handleChange} placeholder="https://facebook.com/..." className={inputClass('fbUrl')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-3xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Audience & Content Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Estimated Reach (Monthly)</label>
              <input type="text" name="reach" value={formData.reach} onChange={handleChange} placeholder="e.g. 1M - 5M" className={inputClass('reach')} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Avg. Views (Last 5 Videos)</label>
              <input type="number" name="avgViews" value={formData.avgViews} onChange={handleChange} placeholder="e.g. 50000" className={inputClass('avgViews')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Content Consistency</label>
              <div className="flex flex-wrap gap-3">
                {['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Irregular'].map(opt => (
                  <label key={opt} className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex-1 text-center ${
                    formData.consistency === opt ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}>
                    <input type="radio" name="consistency" value={opt} checked={formData.consistency === opt} onChange={handleChange} className="hidden" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-4xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Pricing & Budgeting Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Instagram</h3>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Min Budget (₹)</label>
                <input type="number" name="instaMinBudget" value={formData.instaMinBudget} onChange={handleChange} placeholder="1000" className={inputClass('instaMinBudget')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Max Budget (₹)</label>
                <input type="number" name="instaMaxBudget" value={formData.instaMaxBudget} onChange={handleChange} placeholder="5000" className={inputClass('instaMaxBudget')} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> YouTube</h3>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Min Budget (₹)</label>
                <input type="number" name="youtubeMinBudget" value={formData.youtubeMinBudget} onChange={handleChange} placeholder="2000" className={inputClass('youtubeMinBudget')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Max Budget (₹)</label>
                <input type="number" name="youtubeMaxBudget" value={formData.youtubeMaxBudget} onChange={handleChange} placeholder="10000" className={inputClass('youtubeMaxBudget')} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Facebook</h3>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Min Budget (₹)</label>
                <input type="number" name="fbMinBudget" value={formData.fbMinBudget} onChange={handleChange} placeholder="500" className={inputClass('fbMinBudget')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Max Budget (₹)</label>
                <input type="number" name="fbMaxBudget" value={formData.fbMaxBudget} onChange={handleChange} placeholder="3000" className={inputClass('fbMaxBudget')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 5 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-3xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Documents Upload</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group relative overflow-hidden ${docUploads.idProof ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
              onClick={() => document.getElementById('idProofUpload').click()}
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 truncate px-4">{docUploads.idProof ? docUploads.idProof.name : 'Upload ID Proof'}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">{docUploads.idProof ? 'Click to replace file' : 'Aadhar, PAN, or Passport (PDF/JPG)'}</p>
              <input id="idProofUpload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocChange(e, 'idProof')} />
            </div>
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group relative overflow-hidden ${docUploads.profileImage ? 'border-purple-400 bg-purple-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
              onClick={() => document.getElementById('profileImgUpload').click()}
            >
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 group-hover:scale-110 transition-all">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 truncate px-4">{docUploads.profileImage ? docUploads.profileImage.name : 'Upload Profile Image'}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">{docUploads.profileImage ? 'Click to replace image' : 'High resolution photo (JPG/PNG)'}</p>
              <input id="profileImgUpload" type="file" accept="image/*" className="hidden" onChange={(e) => handleDocChange(e, 'profileImage')} />
            </div>
          </div>
        </div>
      )}

      {activeStep === 6 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-3xl animate-fade-in mx-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Review & Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Reviewer Score (1-10)</label>
              <input type="number" min="1" max="10" name="reviewerScore" value={formData.reviewerScore} onChange={handleChange} placeholder="e.g. 8" className={inputClass('reviewerScore')} />
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">Based on content quality and historical reach.</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Assign To Employee</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={inputClass('assignedTo')}>
                <option value="">Unassigned</option>
                <option value="emp1">Sarah Jenkins (Sales)</option>
                <option value="emp2">Mike Ross (Marketing)</option>
                <option value="emp3">John Doe (Admin)</option>
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
                  <span className={`text-xs font-bold ${formData.adminApproval === 'approved' ? 'text-green-700' : 'text-slate-600'}`}>Approved & Active</span>
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
