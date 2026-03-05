import { useState } from 'react';
import Avatar from '../admin/components/Avatar';
import StatusBadge from '../admin/components/StatusBadge';
import Pagination from '../admin/components/Pagination';
import { users, roleStyles } from '../../data/UsersData';

const USERS_PER_PAGE = 6;

const Users = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + USERS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Users Management</h1>
        <p className="text-muted-foreground mt-2">Manage registered users and their roles</p>
      </div>

      {/* Pagination Info */}
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}–{Math.min(startIndex + USERS_PER_PAGE, users.length)} of{' '}
        {users.length} users
      </p>

      <div className="grid gap-4">
        {paginatedUsers.map((user, index) => (
          <div
            key={`${user.id}-${startIndex + index}`}
            className="bg-card p-6 rounded-lg shadow-card border border-border hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center gap-6">
              <Avatar name={user.name} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-foreground">{user.name}</h3>
                  <StatusBadge status={user.role} statusStyles={roleStyles} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{user.orders} orders</span>
                  <span>&bull;</span>
                  <span>Joined {new Date(user.joined).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Users;
