import React, { useState, useEffect } from "react";

import {
  Search,
  Mail,
  Calendar,
  User,
  Trash2,
  Phone,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import userService from "../services/userService";


/* 🇮🇳 Indian phone validation */
const isValidIndianPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
  try {
    const res = await userService.list();
    setUsers(res.data.data || []);
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await userService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("User deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error.response?.data?.message ||
          "Unable to delete user"
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(q) ||
      user.lastName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q) ||
      (user.phone && user.phone.includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">
          Total: {users.length}
        </span>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search name, email, phone or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg border shadow-sm p-6"
          >
            {/* Avatar + Name */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-1" />
                  {user.email}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span
                  className={`${
                    user.phone && isValidIndianPhone(user.phone)
                      ? "text-gray-900"
                      : "text-red-600"
                  }`}
                >
                  {user.phone || "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Role</span>
                <span
                  className={`font-medium ${
                    user.role === "Admin"
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`font-medium ${
                    user.isActive
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Joined</span>
                <span>
                  {new Date(user.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-4 pt-4 border-t">
              <button
                onClick={() => handleDelete(user.id)}
                className="text-red-600 hover:text-red-800"
                title="Delete user"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No users found
          </p>
        </div>
      )}
    </div>
  );
};

export default Users;
