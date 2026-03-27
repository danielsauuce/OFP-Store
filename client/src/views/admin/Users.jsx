import { useState, useEffect } from 'react';
import { Loader, RefreshCw, Search, Shield, Ban, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from './components/Avatar';
import StatusBadge from './components/StatusBadge';
import Pagination from './components/Pagination';
import Modal from './components/Modal';
import {
  getAllUsersAdminService,
  updateUserStatusService,
  updateUserRoleService,
  deleteUserAdminService,
} from '../../services/adminService';

const USERS_PER_PAGE = 8;

const roleStyles = {
  admin: 'bg-primary/20 text-primary',
  customer: 'bg-muted text-muted-foreground',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modals
  const [actionUser, setActionUser] = useState(null);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers(currentPage, search);
  }, [currentPage, search]);

  const fetchUsers = async (page, searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: USERS_PER_PAGE };
      if (searchTerm) params.search = searchTerm;

      const data = await getAllUsersAdminService(params);
      if (data?.success) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalUsers(data.pagination?.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const newStatus = !actionUser.isActive;
      const data = await updateUserStatusService(actionUser._id, newStatus);
      if (data?.success) {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        setUsers((prev) =>
          prev.map((u) => (u._id === actionUser._id ? { ...u, isActive: newStatus } : u)),
        );
        setIsStatusOpen(false);
      } else {
        toast.error(data?.message || 'Failed to update user status');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const newRole = actionUser.role === 'admin' ? 'customer' : 'admin';
      const data = await updateUserRoleService(actionUser._id, newRole);
      if (data?.success) {
        toast.success(`User role changed to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === actionUser._id ? { ...u, role: newRole } : u)),
        );
        setIsRoleOpen(false);
      } else {
        toast.error(data?.message || 'Failed to update role');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const data = await deleteUserAdminService(actionUser._id);
      if (data?.success) {
        toast.success('User deleted successfully');
        setUsers((prev) => prev.filter((u) => u._id !== actionUser._id));
        const newTotal = totalUsers - 1;
        setTotalUsers(newTotal);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / USERS_PER_PAGE));
        setTotalPages(newTotalPages);
        // If current page is now beyond total pages, go to last page
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
        setIsDeleteOpen(false);
      } else {
        toast.error(data?.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const startIndex = (currentPage - 1) * USERS_PER_PAGE;

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage registered users and their roles ({totalUsers} total)
          </p>
        </div>
        <button
          onClick={() => fetchUsers(currentPage, search)}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Pagination Info */}
      <p className="text-sm text-muted-foreground">
        {totalUsers > 0
          ? `Showing ${Math.min(startIndex + 1, totalUsers)}–${Math.min(startIndex + USERS_PER_PAGE, totalUsers)} of ${totalUsers} users`
          : 'No users to display'}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No users found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-card p-6 rounded-lg shadow-card border border-border hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-center gap-6">
                <Avatar name={user.fullName || user.email || 'U'} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg text-foreground">
                      {user.fullName || 'No name'}
                    </h3>
                    <StatusBadge status={user.role} statusStyles={roleStyles} />
                    {user.isActive === false && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">Email: </span>{user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActionUser(user);
                      setIsRoleOpen(true);
                    }}
                    title="Toggle role"
                    className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setActionUser(user);
                      setIsStatusOpen(true);
                    }}
                    title={user.isActive !== false ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    {user.isActive !== false ? (
                      <Ban className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActionUser(user);
                      setIsDeleteOpen(true);
                    }}
                    title="Delete user"
                    disabled={actionLoading}
                    className="p-2 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Toggle Role Modal */}
      <Modal
        isOpen={isRoleOpen}
        onClose={() => setIsRoleOpen(false)}
        title="Change User Role"
        description={`Change ${actionUser?.fullName || 'user'}'s role from ${actionUser?.role} to ${actionUser?.role === 'admin' ? 'customer' : 'admin'}?`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsRoleOpen(false)}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleToggleRole}
            disabled={actionLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {actionLoading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </Modal>

      {/* Toggle Status Modal */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={actionUser?.isActive !== false ? 'Deactivate User' : 'Activate User'}
        description={`Are you sure you want to ${actionUser?.isActive !== false ? 'deactivate' : 'activate'} ${actionUser?.fullName || 'this user'}?`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsStatusOpen(false)}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-60 ${
              actionUser?.isActive !== false
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {actionLoading
              ? 'Processing...'
              : actionUser?.isActive !== false
                ? 'Deactivate'
                : 'Activate'}
          </button>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete User"
        description={`Permanently delete ${actionUser?.fullName || 'this user'}? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={actionLoading}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
          >
            {actionLoading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
