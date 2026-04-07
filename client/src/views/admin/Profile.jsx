import { useState, useEffect } from 'react';
import { User, Camera, Save, Loader, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/authContext';
import Avatar from './components/Avatar';
import {
  getUserProfileService,
  updateUserProfileService,
  uploadProfilePictureService,
} from '../../services/userService';
import { changePasswordService } from '../../services/authService';

const AdminProfile = () => {
  const { auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const { user } = await getUserProfileService();
        setForm({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user } = await updateUserProfileService(form);
      setAuth((prev) => ({ ...prev, user: { ...prev.user, ...user } }));
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { user } = await uploadProfilePictureService(file);
      setAuth((prev) => ({ ...prev, user: { ...prev.user, ...user } }));
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to upload picture');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await changePasswordService({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your admin account settings</p>
      </div>

      {/* Avatar card */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="relative">
          <Avatar
            src={auth?.user?.profilePicture?.secureUrl || auth?.user?.profilePicture?.url}
            name={auth?.user?.fullName}
          />
          <label
            htmlFor="avatarInput"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
            aria-label="Change avatar"
          >
            <Camera className="h-4 w-4" />
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">{auth?.user?.fullName || 'Admin'}</p>
          <p className="text-sm text-muted-foreground">{auth?.user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            {auth?.user?.role || 'admin'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'details', label: 'Details', icon: User },
          { key: 'security', label: 'Security', icon: Lock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <form
          onSubmit={handleUpdateProfile}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <form
          onSubmit={handleChangePassword}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
          {['current', 'new', 'confirm'].map((field) => {
            const key =
              field === 'current'
                ? 'currentPassword'
                : field === 'new'
                  ? 'newPassword'
                  : 'confirmPassword';
            const label =
              field === 'current'
                ? 'Current Password'
                : field === 'new'
                  ? 'New Password'
                  : 'Confirm New Password';
            return (
              <div key={field}>
                <label htmlFor={key} className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id={key}
                    type={showPasswords[field] ? 'text' : 'password'}
                    value={passwordForm[key]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })
                    }
                    aria-label={showPasswords[field] ? 'Hide password' : 'Show password'}
                    aria-pressed={showPasswords[field]}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords[field] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {changingPassword ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Change Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminProfile;
