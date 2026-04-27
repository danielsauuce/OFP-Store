import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Camera,
  Lock,
  Trash2,
  Save,
  Loader,
  Mail,
  Phone,
  Package,
  MapPin,
  Plus,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useAuth } from '../context/authContext';
import { useWishlist } from '../context/wishlistContext';
import Modal from '../views/admin/components/Modal';
import Avatar from '../views/admin/components/Avatar';
import StatusBadge from '../views/admin/components/StatusBadge';
import {
  getUserProfileService,
  updateUserProfileService,
  uploadProfilePictureService,
  deactivateAccountService,
  getAddressesService,
  addAddressService,
  deleteAddressService,
  setDefaultAddressService,
} from '../services/userService';
import { changePasswordService } from '../services/authService';
import { getUserOrdersService, cancelOrderService } from '../services/orderService';
import { changePasswordWithConfirmSchema, validateForm } from '../validation/formSchemas';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'danger', label: 'Account', icon: Trash2 },
];

const orderStatusStyles = {
  delivered: 'bg-accent/20 text-accent',
  pending: 'bg-gold/20 text-gold',
  processing: 'bg-primary/20 text-primary',
  shipped: 'bg-accent/20 text-accent',
  cancelled: 'bg-destructive/20 text-destructive',
};

const VALID_TABS = TABS.map((t) => t.key);

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { auth, signOut, setAuth } = useAuth();
  const { wishlist, loading: wishlistLoading, removeFromWishlist } = useWishlist();

  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : 'profile';

  const setActiveTab = useCallback(
    (tab) => {
      setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true });
    },
    [setSearchParams],
  );
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
  const [passwordErrors, setPasswordErrors] = useState({});

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    isDefault: false,
  });

  const tabContentRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    if (!auth.authenticate) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [auth.authenticate]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (!auth.authenticate) return;
    if (activeTab === 'orders' && orders.length === 0) {
      fetchOrders(1);
    }
    if (activeTab === 'addresses' && addresses.length === 0) {
      fetchAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, auth.authenticate]);

  // Page entrance
  useLayoutEffect(() => {
    if (loading || !pageRef.current || window.Cypress) return;
    const ctx = gsap.context(() => {
      gsap.from('.profile-header', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      });
      gsap.from('.profile-tabs', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.15,
        ease: 'power3.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  // Tab switch animation
  const animateTabContent = useCallback(() => {
    if (!tabContentRef.current || window.Cypress) return;
    gsap.fromTo(
      tabContentRef.current,
      { y: 25, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
    );
  }, []);

  useLayoutEffect(() => {
    if (!loading) animateTabContent();
  }, [activeTab, loading, animateTabContent]);

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

  const fetchOrders = async (page) => {
    setOrdersLoading(true);
    try {
      const data = await getUserOrdersService(page, 5);
      if (data?.success) {
        setOrders(data.orders || []);
        setOrdersPagination(data.pagination);
        setOrdersPage(page);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const data = await getAddressesService();
      if (data?.success) {
        setAddresses(data.addresses || []);
      }
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setAddressesLoading(false);
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
    const { success, data, errors } = validateForm(changePasswordWithConfirmSchema, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!success) {
      setPasswordErrors(errors);
      if (tabContentRef.current) {
        Object.keys(errors).forEach((fieldName) => {
          const el = tabContentRef.current.querySelector(`[name="${fieldName}"]`);
          if (el) {
            gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
          }
        });
      }
      return;
    }

    setPasswordErrors({});
    setChangingPassword(true);
    try {
      const result = await changePasswordService({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (result?.success) {
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

  const handleCancelOrder = async (orderId) => {
    setCancellingOrder(orderId);
    try {
      const data = await cancelOrderService(orderId);
      if (data?.success) {
        toast.success('Order cancelled');
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o)),
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.postalCode) {
      toast.error('Please fill in street, city, and postal code');
      return;
    }
    setAddingAddress(true);
    try {
      const data = await addAddressService(addressForm);
      if (data?.success) {
        toast.success('Address added');
        setIsAddAddressOpen(false);
        setAddressForm({
          label: 'Home',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Nigeria',
          isDefault: false,
        });
        fetchAddresses();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const data = await deleteAddressService(addressId);
      if (data?.success) {
        toast.success('Address removed');
        setAddresses((prev) => prev.filter((a) => a._id !== addressId));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const data = await setDefaultAddressService(addressId);
      if (data?.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to set default address');
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

  const clearPasswordError = (field) => {
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="profile-header mb-8">
          <h1 className="text-3xl font-bold font-serif">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="profile-tabs mb-6">
          <div className="flex overflow-x-auto bg-muted rounded-lg p-1 gap-1 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    activeTab === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div ref={tabContentRef}>
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
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary-dark transition-colors"
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
                        name="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4" /> Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={auth.user?.email || ''}
                        disabled
                        className="w-full h-10 px-3 rounded-md bg-muted border border-border text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4" /> Phone
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={phoneNum}
                        onChange={(e) => setPhoneNum(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="border-t pt-4 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary-dark transition-colors"
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

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">My Orders</h2>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Link
                      to="/shop"
                      className="inline-flex mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground">
                              #{order.orderNumber}
                            </span>
                            <StatusBadge
                              status={order.orderStatus}
                              statusStyles={orderStatusStyles}
                            />
                          </div>
                          <span className="text-xl font-bold text-primary">
                            ₦{order.total?.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {order.items?.length || 0} item
                          {(order.items?.length || 0) !== 1 ? 's' : ''} &bull;{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>

                        {/* Order items preview */}
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {order.items?.slice(0, 4).map((item, idx) => {
                            const img =
                              item.product?.primaryImage?.secureUrl || item.imageSnapshot || '';
                            return img ? (
                              <img
                                key={idx}
                                src={img}
                                alt={item.nameSnapshot || ''}
                                className="w-12 h-12 rounded-md object-cover shrink-0"
                              />
                            ) : null;
                          })}
                          {(order.items?.length || 0) > 4 && (
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>

                        {order.orderStatus === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancellingOrder === order._id}
                            className="text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-60"
                          >
                            {cancellingOrder === order._id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Orders pagination */}
                    {ordersPagination && ordersPagination.pages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <button
                          onClick={() => fetchOrders(ordersPage - 1)}
                          disabled={ordersPage <= 1}
                          className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-muted-foreground">
                          Page {ordersPage} of {ordersPagination.pages}
                        </span>
                        <button
                          onClick={() => fetchOrders(ordersPage + 1)}
                          disabled={ordersPage >= ordersPagination.pages}
                          className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">My Addresses</h2>
                  <button
                    onClick={() => setIsAddAddressOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No saved addresses</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`border rounded-lg p-4 ${
                          addr.isDefault ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {addr.label || 'Address'}
                              </span>
                              {addr.isDefault && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {addr.street}, {addr.city}
                              {addr.state ? `, ${addr.state}` : ''}, {addr.postalCode}
                            </p>
                            {addr.country && (
                              <p className="text-sm text-muted-foreground">{addr.country}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefault(addr._id)}
                                className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(addr._id)}
                              className="text-xs px-3 py-1.5 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="bg-card rounded-lg border border-border shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">My Wishlist</h2>

              {wishlistLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !wishlist?.products?.length ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Your wishlist is empty</p>
                  <Link
                    to="/shop"
                    className="inline-flex mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {wishlist.products.map((product) => {
                    const img =
                      product.primaryImage?.secureUrl || product.primaryImage?.url || null;
                    return (
                      <div
                        key={product._id}
                        className="border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                      >
                        {/* Product Image */}
                        <Link to={`/product/${product._id}`} className="block">
                          <div className="h-40 bg-muted relative overflow-hidden">
                            {img ? (
                              <img
                                src={img}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="p-4 flex-1 flex flex-col">
                          <Link
                            to={`/product/${product._id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-sm leading-snug"
                          >
                            {product.name}
                          </Link>
                          <p className="text-primary font-bold mt-1.5">
                            ₦{Number(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                            <Link
                              to={`/product/${product._id}`}
                              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                            >
                              View Product →
                            </Link>
                            <button
                              onClick={() => removeFromWishlist(product._id)}
                              aria-label="Remove from wishlist"
                              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="bg-card rounded-lg border border-border shadow-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Change Password</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    clearPasswordError('currentPassword');
                  }}
                  className={`w-full h-10 px-3 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    passwordErrors.currentPassword ? 'border-destructive' : 'border-border'
                  }`}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearPasswordError('newPassword');
                  }}
                  className={`w-full h-10 px-3 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    passwordErrors.newPassword ? 'border-destructive' : 'border-border'
                  }`}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearPasswordError('confirmPassword');
                  }}
                  className={`w-full h-10 px-3 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    passwordErrors.confirmPassword ? 'border-destructive' : 'border-border'
                  }`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary-dark transition-colors"
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Deactivate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Deactivate Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Are you absolutely sure?"
          description="This will deactivate your account."
        >
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivateAccount}
              disabled={deletingAccount}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              {deletingAccount ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </div>
        </Modal>

        {/* Add Address Modal */}
        <Modal
          isOpen={isAddAddressOpen}
          onClose={() => setIsAddAddressOpen(false)}
          title="Add New Address"
        >
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Label</label>
              <select
                value={addressForm.label}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Street *</label>
              <input
                value={addressForm.street}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="Street address"
                className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">City *</label>
                <input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">State</label>
                <input
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="Lagos"
                  className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Postal Code *</label>
                <input
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))
                  }
                  placeholder="100001"
                  className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Country</label>
                <input
                  value={addressForm.country}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Set as default address</span>
            </label>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setIsAddAddressOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                disabled={addingAddress}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {addingAddress ? 'Adding...' : 'Add Address'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Profile;
