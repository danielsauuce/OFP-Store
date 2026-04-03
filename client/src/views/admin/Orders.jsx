import { useState, useEffect } from 'react';
import { Eye, Loader, RefreshCw, ShoppingBag, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './components/Modal';
import {
  getAllOrdersAdminService,
  updateOrderStatusAdminService,
} from '../../services/adminService';

const ORDERS_PER_PAGE = 10;

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  delivered: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders(currentPage, search);
  }, [currentPage, search]);

  const fetchOrders = async (page, searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: ORDERS_PER_PAGE };
      if (searchTerm) params.search = searchTerm;
      const data = await getAllOrdersAdminService(params);
      if (data?.success) {
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalOrders(data.pagination?.total || 0);
      }
    } catch {
      toast.error('Failed to load orders');
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

  const openView = (order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const openStatusUpdate = (order) => {
    setStatusOrder(order);
    setNewStatus(order.orderStatus);
    setStatusNote('');
    setIsStatusOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!statusOrder || !newStatus) return;
    setUpdatingStatus(true);
    try {
      const data = await updateOrderStatusAdminService(statusOrder._id, newStatus, statusNote);
      if (data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o._id === statusOrder._id ? { ...o, orderStatus: newStatus } : o)),
        );
        setIsStatusOpen(false);
      } else {
        toast.error(data?.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalOrders.toLocaleString()} total orders
          </p>
        </div>
        <button
          onClick={() => fetchOrders(currentPage, search)}
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
            placeholder="Search by order number or customer…"
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No orders match your search' : 'No orders yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      Items
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                      Date
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Total
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-semibold text-foreground text-xs">
                          #{order.orderNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-foreground font-medium truncate max-w-[140px]">
                          {order.user?.fullName || order.user?.email || 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={order.orderStatus} />
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-muted-foreground text-xs">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                        £{order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openView(order)}
                            title="View order details"
                            className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openStatusUpdate(order)}
                            title="Update status"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <ChevronDown className="h-3 w-3" />
                            Status
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
                {totalOrders > 0
                  ? `Showing ${startIndex + 1}–${Math.min(startIndex + ORDERS_PER_PAGE, totalOrders)} of ${totalOrders}`
                  : 'No orders'}
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

      {/* View Order Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Order #${selectedOrder?.orderNumber || ''}`}
        maxWidth="max-w-lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusPill status={selectedOrder.orderStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Customer</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedOrder.user?.fullName || selectedOrder.user?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Payment</p>
                <p className="text-sm text-foreground capitalize">
                  {selectedOrder.paymentMethod || 'N/A'}
                </p>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Shipping Address</p>
                <p className="text-sm text-foreground">
                  {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                  {selectedOrder.shippingAddress.state
                    ? `, ${selectedOrder.shippingAddress.state}`
                    : ''}
                  , {selectedOrder.shippingAddress.postalCode}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Items ({selectedOrder.items?.length || 0})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    {item.imageSnapshot && (
                      <img
                        src={item.imageSnapshot}
                        alt={item.nameSnapshot}
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.nameSnapshot || item.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground shrink-0">
                      £{(item.priceSnapshot * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                £{selectedOrder.total?.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={`Update Order #${statusOrder?.orderNumber || ''}`}
        description="Change the fulfilment status for this order"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={2}
              placeholder="Add a note about this update…"
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setIsStatusOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {updatingStatus ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Orders;
