import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Edit, Trash2, Check, X, Users, Key as KeyIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  userCount: number;
  isSystem: boolean; // Cannot be deleted if true
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
}

// Mock data for demonstration
const mockPermissions: Permission[] = [
  { id: 'p1', name: 'incidents:read', resource: 'incidents', action: 'read', description: 'View incidents' },
  { id: 'p2', name: 'incidents:create', resource: 'incidents', action: 'create', description: 'Create incidents' },
  { id: 'p3', name: 'incidents:update', resource: 'incidents', action: 'update', description: 'Update incidents' },
  { id: 'p4', name: 'incidents:delete', resource: 'incidents', action: 'delete', description: 'Delete incidents' },
  { id: 'p5', name: 'tasks:read', resource: 'tasks', action: 'read', description: 'View tasks' },
  { id: 'p6', name: 'tasks:create', resource: 'tasks', action: 'create', description: 'Create tasks' },
  { id: 'p7', name: 'assets:read', resource: 'assets', action: 'read', description: 'View assets' },
  { id: 'p8', name: 'assets:update', resource: 'assets', action: 'update', description: 'Update assets' },
  { id: 'p9', name: 'reports:generate', resource: 'reports', action: 'create', description: 'Generate reports' },
  { id: 'p10', name: 'sops:execute', resource: 'sops', action: 'execute', description: 'Execute SOPs' },
  { id: 'p11', name: 'admin:manage', resource: 'admin', action: 'update', description: 'Manage admin settings' },
];

const mockRoles: Role[] = [
  {
    id: 'r1',
    name: 'Admin',
    description: 'Full system access',
    permissions: mockPermissions.map((p) => p.id),
    userCount: 3,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'r2',
    name: 'Engineer',
    description: 'Standard engineering access',
    permissions: ['p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
    userCount: 15,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'r3',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['p1', 'p5', 'p7'],
    userCount: 8,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'r1',
    roleName: 'Admin',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
  },
  {
    id: 'u2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'r2',
    roleName: 'Engineer',
    status: 'active',
    lastLogin: '2024-01-15T09:20:00Z',
  },
];

const RBACManagement = () => {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'roles' | 'users' | 'permissions'>('roles');
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });

  // Queries (using mock data for now)
  const { data: roles = mockRoles } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: async () => mockRoles, // Replace with API call
  });

  const { data: permissions = mockPermissions } = useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: async () => mockPermissions, // Replace with API call
  });

  const { data: users = mockUsers } = useQuery({
    queryKey: ['rbac-users'],
    queryFn: async () => mockUsers, // Replace with API call
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (role: Partial<Role>) => {
      // API call would go here
      toast.success(`Role "${role.name}" created successfully`);
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      setIsCreateRoleOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Role> }) => {
      // API call would go here
      toast.success('Role updated successfully');
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      setEditingRole(null);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      // API call would go here
      toast.success('Role deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
    },
  });

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    createRoleMutation.mutate(newRole);
  };

  const handleUpdateRole = (role: Role) => {
    updateRoleMutation.mutate({ id: role.id, updates: role });
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.isSystem) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (role && role.userCount > 0) {
      toast.error(`Cannot delete role with ${role.userCount} assigned users. Reassign users first.`);
      return;
    }
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const togglePermission = (permissionId: string, rolePermissions: string[]) => {
    if (rolePermissions.includes(permissionId)) {
      return rolePermissions.filter((p) => p !== permissionId);
    } else {
      return [...rolePermissions, permissionId];
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            Role-Based Access Control
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage roles, permissions, and user access</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('roles')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'roles'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveView('users')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'users'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveView('permissions')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'permissions'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Permissions ({permissions.length})
        </button>
      </div>

      {/* Roles View */}
      {activeView === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create Role
            </button>
          </div>

          {/* Create Role Form */}
          {isCreateRoleOpen && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., Security Analyst"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Brief description of the role"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto bg-white">
                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                      <div key={resource} className="mb-4 last:mb-0">
                        <h4 className="font-medium text-gray-900 mb-2 capitalize">{resource}</h4>
                        <div className="space-y-2 ml-4">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newRole.permissions.includes(perm.id)}
                                onChange={() =>
                                  setNewRole({
                                    ...newRole,
                                    permissions: togglePermission(perm.id, newRole.permissions),
                                  })
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{perm.name}</span>
                              <span className="text-xs text-gray-500">({perm.description})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setIsCreateRoleOpen(false);
                      setNewRole({ name: '', description: '', permissions: [] });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Role
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Roles List */}
          <div className="grid gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Users size={14} />
                        {role.userCount} users
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <KeyIcon size={14} />
                        {role.permissions.length} permissions
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingRole(role)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit role"
                    >
                      <Edit size={18} />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete role"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Role Form */}
                {editingRole?.id === role.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Edit Permissions</h4>
                    <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto bg-gray-50">
                      {Object.entries(permissionsByResource).map(([resource, perms]) => (
                        <div key={resource} className="mb-4 last:mb-0">
                          <h5 className="font-medium text-gray-900 mb-2 capitalize">{resource}</h5>
                          <div className="space-y-2 ml-4">
                            {perms.map((perm) => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingRole.permissions.includes(perm.id)}
                                  onChange={() =>
                                    setEditingRole({
                                      ...editingRole,
                                      permissions: togglePermission(perm.id, editingRole.permissions),
                                    })
                                  }
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{perm.name}</span>
                                <span className="text-xs text-gray-500">({perm.description})</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                      <button
                        onClick={() => setEditingRole(null)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateRole(editingRole)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users View */}
      {activeView === 'users' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString() +
                        ' ' +
                        new Date(user.lastLogin).toLocaleTimeString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Suspend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Permissions View */}
      {activeView === 'permissions' && (
        <div className="space-y-4">
          {Object.entries(permissionsByResource).map(([resource, perms]) => (
            <div key={resource} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize flex items-center gap-2">
                <KeyIcon size={20} className="text-blue-600" />
                {resource}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {perms.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        perm.action === 'read'
                          ? 'bg-blue-100 text-blue-800'
                          : perm.action === 'create'
                          ? 'bg-green-100 text-green-800'
                          : perm.action === 'update'
                          ? 'bg-yellow-100 text-yellow-800'
                          : perm.action === 'delete'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {perm.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RBACManagement;
