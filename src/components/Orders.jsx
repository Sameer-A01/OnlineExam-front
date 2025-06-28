// src/components/Orders.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const {user} = useAuth();

  // Fetch orders for the user
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/order/${user.userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
            },
          });
          if (response.data.success) {
            setOrders(response.data.orders);
          }
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []); // Refetch if userId changes

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        { user.role ==="admin" ? "Orders" : "My Orders" }
    </h1>

      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">S NO</th>
              {
                user.role === "admin" && (
                  <>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Address</th>
                  </>
                )
              }
              <th className="p-2 text-left">Product Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Total Price</th>
              <th className="p-2 text-left">Order Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id} className="border-t">
                <td className="p-2">{index + 1}</td>
                {user.role === "admin" && (
                  <>
                  <td className="p-2">{order.user.name}</td>
                  <td className="p-2">{order.user.address}</td>
                  </>
                )}
                <td className="p-2">{order.product.name}</td>
                <td className="p-2">{order.product.category.name}</td>
                <td className="p-2">{order.quantity}</td>
                <td className="p-2">${order.totalPrice.toFixed(2)}</td>
                <td className="p-2">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && !loading && (
          <p className="text-center p-4 text-gray-500">No orders found</p>
        )}
      </div>
    </div>
  );
};

export default Orders;