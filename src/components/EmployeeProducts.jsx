// src/components/Products.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/api";

const EmployeeProducts = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [filterProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderData, setOrderData] = useState({
    productId: "",
    quantity: 1,
    total: 0,
    stock: 0,
    price: 0,
  });
  const [loading, setLoading] = useState(false);

  // Dummy user ID (in real app, get this from auth context)
  const userId = "dummy-user-id";

  // Fetch products when category changes
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setCategories(response.data.categories);
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFilterProducts = (e) => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const handleChangeCategory = (e) => {
    setFilteredProducts(
      products.filter((product) => product.category._id === e.target.value)
    );
    setSelectedCategory(e.target.value);
  };

  const handleOrderClick = (product) => {
    setOrderData({
      productId: product._id,
      quantity: 1,
      total: product.price,
      price: product.price,
      stock: product.stock,
    });
    setIsModalOpen(true);
  };

  const IncreaseQuantity = (e) => {
    if (e.target.value > orderData.stock) {
      alert("Not enough stock");
      // e.target.value = orderData.stock;
    } else {
      setOrderData((prev) => ({
        ...prev,
        quantity: parseInt(e.target.value),
        total: parseInt(e.target.value) * parseInt(orderData.price),
      }));
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post("/order/add", orderData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      console.log(response.data);
      if (response.data.success) {
        setIsModalOpen(false);
        setOrderData({ productId: "", quantity: 1, total: 0 });
        fetchProducts();
        alert("order placed");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {/* Category Dropdown and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <select
          value={selectedCategory}
          onChange={handleChangeCategory}
          className="w-full sm:w-1/3 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          onChange={handleFilterProducts}
          placeholder="Search products..."
          className="w-full sm:w-1/3 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Stock</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filterProducts.map((product, index) => (
              <tr key={product._id} className="border-t">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{product.name}</td>
                <td className="p-2">{product.category.name}</td>
                <td className="p-2">${product.price}</td>
                <td className="p-2">{product.stock}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleOrderClick(product)}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 disabled:bg-green-300"
                    disabled={loading || product.stock === 0}
                  >
                    Order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filterProducts.length === 0 && !loading && (
          <p className="text-center p-4 text-gray-500">No products found</p>
        )}
      </div>

      {/* Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Place Order</h2>
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderData.quantity}
                  onChange={IncreaseQuantity}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <strong>Total: {orderData.total}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-green-300"
                  disabled={loading}
                >
                  Place Order
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProducts;
