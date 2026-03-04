import { useState } from 'react';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../admin/components/StatusBadge';
import Pagination from '../admin/components/Pagination';
import { orders, statusStyles } from '../../data/OrdersData';

const ORDERS_PER_PAGE = 6;

const Orders = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ORDERS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Orders Management</h1>
        <p className="text-muted-foreground mt-2">Track and manage customer orders</p>
      </div>

      {/* Pagination Info */}
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}–{Math.min(startIndex + ORDERS_PER_PAGE, orders.length)} of{' '}
        {orders.length} orders
      </p>

      <div className="grid gap-4">
        {paginatedOrders.map((order, index) => (
          <div
            key={`${order.id}-${startIndex + index}`}
            className="bg-card p-6 rounded-lg shadow-card border border-border hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg text-foreground">{order.id}</h3>
                  <StatusBadge status={order.status} statusStyles={statusStyles} />
                </div>
                <p className="text-sm text-muted-foreground">Customer: {order.customer}</p>
                <p className="text-sm text-muted-foreground">
                  {order.items} item{order.items > 1 ? 's' : ''} &bull; {order.date}
                </p>
              </div>

              <div className="text-right space-y-3">
                <p className="text-2xl font-bold text-primary">£{order.total.toFixed(2)}</p>
                <button
                  onClick={() => toast('Order details coming soon!')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
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

export default Orders;
