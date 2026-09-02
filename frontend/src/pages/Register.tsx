import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { Eye, EyeOff, Plus, Trash2, Upload, ImageIcon, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { FaInstagram, FaFacebook, FaXTwitter, FaYoutube, FaLink } from 'react-icons/fa6';
import api from '../api/axios';

const PRESET_AVATARS = ['🏸', '🏆', '👟', '👕', '🔥', '🌟', '⚡', '💪'];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '', username: '', password: '', confirmPassword: '', communityName: ''
  });
  const [socialMedia, setSocialMedia] = useState<{ platform: string, url: string }[]>([]);
  const [logo, setLogo] = useState<string>('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'instagram': return <FaInstagram className="text-pink-600" size={16} />;
      case 'facebook': return <FaFacebook className="text-ink" size={16} />;
      case 'x': return <FaXTwitter className="text-primary dark:text-primary-dark" size={16} />;
      case 'youtube': return <FaYoutube className="text-red-600" size={16} />;
      default: return <FaLink className="text-muted-ink" size={16} />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        setIsModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    setMessage(null);
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setMessage({ type: 'error', text: t('fill_account_details') });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: t('pass_unmatch') });
      return;
    }
    setStep(2);
  };

  const addSocial = () => setSocialMedia([...socialMedia, { platform: 'instagram', url: '' }]);
  const updateSocial = (index: number, key: 'platform' | 'url', value: string) => {
    const updated = [...socialMedia];
    updated[index][key] = value;
    setSocialMedia(updated);
  };
  const removeSocial = (index: number) => setSocialMedia(socialMedia.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.communityName) {
      setMessage({ type: 'error', text: t('comm_name_req') });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const finalLogo = logo || '🏸';
      const response = await api.post('/auth/register', { ...formData, socialMedia, logo: finalLogo });
      setMessage({ type: 'success', text: response.data.message });
      setTimeout(() => navigate('/login'), 3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('server_error') });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "w-full px-3 py-2.5 bg-app dark:bg-app-dark/50 border border-default dark:border-default-dark rounded-lg focus:ring-2 focus:ring-ink outline-none transition-all text-sm";
  const labelStyles = "block text-sm font-medium mb-1.5 text-primary-soft dark:text-muted-dark";

  return (
    <>
      <AuthLayout title={t('register')}>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-ink' : 'bg-muted dark:bg-elevated-dark'}`}></div>
          <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-ink' : 'bg-muted dark:bg-elevated-dark'}`}></div>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="flex flex-col gap-4">
          {message && <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-400' : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:border-green-900/50 dark:text-green-400'}`}>{message.text}</div>}

          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className={labelStyles}>{t('email')}</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputStyles} placeholder={t('ph_email')} />
              </div>

              <div>
                <label className={labelStyles}>{t('username')}</label>
                <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={inputStyles} placeholder={t('ph_username')} />
              </div>

              <div>
                <label className={labelStyles}>{t('password')}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`${inputStyles} pr-10`} placeholder={t('register_password_hint')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted-ink dark:hover:text-primary-dark flex items-center justify-center">
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelStyles}>{t('confirm_password')}</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={`${inputStyles} pr-10`} placeholder={t('register_password_hint')} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted-ink dark:hover:text-primary-dark flex items-center justify-center">
                    {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button type="submit" className="mt-2 w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm">
                {t('continue')} <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">

              <div className="flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="relative group w-20 h-20 rounded-full border border-dashed border-default dark:border-default-dark flex items-center justify-center bg-app dark:bg-surface-dark/50 hover:border-ink hover:bg-accent-soft dark:hover:bg-accent-soft-dark transition-all overflow-hidden text-3xl shadow-sm"
                >
                  {logo ? (
                    logo.startsWith('data:image') ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <span>{logo}</span>
                  ) : (
                    <ImageIcon className="text-faint group-hover:text-ink transition-colors" size={24} />
                  )}

                  <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center transition-all">
                    <span className="text-white text-xs font-medium">{t('edit')}</span>
                  </div>
                </button>
              </div>

              <div>
                <label className={labelStyles}>{t('community_name')}</label>
                <input type="text" required placeholder={t('ph_comm_name')} value={formData.communityName} onChange={(e) => setFormData({...formData, communityName: e.target.value})} className={inputStyles} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelStyles} style={{marginBottom: 0}}>{t('social_links')} <span className="text-faint font-normal">{t('optional')}</span></label>
                  <button type="button" onClick={addSocial} className="text-xs flex items-center gap-1 text-ink hover:text-ink font-medium bg-accent-soft dark:bg-accent-soft-dark px-2 py-1.5 rounded-md transition-colors">
                    <Plus size={14}/> {t('add_link')}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {socialMedia.map((social, index) => (
                    <div key={index} className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                      <div className="relative w-32 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                          {getPlatformIcon(social.platform)}
                        </div>
                        <select value={social.platform} onChange={(e) => updateSocial(index, 'platform', e.target.value)} className="w-full pl-8 pr-2 py-2 bg-app dark:bg-app-dark/50 border border-default dark:border-default-dark rounded-lg text-xs appearance-none focus:ring-2 focus:ring-ink outline-none">
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="x">X</option>
                          <option value="youtube">YouTube</option>
                          <option value="other">{t('other')}</option>
                        </select>
                      </div>
                      <input type="url" placeholder="https://" value={social.url} onChange={(e) => updateSocial(index, 'url', e.target.value)} className="flex-1 px-3 py-2 bg-app dark:bg-app-dark/50 border border-default dark:border-default-dark rounded-lg text-xs focus:ring-2 focus:ring-ink outline-none" />
                      <button type="button" onClick={() => removeSocial(index)} className="p-2 text-faint hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                  {socialMedia.length === 0 && (
                    <div className="text-center py-3 bg-app dark:bg-surface-dark/30 rounded-lg border border-dashed border-subtle dark:border-subtle-dark">
                      <p className="text-xs text-muted-ink">{t('no_social_links')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center px-4 py-2.5 bg-muted hover:bg-gray-200 dark:bg-elevated-dark dark:hover:bg-gray-700 text-primary-soft dark:text-muted-dark rounded-lg transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 bg-ink hover:bg-ink-soft disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors text-sm">
                  {isLoading ? t('processing') : t('complete_reg')}
                </button>
              </div>
            </div>
          )}

        </form>
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-subtle-dark/50 text-center">
          <p className="text-sm text-muted-ink dark:text-faint">
            {t('have_account')} <Link to="/login" className="text-ink hover:text-ink hover:underline font-medium">{t('login')}</Link>
          </p>
        </div>
      </AuthLayout>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-subtle-dark">
              <h3 className="font-semibold text-primary dark:text-primary-dark">{t('select_logo')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-faint hover:text-muted-ink dark:hover:text-primary-dark hover:bg-muted dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {PRESET_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { setLogo(emoji); setIsModalOpen(false); }}
                    className="aspect-square text-2xl flex items-center justify-center bg-app hover:bg-muted dark:bg-elevated-dark/50 dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-subtle dark:hover:border-gray-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-subtle dark:border-subtle-dark"></div></div>
                <div className="relative flex justify-center text-xs"><span className="px-2 bg-surface dark:bg-surface-dark text-faint uppercase font-medium">{t('or_upload')}</span></div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-app hover:bg-muted dark:bg-elevated-dark/80 dark:hover:bg-gray-800 border border-subtle dark:border-default-dark rounded-lg font-medium text-sm transition-colors text-primary-soft dark:text-muted-dark"
              >
                <Upload size={16} />
                {t('upload_image')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}