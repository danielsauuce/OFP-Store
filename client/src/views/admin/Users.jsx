import Avatar from '../admin/components/Avatar';
import StatusBadge from '../admin/components/StatusBadge';
import { users, roleStyles } from '../../data/UsersData';

const Users = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Users Management</h1>
        <p className="text-muted-foreground mt-2">Manage registered users and their roles</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
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
    </div>
  );
};

export default Users;
