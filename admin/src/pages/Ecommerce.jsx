import { useState, useEffect } from 'react';
import api from '../lib/api';

export function Ecommerce() {
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStore, setNewStore] = useState({
    platform: 'shopify',
    store_url: '',
    access_token: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storesRes, ordersRes] = await Promise.all([
        api.get('/admin/ecommerce/stores'),
        api.get('/admin/ecommerce/orders')
      ]);
      setStores(storesRes.data.data || []);
      setOrders(ordersRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch ecommerce data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/ecommerce/stores', newStore);
      setShowAddModal(false);
      setNewStore({ platform: 'shopify', store_url: '', access_token: '' });
      fetchData();
    } catch (err) {
      alert('Failed to connect store');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">E-Commerce Integration</h1>
          <p className="text-sm dark:text-text-muted text-gray-500">Manage your connected stores and orders</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Connect Store
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold dark:text-text-primary text-gray-900">Connected Stores</h2>
          {stores.length === 0 ? (
            <div className="glass-card p-6 text-center dark:text-text-muted">No stores connected.</div>
          ) : (
            stores.map(store => (
              <div key={store.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold dark:text-text-primary text-gray-900 uppercase text-xs tracking-wider">{store.platform}</p>
                  <p className="text-sm dark:text-text-muted text-gray-600 truncate">{store.store_url}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold dark:text-text-primary text-gray-900">Recent Orders</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-navy-700 border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-navy-700 divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center dark:text-text-muted">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center dark:text-text-muted">No orders found.</td></tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="dark:hover:bg-navy-800/50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium dark:text-text-primary">#{order.external_order_id}</td>
                      <td className="px-6 py-4 dark:text-text-muted">{order.customer_name}</td>
                      <td className="px-6 py-4 dark:text-text-primary">{order.total_amount} {order.currency}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-8">
            <h3 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-6">Connect New Store</h3>
            <form onSubmit={handleAddStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Platform</label>
                <select
                  value={newStore.platform}
                  onChange={(e) => setNewStore({ ...newStore, platform: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary outline-none"
                >
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="magento">Magento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Store URL</label>
                <input
                  type="url"
                  required
                  value={newStore.store_url}
                  onChange={(e) => setNewStore({ ...newStore, store_url: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary outline-none"
                  placeholder="https://mystore.myshopify.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">API Key / Access Token</label>
                <input
                  type="password"
                  value={newStore.access_token}
                  onChange={(e) => setNewStore({ ...newStore, access_token: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary outline-none"
                  placeholder="shpat_xxxxxxxxxxxxxxxx"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl font-semibold">Connect</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary rounded-xl font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
