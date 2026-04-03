import { useState, useEffect } from 'react';
import {
  Loader,
  RefreshCw,
  Search,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './components/Modal';
import {
  getAllUsersAdminService,
  updateUserStatusService,
  updateUserRoleService,
  deleteUserAdminService,
} from '../../services/adminService';

const USERS_PER_PAGE = 10;

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_STYLES = {
  admin: 'bg-primary/10 text-primary border border-primary/20',
  customer: 'bg-muted text-muted-foreground border border-border',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

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
    } catch {
      toast.error('Failed to load users');
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
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === actionUser._id ? { ...u, isActive: newStatus } : u)),
        );
        setIsStatusOpen(false);
      } else {
        toast.error(data?.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
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
        toast.success(`Role changed to ${newRole}`);
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
        toast.success('User deleted');
        setUsers((prev) => prev.filter((u) => u._id !== actionUser._id));
        const newTotal = totalUsers - 1;
        setTotalUsers(newTotal);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / USERS_PER_PAGE));
        setTotalPages(newTotalPages);
        if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalUsers.toLocaleString()} registered users
          </p>
        </div>
        <button
          onClick={() => fetchUsers(currentPage, search)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
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
            placeholder="Search by name or email…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
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
            className="px-3 h-9 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <UsersIcon className="h-10 w-10 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No users match your search' : 'No users found'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                      Joined
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/20 transition-colors">
                      {/* User cell */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.fullName}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(user.fullName || user.email)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {user.fullName || '—'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[user.role] || ROLE_STYLES.customer}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive !== false ? 'text-green-600' : 'text-destructive'}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${user.isActive !== false ? 'bg-green-500' : 'bg-destructive'}`}
                          />
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setActionUser(user);
                              setIsRoleOpen(true);
                            }}
                            title={`Change role (currently ${user.role})`}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setActionUser(user);
                              setIsStatusOpen(true);
                            }}
                            title={user.isActive !== false ? 'Deactivate user' : 'Activate user'}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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
                            className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {totalUsers > 0
                  ? `Showing ${startIndex + 1}–${Math.min(startIndex + USERS_PER_PAGE, totalUsers)} of ${totalUsers}`
                  : 'No users'}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Toggle Role Modal */}
      <Modal
        isOpen={isRoleOpen}
        onClose={() => setIsRoleOpen(false)}
        title="Change User Role"
        description={`Change ${actionUser?.fullName || actionUser?.email || 'user'}'s role from ${actionUser?.role} to ${actionUser?.role === 'admin' ? 'customer' : 'admin'}?`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsRoleOpen(false)}
            className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleToggleRole}
            disabled={actionLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {actionLoading ? 'Updating…' : 'Confirm'}
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
            className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              actionUser?.isActive !== false
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {actionLoading
              ? 'Processing…'
              : actionUser?.isActive !== false
                ? 'Deactivate'
                : 'Activate'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete User"
        description={`Permanently delete ${actionUser?.fullName || 'this user'}? This cannot be undone.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={actionLoading}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
          >
            {actionLoading ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
