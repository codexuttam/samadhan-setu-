import React, { useState, useEffect, useRef } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { CATEGORIES, DEPARTMENTS, WARDS, Complaint, getDepartmentForCategory, computeSLADeadline, getSLADurationHours } from '../data/mockData';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  UploadCloud,
  FileText,
  MapPin,
  Lock,
  Phone,
  Layers,
  Sparkles,
  Mic,
  Square,
} from 'lucide-react';

interface RaiseComplaintPageProps {
  onAddComplaint: (complaint: Complaint) => void;
  setPage: (page: string) => void;
  setSelectedTrackedId: (id: string) => void;
  setTrackingInput: (id: string) => void;
}

export default function RaiseComplaintPage({
  onAddComplaint,
  setPage,
  setSelectedTrackedId,
  setTrackingInput,
}: RaiseComplaintPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Voice recording states for AI Speech-to-Text
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64Data }),
            });

            if (!response.ok) throw new Error('Transcription request failed');
            const data = await response.json();
            
            if (data.text && data.text.trim()) {
              setDescription(prev => prev ? prev + '\n' + data.text : data.text);
              alert('🎙️ Voice note successfully transcribed!');
            } else {
              alert('Could not transcribe audio. Speak closely into the microphone.');
            }
          };
        } catch (err) {
          console.error(err);
          alert('Error during audio transcription.');
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Could not access microphone! Grant microphone permissions to Samadhan Setu in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Form States
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Amravati');
  const [wardId, setWardId] = useState('');
  const [pincode, setPincode] = useState('444601');
  const [lat, setLat] = useState(20.9300);
  const [lng, setLng] = useState(77.7500);

  const [evidenceFiles, setEvidenceFiles] = useState<Array<{ name: string; size: string; type: string }>>([]);
  
  const [citizenName, setCitizenName] = useState('Uttamraj Singh');
  const [citizenPhone, setCitizenPhone] = useState('+91 79881 44248');
  const [citizenEmail, setCitizenEmail] = useState('uttamrajsingh423@gmail.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successComplaintId, setSuccessComplaintId] = useState<string | null>(null);

  // Load preselected category from homepage if any
  useEffect(() => {
    const preselected = sessionStorage.getItem('preselected_category_id');
    if (preselected) {
      setCategoryId(preselected);
      const cat = CATEGORIES.find(c => c.id === preselected);
      if (cat && cat.subcategories.length > 0) {
        setSubcategory(cat.subcategories[0]);
      }
      sessionStorage.removeItem('preselected_category_id');
    }
  }, []);

  const handleCategorySelect = (id: string) => {
    setCategoryId(id);
    const cat = CATEGORIES.find(c => c.id === id);
    if (cat && cat.subcategories.length > 0) {
      setSubcategory(cat.subcategories[0]);
    }
    setCurrentStep(2);
  };

  const handleUseCurrentLocation = () => {
    setLat(20.9312);
    setLng(77.7515);
    setWardId('ward_12');
    setAddress('Plot 24, Near Municipal High School, Parvati Nagar');
    setPincode('444605');
  };

  const handleMapPin = (data: { lat: number; lng: number; wardId: string; address: string }) => {
    setLat(data.lat);
    setLng(data.lng);
    setWardId(data.wardId);
    setAddress(data.address);
    // Auto-fill pincode based on ward
    if (data.wardId === 'ward_12') setPincode('444605');
    else if (data.wardId === 'ward_8') setPincode('444601');
    else if (data.wardId === 'ward_5') setPincode('444602');
    else if (data.wardId === 'ward_14') setPincode('444607');
  };

  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type || 'image/jpeg',
      }));
      setEvidenceFiles(prev => [...prev, ...fileList]);
    }
  };

  const handleSendOtpSimulated = () => {
    if (!citizenPhone.trim()) return;
    setOtpSent(true);
    setOtpError('');
    alert('🔐 Demo OTP Sent! Use verification code: "2026" to complete submission.');
  };

  const handleVerifyOtpSimulated = () => {
    if (otpCode === '2026') {
      setOtpVerified(true);
      setOtpError('');
    } else {
      setOtpError('Invalid code! Enter "2026" for this demo verification.');
    }
  };

  const handleFormSubmission = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      // Create random complaint ID
      const randomIdSuffix = Math.floor(100000 + Math.random() * 900000);
      const generatedId = `SS2026${randomIdSuffix}`;

      const matchedDept = getDepartmentForCategory(categoryId);

      const createdComplaint: Complaint = {
        id: generatedId,
        citizenId: 'cit_uttam',
        citizenName,
        citizenPhone,
        citizenEmail,
        categoryId,
        subcategory,
        departmentId: matchedDept,
        wardId: wardId || 'ward_12',
        title,
        description,
        priority,
        latitude: lat,
        longitude: lng,
        address: address || 'Main Road Intersection',
        city,
        pincode,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaDeadline: computeSLADeadline(new Date().toISOString(), priority),
        slaBreached: false,
        evidenceUrls: evidenceFiles.map(() => ''),
      };

      onAddComplaint(createdComplaint);
      setSuccessComplaintId(generatedId);
      setIsSubmitting(false);
      setCurrentStep(7); // success page step
    }, 1200);
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.id === categoryId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 select-none">
      
      {/* Step Indicators Header */}
      {currentStep <= 6 && (
        <div className="mb-10">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            <button
              onClick={() => {
                if (currentStep > 1) setCurrentStep(currentStep - 1);
                else setPage('home');
              }}
              className="flex items-center gap-1.5 hover:text-[#F4511E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span>Step {currentStep} of 6</span>
          </div>

          <div className="grid grid-cols-6 gap-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className={`h-full transition-all duration-300 ${
                  currentStep >= num ? 'bg-[#F4511E]' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: CHOOSE CATEGORY */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D]">What is the issue?</h1>
            <p className="text-xs sm:text-sm text-[#64748B]">Select the category that best matches your civic complaint.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`flex items-center text-left p-5 rounded-xl border bg-white hover:border-[#F4511E] hover:scale-[1.01] transition-all group ${
                  categoryId === category.id ? 'border-[#F4511E] ring-1 ring-[#F4511E]' : 'border-[#E5E7EB]'
                }`}
              >
                <div className={`p-3 rounded-lg mr-4 border ${category.bgTint}`}>
                  {category.id === 'roads_potholes' && <Layers className="w-6 h-6 shrink-0" />}
                  {category.id !== 'roads_potholes' && <Sparkles className="w-6 h-6 shrink-0" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F1B2D] group-hover:text-[#F4511E]">{category.name}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{category.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: DESCRIBE ISSUE DETAILS */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F1B2D]">Issue Details</h2>
            <p className="text-xs text-[#64748B] mt-1">Provide a clear title, category sub-type, and write a detailed description.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Category summary banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-bold">Category selected</span>
                <span className="font-bold text-[#0F1B2D]">{selectedCategoryObj?.name}</span>
              </div>
              <button onClick={() => setCurrentStep(1)} className="text-[#F4511E] font-bold hover:underline">Change</button>
            </div>

            {/* Subcategory */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Specific Sub-Category *</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
              >
                {selectedCategoryObj?.subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Complaint Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Complaint Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Huge open pothole opposite DPS school entrance"
                className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Detailed Description *</label>
                
                {/* Voice Dictation AI Interface */}
                <div className="flex items-center gap-2">
                  {isTranscribing ? (
                    <span className="flex items-center gap-1.5 text-[10px] text-orange-500 font-extrabold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping" /> Transcribing Audio...
                    </span>
                  ) : isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-xs animate-pulse"
                    >
                      <Square className="w-2.5 h-2.5 fill-white shrink-0" /> Stop Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 border border-orange-100 text-[#F4511E] px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-xs transition-all"
                    >
                      <Mic className="w-2.5 h-2.5 text-[#F4511E] shrink-0" /> Dictate with Voice (AI)
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the exact issue, safety risks, and specify landmark guides if any to help ward officers find the site immediately."
                rows={5}
                className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                required
              />
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Urgency Level *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(['low', 'medium', 'high', 'critical'] as const).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPriority(pri)}
                    className={`py-2 px-3 rounded-lg border text-center font-bold uppercase tracking-wider text-[10px] transition-all ${
                      priority === pri
                        ? 'bg-[#0F1B2D] border-[#0F1B2D] text-white shadow-xs'
                        : 'border-[#E5E7EB] bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {priority === 'low' && 'SLA Deadline: 72 hours response time.'}
                {priority === 'medium' && 'SLA Deadline: 48 hours response time.'}
                {priority === 'high' && 'SLA Deadline: 24 hours response time.'}
                {priority === 'critical' && 'SLA Deadline: 6 hours emergency response.'}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (title.trim() && description.trim()) setCurrentStep(3);
                else alert('Please fill in all required fields!');
              }}
              className="flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Next: Location <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SPECIFY LOCATION */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#0F1B2D]">Where is the issue?</h2>
              <p className="text-xs text-[#64748B] mt-1">Pin the location on the map or input addresses manually.</p>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" /> Use my current location
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Fields */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Ward *</label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                  required
                >
                  <option value="">-- Choose Ward Area --</option>
                  {WARDS.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Specific Block/House/Street Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, landmark details, shop corner"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={city}
                    disabled
                    className="w-full px-3 py-2.5 bg-slate-100 border border-[#E5E7EB] rounded-lg text-xs text-slate-500 font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Pincode *</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="444601"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-[#64748B] block uppercase tracking-wider">Pinned GPS Coordinates</span>
                <p className="font-mono text-[10px] font-bold text-[#0F1B2D]">Lat: {lat.toFixed(4)} · Lng: {lng.toFixed(4)}</p>
              </div>
            </div>

            {/* Right: Map Vector */}
            <div className="lg:col-span-7 h-[280px] sm:h-full min-h-[250px] rounded-xl overflow-hidden border border-[#E5E7EB]">
              <InteractiveMap interactive={true} onSelectLocation={handleMapPin} selectedCoords={{ lat, lng }} selectedWardId={wardId} />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-slate-500 font-bold text-xs hover:underline uppercase"
            >
              Previous Step
            </button>
            <button
              onClick={() => {
                if (wardId && address.trim() && pincode.trim()) setCurrentStep(4);
                else alert('Please specify the ward, address and pincode to proceed!');
              }}
              className="flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Next: Evidence <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: UPLOAD EVIDENCE */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F1B2D]">Upload Evidence</h2>
            <p className="text-xs text-[#64748B] mt-1">Upload clear photos, video, or documents to substantiate your grievance.</p>
          </div>

          {/* File Drag and Drop Box */}
          <div className="border-2 border-dashed border-slate-200 hover:border-[#F4511E] bg-slate-50 rounded-2xl p-8 text-center transition-all relative">
            <input
              type="file"
              multiple
              onChange={handleFileUploadSimulated}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-white rounded-full border border-slate-100 shadow-xs text-[#F4511E]">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#0F1B2D]">Drag & Drop or Click to browse</p>
                <p className="text-[10px] text-[#64748B]">Supports JPEG, PNG, MP4 up to 25MB total. (Simulated Uploader)</p>
              </div>
            </div>
          </div>

          {/* Uploaded File list */}
          {evidenceFiles.length > 0 && (
            <div className="space-y-2 text-xs">
              <p className="font-bold text-[#0F1B2D] uppercase tracking-wider">Uploaded Files ({evidenceFiles.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evidenceFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-[#0F172A] truncate max-w-[150px]">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                      <span>{file.size}</span>
                      <button
                        onClick={() => setEvidenceFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:underline font-sans font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="text-slate-500 font-bold text-xs hover:underline uppercase"
            >
              Previous Step
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Next: Contact Info <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONTACT INFORMATION & DEMO OTP */}
      {currentStep === 5 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F1B2D]">Contact Verification</h2>
            <p className="text-xs text-[#64748B] mt-1">We require verified contact details to prevent fraudulent reporting and send live status updates via SMS / Email.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Mobile Phone Number (WhatsApp / SMS updates) *</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  disabled={otpVerified}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] font-semibold text-[#0F172A]"
                  required
                />
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtpSimulated}
                    className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                  >
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            {/* OTP Code Box */}
            {otpSent && !otpVerified && (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#F4511E]" />
                  <span className="font-bold text-[#0F1B2D]">Verify Code</span>
                </div>
                <p className="text-[11px] text-slate-500">Enter the verification code sent to {citizenPhone}. For this demo, type <strong className="text-[#0F1B2D]">2026</strong>.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 2026"
                    className="max-w-[120px] px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-center text-xs font-bold font-mono tracking-widest text-[#0F172A]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtpSimulated}
                    className="bg-[#16A34A] hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Verify OTP
                  </button>
                </div>
                {otpError && <p className="text-red-500 text-[10px] font-bold mt-1">{otpError}</p>}
              </div>
            )}

            {otpVerified && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-800 font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Mobile verification complete!
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(4)}
              className="text-slate-500 font-bold text-xs hover:underline uppercase"
            >
              Previous Step
            </button>
            <button
              onClick={() => {
                if (otpVerified) setCurrentStep(6);
                else alert('Please verify your mobile number with the OTP code first! Enter "2026" inside the OTP block.');
              }}
              className="flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Next: Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: REVIEW SUMMARY */}
      {currentStep === 6 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F1B2D]">Review & Submit</h2>
            <p className="text-xs text-[#64748B] mt-1">Please confirm that all information is complete and accurate before submission.</p>
          </div>

          <div className="divide-y divide-slate-100 space-y-4">
            {/* Category & Title */}
            <div className="space-y-1 pb-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">COMPLAINT PROFILE</p>
              <h3 className="text-base font-extrabold text-[#0F172A]">{title}</h3>
              <p className="text-[#64748B]">Category: <strong className="text-[#0F1B2D]">{selectedCategoryObj?.name}</strong> · Priority: <strong className="text-red-500 uppercase">{priority}</strong></p>
            </div>

            {/* Description */}
            <div className="py-4 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DESCRIPTION</p>
              <p className="text-[#475569] leading-relaxed whitespace-pre-wrap font-medium">{description}</p>
            </div>

            {/* Location */}
            <div className="py-4 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LOCATION</p>
              <p className="text-[#0F172A] font-bold">📍 {address}, Amravati - {pincode}</p>
              <p className="text-[10px] text-[#64748B]">Ward No: <strong className="text-[#0F1B2D] uppercase">{WARDS.find(w => w.id === wardId)?.name}</strong> · Coords: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}</p>
            </div>

            {/* Contact details */}
            <div className="py-4 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">REPORTER DETAILS (VERIFIED)</p>
              <p className="font-bold text-[#0F172A]">{citizenName}</p>
              <p className="text-slate-500">Phone: {citizenPhone} · Email: {citizenEmail}</p>
            </div>

            {/* Files */}
            {evidenceFiles.length > 0 && (
              <div className="py-4 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ATTACHED EVIDENCE</p>
                <p className="font-medium text-slate-600">{evidenceFiles.length} files successfully staged for upload.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(5)}
              className="text-slate-500 font-bold text-xs hover:underline uppercase"
            >
              Edit Details
            </button>
            <button
              onClick={handleFormSubmission}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-[#16A34A] hover:bg-emerald-600 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              {isSubmitting ? 'Submitting Compliant...' : 'Submit Complaint ✓'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: SUCCESS PAGE & Printable receipt */}
      {currentStep === 7 && successComplaintId && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 space-y-6 shadow-xs text-center text-xs max-w-lg mx-auto">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-500">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F1B2D]">Complaint Filed!</h2>
            <p className="text-xs text-[#64748B]">Your grievance has been successfully submitted and logged inside the Samadhan Setu directory.</p>
          </div>

          {/* Receipt display block */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-left space-y-3 font-sans">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-100 pb-2">
              <span>SAMADHAN SETU RECEIPT</span>
              <span>DATE: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-[#64748B]">Complaint Tracking ID:</p>
              <p className="text-sm font-extrabold text-[#0F172A] font-mono tracking-widest">{successComplaintId}</p>
            </div>
            <div className="space-y-1 pt-1 text-[11px] text-[#475569]">
              <p>Category: <strong className="text-[#0F172A]">{selectedCategoryObj?.name}</strong></p>
              <p>Address: <strong className="text-[#0F172A]">{address}</strong></p>
              <p>SLA Target: <strong className="text-red-500 uppercase">{priority} priority ({getSLADurationHours(priority)} hours)</strong></p>
            </div>
          </div>

          {/* Direct CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setTrackingInput(successComplaintId);
                setSelectedTrackedId(successComplaintId);
                setPage('track');
              }}
              className="flex-1 bg-[#0F1B2D] hover:bg-slate-800 text-white py-3 rounded-lg font-bold uppercase tracking-wider transition-colors text-[10px]"
            >
              Track Complaint
            </button>
            <button
              onClick={() => {
                alert(`⬇️ Downloading PDF Receipt for ${successComplaintId} to your system...`);
              }}
              className="flex-1 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors text-[10px]"
            >
              Download Receipt
            </button>
          </div>
          
          <button
            onClick={() => setPage('home')}
            className="text-[#F4511E] font-bold hover:underline block mx-auto text-[10px] uppercase tracking-wider pt-2"
          >
            Back to Home Page
          </button>
        </div>
      )}

    </div>
  );
}
