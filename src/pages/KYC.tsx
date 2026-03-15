import { useState } from 'react';
import { Shield, Upload, CheckCircle, Clock, AlertCircle, FileText, Camera } from 'lucide-react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { toastSuccess, toast } from '../components/Toast';

type KYCStep = 'intro' | 'personal' | 'documents' | 'selfie' | 'review' | 'submitted';

export default function KYC() {
  const { user } = useAppStore();
  const [step, setStep] = useState<KYCStep>('intro');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    dob: '',
    pan: '',
    aadhaar: '',
    gst: '',
    bankAccount: '',
    ifsc: '',
    bankName: '',
    address: '',
    pincode: '',
    state: '',
  });

  const steps = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'selfie', label: 'Selfie', icon: '🤳' },
    { id: 'review', label: 'Review', icon: '✅' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const handleSubmitKYC = async () => {
    setLoading(true);
    try {
      await supabase.from('kyc_submissions').upsert({
        user_id: user?.id,
        full_name: form.fullName,
        dob: form.dob,
        pan_number: form.pan,
        aadhaar_number: form.aadhaar,
        gst_number: form.gst || null,
        bank_account: form.bankAccount,
        ifsc_code: form.ifsc,
        bank_name: form.bankName,
        address: form.address,
        pincode: form.pincode,
        state: form.state,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      setStep('submitted');
      toastSuccess('KYC submitted successfully!');
    } catch (err: any) {
      toast('Submission failed: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const inp = (label: string, field: keyof typeof form, placeholder: string, required = true, type = 'text') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{label}{required && ' *'}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder} required={required}
        className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
    </div>
  );

  if (step === 'submitted') return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="text-6xl mb-4">🎉</div>
        <div className="text-xl font-black text-[#0D47A1] mb-2">KYC Submitted!</div>
        <p className="text-gray-500 text-[13px] mb-4">Your documents are under review. We'll notify you within <strong>24–48 hours</strong>.</p>
        <div className="bg-[#E8F5E9] rounded-xl p-4 text-left mb-5">
          <div className="text-[13px] font-bold text-[#2E7D32] mb-2">What happens next?</div>
          <div className="flex flex-col gap-1.5 text-[12px] text-[#388E3C]">
            <div>✓ Our team reviews your documents</div>
            <div>✓ You get email confirmation within 48 hours</div>
            <div>✓ Once approved, full seller/creator features unlock</div>
            <div>✓ Bank withdrawals become available</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-[13px] text-[#F57C00] font-semibold">
          <Clock size={16} /> Status: Pending Review
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D47A1] to-[#1565C0] rounded-2xl p-6 text-white mb-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} />
            <div>
              <div className="text-xl font-black">KYC Verification</div>
              <div className="text-white/75 text-[12px]">Verify your identity to unlock full features</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: '🏦', text: 'Enable withdrawals' },
              { icon: '✅', text: 'GST verified badge' },
              { icon: '🔓', text: 'Full platform access' },
            ].map((b, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-2.5 text-center text-[11px]">
                <div className="text-lg mb-1">{b.icon}</div>{b.text}
              </div>
            ))}
          </div>
        </div>

        {step === 'intro' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-[16px] font-black mb-4">Documents Required</div>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { icon: FileText, title: 'PAN Card', desc: 'Mandatory for all sellers & creators', required: true },
                { icon: FileText, title: 'Aadhaar Card', desc: '12-digit unique ID number', required: true },
                { icon: FileText, title: 'GST Certificate', desc: 'Required if GST registered', required: false },
                { icon: FileText, title: 'Bank Details', desc: 'Account number & IFSC for withdrawals', required: true },
                { icon: Camera, title: 'Selfie', desc: 'Clear face photo for identity match', required: true },
              ].map((doc, i) => {
                const Icon = doc.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-[#E3F2FD] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#1565C0]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold">{doc.title}</div>
                      <div className="text-[11px] text-gray-500">{doc.desc}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {doc.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStep('personal')} className="w-full bg-[#0D47A1] hover:bg-[#1565C0] text-white py-3 rounded-md font-black text-[14px] transition-colors">
              Start KYC Verification →
            </button>
          </div>
        )}

        {(step === 'personal' || step === 'documents' || step === 'selfie' || step === 'review') && (
          <>
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-5 bg-white rounded-xl p-4 shadow-sm">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-colors
                    ${i < currentStepIndex ? 'bg-[#2E7D32] text-white' : i === currentStepIndex ? 'bg-[#0D47A1] text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {i < currentStepIndex ? '✓' : s.icon}
                  </div>
                  <div className="hidden sm:block text-[11px] font-semibold text-gray-600">{s.label}</div>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              {step === 'personal' && (
                <>
                  <div className="text-[16px] font-black mb-4">👤 Personal Information</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inp('Full Name (as per PAN)', 'fullName', 'Your legal full name')}
                    {inp('Date of Birth', 'dob', '', true, 'date')}
                    {inp('Address', 'address', 'House/Flat No, Street, Area')}
                    {inp('Pincode', 'pincode', '400001')}
                    {inp('State', 'state', 'Maharashtra')}
                  </div>
                  <button onClick={() => setStep('documents')} className="w-full mt-5 bg-[#0D47A1] hover:bg-[#1565C0] text-white py-3 rounded-md font-black text-[14px] transition-colors">
                    Next: Documents →
                  </button>
                </>
              )}

              {step === 'documents' && (
                <>
                  <div className="text-[16px] font-black mb-4">📄 Document Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inp('PAN Number', 'pan', 'ABCDE1234F')}
                    {inp('Aadhaar Number', 'aadhaar', 'XXXX XXXX XXXX')}
                    {inp('GST Number (Optional)', 'gst', '22AAAAA0000A1Z5', false)}
                    {inp('Bank Account Number', 'bankAccount', 'Your account number')}
                    {inp('IFSC Code', 'ifsc', 'HDFC0001234')}
                    {inp('Bank Name', 'bankName', 'HDFC Bank')}
                  </div>
                  {/* Document Upload Notice */}
                  <div className="mt-4 bg-[#FFF3E0] border border-[#FFCC80] rounded-lg p-3 flex gap-2">
                    <AlertCircle size={16} className="text-[#E65100] shrink-0 mt-0.5" />
                    <div className="text-[12px] text-[#BF360C]">
                      <strong>Document Upload:</strong> Physical document upload (images/PDFs) requires cloud storage setup. Our team will contact you to collect documents securely if needed.
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setStep('personal')} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-md font-bold text-[13px] hover:bg-gray-50">← Back</button>
                    <button onClick={() => setStep('selfie')} className="flex-1 bg-[#0D47A1] hover:bg-[#1565C0] text-white py-3 rounded-md font-black text-[14px] transition-colors">Next: Selfie →</button>
                  </div>
                </>
              )}

              {step === 'selfie' && (
                <>
                  <div className="text-[16px] font-black mb-4">🤳 Identity Selfie</div>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 hover:border-[#1565C0] transition-colors cursor-pointer">
                    <Camera size={40} className="mx-auto text-gray-300 mb-3" />
                    <div className="text-[13px] font-bold text-gray-600 mb-1">Take or Upload Selfie</div>
                    <div className="text-[11px] text-gray-400 mb-3">Clear face photo, good lighting, no sunglasses</div>
                    <div className="bg-[#E3F2FD] text-[#0D47A1] text-[11px] font-bold px-4 py-2 rounded-full inline-block">
                      📸 Camera/Upload — Coming on Mobile App
                    </div>
                  </div>
                  <div className="bg-[#E8F5E9] rounded-lg p-3 mb-4">
                    <div className="text-[12px] text-[#2E7D32] font-semibold mb-1">✅ Selfie Guidelines:</div>
                    <div className="text-[11px] text-[#388E3C] flex flex-col gap-1">
                      <div>• Face clearly visible, no mask or glasses</div>
                      <div>• Good natural lighting, no shadows on face</div>
                      <div>• Plain background preferred</div>
                      <div>• Photo must match your ID documents</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('documents')} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-md font-bold text-[13px] hover:bg-gray-50">← Back</button>
                    <button onClick={() => setStep('review')} className="flex-1 bg-[#0D47A1] hover:bg-[#1565C0] text-white py-3 rounded-md font-black text-[14px] transition-colors">Next: Review →</button>
                  </div>
                </>
              )}

              {step === 'review' && (
                <>
                  <div className="text-[16px] font-black mb-4">✅ Review & Submit</div>
                  <div className="flex flex-col gap-3 mb-5">
                    {[
                      { label: 'Full Name', value: form.fullName },
                      { label: 'Date of Birth', value: form.dob },
                      { label: 'PAN Number', value: form.pan },
                      { label: 'Aadhaar', value: form.aadhaar ? '****' + form.aadhaar.slice(-4) : '—' },
                      { label: 'GST Number', value: form.gst || '—' },
                      { label: 'Bank Account', value: form.bankAccount ? '****' + form.bankAccount.slice(-4) : '—' },
                      { label: 'IFSC', value: form.ifsc },
                      { label: 'Bank', value: form.bankName },
                      { label: 'Address', value: form.address },
                      { label: 'State', value: form.state },
                    ].map((r, i) => r.value ? (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-[12px] text-gray-500 font-semibold">{r.label}</span>
                        <span className="text-[13px] font-bold">{r.value}</span>
                      </div>
                    ) : null)}
                  </div>
                  <div className="bg-[#E3F2FD] rounded-lg p-3 mb-4 text-[12px] text-[#1565C0]">
                    <strong>Declaration:</strong> I confirm that all information provided is accurate and the documents are genuine. I consent to Byndio verifying my identity for KYC compliance.
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('selfie')} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-md font-bold text-[13px] hover:bg-gray-50">← Back</button>
                    <button onClick={handleSubmitKYC} disabled={loading} className="flex-1 bg-[#2E7D32] hover:bg-[#388E3C] text-white py-3 rounded-md font-black text-[14px] transition-colors disabled:opacity-50">
                      {loading ? 'Submitting...' : '🚀 Submit KYC'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
