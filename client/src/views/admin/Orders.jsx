import { useState, useEffect } from 'react';
import { Eye, Loader, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from './components/StatusBadge';
import Pagination from './components/Pagination';
import Modal from './components/Modal';
import {
  getAllOrdersAdminService,
  updateOrderStatusAdminService,
} from '../../services/adminService';

const ORDERS_PER_PAGE = 8;

const statusStyles = {
  delivered: 'bg-accent/20 text-accent',
  pending: 'bg-gold/20 text-gold',
  processing: 'bg-primary/20 text-primary',
  shipped: 'bg-accent/20 text-accent',
  cancelled: 'bg-destructive/20 text-destructive',
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // View order modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Status update
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page) => {
    setLoading(true);
    try {
      const data = await getAllOrdersAdminService({
        page,
        limit: ORDERS_PER_PAGE,
      });
      if (data?.success) {
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalOrders(data.pagination?.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load orders');
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
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
        toast.success(`Order status updated to ${newStatus}`);
        // Update local state
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage customer orders</p>
        </div>
        <button
          onClick={() => fetchOrders(currentPage)}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Pagination Info */}
      <p className="text-sm text-muted-foreground">
        {totalOrders > 0
          ? `Showing ${startIndex + 1}–${Math.min(startIndex + ORDERS_PER_PAGE, totalOrders)} of ${totalOrders} orders`
          : 'No orders to display'}
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No orders found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-card p-6 rounded-lg shadow-card border border-border hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-foreground">#{order.orderNumber}</h3>
                    <StatusBadge status={order.orderStatus} statusStyles={statusStyles} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer: {order.user?.fullName || order.user?.email || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}{' '}
                    &bull; {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right space-y-3">
                  <p className="text-2xl font-bold text-primary">
                    £{order.total?.toFixed(2) || '0.00'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openView(order)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => openStatusUpdate(order)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border text-foreground font-medium hover:bg-muted transition-colors"
                    >
                      Update Status
                    </button>
                  </div>
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
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <StatusBadge status={selectedOrder.orderStatus} statusStyles={statusStyles} />
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer</h4>
              <p className="text-foreground">
                {selectedOrder.user?.fullName || selectedOrder.user?.email || 'N/A'}
              </p>
            </div>

            {selectedOrder.shippingAddress && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Shipping Address</h4>
                <p className="text-foreground text-sm">
                  {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                  {selectedOrder.shippingAddress.state
                    ? `, ${selectedOrder.shippingAddress.state}`
                    : ''}
                  , {selectedOrder.shippingAddress.postalCode}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {item.nameSnapshot || item.product?.name || 'Product'}
                      </p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">
                      £{(item.priceSnapshot * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3 flex justify-between items-center">
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
        description="Change the order status"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Note (optional)</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={2}
              placeholder="Add a note about this status change..."
              className="w-full mt-1 px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsStatusOpen(false)}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Orders;
