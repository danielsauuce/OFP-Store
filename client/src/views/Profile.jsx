import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Lock, Trash2, Save, Loader, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/authContext';
import Modal from '../views/admin/components/Modal';
import Avatar from '../views/admin/components/Avatar';
import {
  getUserProfileService,
  updateUserProfileService,
  uploadProfilePictureService,
  deactivateAccountService,
} from '../services/userService';
import { changePasswordService } from '../services/authService';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'danger', label: 'Account', icon: Trash2 },
];

const Profile = () => {
  const navigate = useNavigate();
  const { auth, signOut, setAuth } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!auth.authenticate) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [auth.authenticate]);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfileService();
      if (data?.success && data.user) {
        setProfile(data.user);
        setFullName(data.user.fullName || '');
        setPhoneNum(data.user.phone || '');
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const data = await updateUserProfileService({ fullName, phone: phoneNum });
      if (data?.success) {
        setProfile(data.user);
        setAuth((prev) => ({
          ...prev,
          user: { ...prev.user, fullName: data.user.fullName, phone: data.user.phone },
        }));
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const data = await uploadProfilePictureService(file);
      if (data?.success) {
        setProfile(data.user);
        toast.success('Profile picture updated');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation must match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const data = await changePasswordService({ currentPassword, newPassword });
      if (data?.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setDeletingAccount(true);
    try {
      const data = await deactivateAccountService();
      if (data?.success) {
        toast.success('Account deactivated');
        await signOut();
        navigate('/');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setDeletingAccount(false);
      setIsDeleteOpen(false);
    }
  };

  const getAvatarUrl = () =>
    profile?.profilePicture?.secureUrl || profile?.profilePicture?.url || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-3 bg-muted rounded-lg p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border shadow-card p-6">
              <h2 className="text-lg font-semibold mb-1">Profile Picture</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a photo to personalise your account
              </p>

              <div className="flex items-center gap-6">
                <div className="relative">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()}
                      alt={fullName}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar
                      name={fullName || auth.user?.email || 'U'}
                      size="h-24 w-24"
                      textSize="text-2xl"
                    />
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div>
                  <p className="font-medium">{fullName || 'No name set'}</p>
                  <p className="text-sm text-muted-foreground">{auth.user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-card p-6">
              <h2 className="text-lg font-semibold mb-1">Personal Information</h2>
              <p className="text-sm text-muted-foreground mb-4">Update your personal details</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" /> Full Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" /> Email
                    </label>
                    <input
                      value={auth.user?.email || ''}
                      disabled
                      className="w-full h-10 px-3 rounded-md bg-muted border border-border"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" /> Phone
                    </label>
                    <input
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md"
                  >
                    {saving ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="bg-card rounded-lg border border-border shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Change Password</h2>

            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border"
            />

            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md"
              >
                {changingPassword ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* DANGER TAB */}
        {activeTab === 'danger' && (
          <div className="bg-card rounded-lg border border-destructive/50 shadow-card p-6">
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>

            <div className="flex justify-between items-center mt-4 p-4 border border-destructive/30 rounded-lg">
              <div>
                <h4 className="font-medium">Deactivate Account</h4>
                <p className="text-sm text-muted-foreground">Contact support to reactivate.</p>
              </div>
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
              >
                <Trash2 className="h-4 w-4" />
                Deactivate
              </button>
            </div>
          </div>
        )}

        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Are you absolutely sure?"
          description="This will deactivate your account."
        >
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 border rounded-md">
              Cancel
            </button>
            <button
              onClick={handleDeactivateAccount}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
            >
              Deactivate Account
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Profile;
