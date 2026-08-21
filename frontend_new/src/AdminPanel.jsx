import { useEffect, useState } from 'react';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';


import GeoAuthorizationDialog from './GeoAuthDialog';
import './AdminPanel.css';

const API_URL = 'http://localhost:5092/api/admin';

function AdminPanel({ token, onBack, onLogout }) {
    const [page, setPage] = useState('dashboard');

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);

    const [userDialog, setUserDialog] = useState(false);
    const [roleDialog, setRoleDialog] = useState(false);

    const [userAuthDialog, setUserAuthDialog] = useState(false);
    const [rolePermissionDialog, setRolePermissionDialog] = useState(false);

    const [geoDialog, setGeoDialog] = useState(false);
    const [geoEntityType, setGeoEntityType] = useState(null);
    const [geoEntity, setGeoEntity] = useState(null);

    const [editingUser, setEditingUser] = useState(null);
    const [editingRole, setEditingRole] = useState(null);

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userUsername, setUserUsername] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userActive, setUserActive] = useState(true);

    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);

    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [directPermissionIds, setDirectPermissionIds] = useState([]);
    const [rolePermissionIds, setRolePermissionIds] = useState([]);

    const [selectedRolePermissionIds, setSelectedRolePermissionIds] =
        useState([]);

    const fetchWithAuth = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        });

        if (response.status === 401) {
            if (onLogout) {
                onLogout();
            }

            throw new Error('Oturum süresi doldu.');
        }

        return response;
    };


    // =========================================
    // LOAD
    // =========================================

    const loadUsers = async () => {
        const response = await fetchWithAuth(
            `${API_URL}/users`
        );

        if (!response.ok) {
            throw new Error(
                'Kullanıcılar yüklenemedi.'
            );
        }

        const data = await response.json();
        setUsers(data);
    };


    const loadRoles = async () => {
        const response = await fetchWithAuth(
            `${API_URL}/roles`
        );

        if (!response.ok) {
            throw new Error(
                'Roller yüklenemedi.'
            );
        }

        const data = await response.json();
        setRoles(data);
    };


    const loadPermissions = async () => {
        const response = await fetchWithAuth(
            `${API_URL}/permissions`
        );

        if (!response.ok) {
            throw new Error(
                'Yetkiler yüklenemedi.'
            );
        }

        const data = await response.json();
        setPermissions(data);
    };


    useEffect(() => {
        const load = async () => {
            try {
                await Promise.all([
                    loadUsers(),
                    loadRoles(),
                    loadPermissions()
                ]);
            }
            catch (error) {
                alert(error.message);
            }
        };

        load();
    }, []);


    // =========================================
    // USER CRUD
    // =========================================

    const openAddUser = () => {
        setEditingUser(null);
        setUserName('');
        setUserEmail('');
        setUserUsername('');
        setUserPassword('');
        setUserActive(true);

        setUserDialog(true);
    };


    const openEditUser = (user) => {
        setEditingUser(user);

        setUserName(user.name);
        setUserEmail(user.email);
        setUserUsername(user.username || '');
        setUserPassword('');
        setUserActive(user.isActive);

        setUserDialog(true);
    };


    const saveUser = async () => {
        if (!userName.trim()) {
            alert('Kullanıcı adı boş olamaz.');
            return;
        }

        if (!userEmail.trim()) {
            alert('E-posta boş olamaz.');
            return;
        }

        if (!userUsername.trim()) {
            alert('Giriş kullanıcı adı boş olamaz.');
            return;
        }

        if (!editingUser && !userPassword.trim()) {
            alert('Yeni kullanıcı için şifre boş olamaz.');
            return;
        }

        try {
            const url = editingUser
                ? `${API_URL}/users/${editingUser.id}`
                : `${API_URL}/users`;

            const method = editingUser
                ? 'PUT'
                : 'POST';

            const response = await fetchWithAuth(
                url,
                {
                    method,

                    body: JSON.stringify({
                        name: userName.trim(),
                        email: userEmail.trim(),
                        username: userUsername.trim(),
                        password: userPassword,
                        isActive: userActive
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Kullanıcı kaydedilemedi.'
                );
            }

            setUserDialog(false);

            await loadUsers();
        }
        catch (error) {
            alert(error.message);
        }
    };


    const deleteUser = async (user) => {
        const approved = window.confirm(
            `${user.name} kullanıcısını silmek istediğine emin misin?`
        );

        if (!approved) {
            return;
        }

        try {
            const response = await fetchWithAuth(
                `${API_URL}/users/${user.id}`,
                {
                    method: 'DELETE'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Kullanıcı silinemedi.'
                );
            }

            await loadUsers();
        }
        catch (error) {
            alert(error.message);
        }
    };


    // =========================================
    // ROLE CRUD
    // =========================================

    const openAddRole = () => {
        setEditingRole(null);

        setRoleName('');
        setRoleDescription('');

        setRoleDialog(true);
    };


    const openEditRole = (role) => {
        setEditingRole(role);

        setRoleName(role.name);
        setRoleDescription(role.description || '');

        setRoleDialog(true);
    };


    const saveRole = async () => {
        if (!roleName.trim()) {
            alert('Rol adı boş olamaz.');
            return;
        }

        try {
            const url = editingRole
                ? `${API_URL}/roles/${editingRole.id}`
                : `${API_URL}/roles`;

            const method = editingRole
                ? 'PUT'
                : 'POST';

            const response = await fetchWithAuth(
                url,
                {
                    method,

                    body: JSON.stringify({
                        name: roleName.trim(),
                        description:
                            roleDescription.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Rol kaydedilemedi.'
                );
            }

            setRoleDialog(false);

            await loadRoles();
        }
        catch (error) {
            alert(error.message);
        }
    };


    const deleteRole = async (role) => {
        const approved = window.confirm(
            `${role.name} rolünü silmek istediğine emin misin?`
        );

        if (!approved) {
            return;
        }

        try {
            const response = await fetchWithAuth(
                `${API_URL}/roles/${role.id}`,
                {
                    method: 'DELETE'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Rol silinemedi.'
                );
            }

            await loadRoles();
        }
        catch (error) {
            alert(error.message);
        }
    };


    // =========================================
    // ROLE PERMISSIONS
    // =========================================

    const openRolePermissions = async (role) => {
        try {
            setSelectedRole(role);

            const response = await fetchWithAuth(
                `${API_URL}/roles/${role.id}/permissions`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Rol yetkileri alınamadı.'
                );
            }

            setSelectedRolePermissionIds(
                data.permissionIds || []
            );

            setRolePermissionDialog(true);
        }
        catch (error) {
            alert(error.message);
        }
    };


    const toggleRolePermission = (permissionId) => {
        setSelectedRolePermissionIds(previous => {
            if (previous.includes(permissionId)) {
                return previous.filter(
                    id => id !== permissionId
                );
            }

            return [
                ...previous,
                permissionId
            ];
        });
    };


    const saveRolePermissions = async () => {
        if (!selectedRole) {
            return;
        }

        try {
            const response = await fetchWithAuth(
                `${API_URL}/roles/${selectedRole.id}/permissions`,
                {
                    method: 'PUT',

                    body: JSON.stringify({
                        permissionIds:
                            selectedRolePermissionIds
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Rol yetkileri kaydedilemedi.'
                );
            }

            setRolePermissionDialog(false);

            alert('Rol yetkileri kaydedildi.');
        }
        catch (error) {
            alert(error.message);
        }
    };


    // =========================================
    // USER AUTHORIZATION
    // =========================================

    const getPermissionsForRoles = async (
        roleIds
    ) => {
        const allPermissionIds =
            new Set();

        for (const roleId of roleIds) {
            const response =
                await fetchWithAuth(
                    `${API_URL}/roles/${roleId}/permissions`
                );

            if (!response.ok) {
                continue;
            }

            const data =
                await response.json();

            for (
                const permissionId
                of data.permissionIds || []
            ) {
                allPermissionIds.add(
                    permissionId
                );
            }
        }

        return Array.from(
            allPermissionIds
        );
    };


    const openUserAuthorization =
        async (user) => {
            try {
                setSelectedUser(user);

                const response =
                    await fetchWithAuth(
                        `${API_URL}/users/${user.id}/authorization`
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        'Kullanıcı yetkileri alınamadı.'
                    );
                }

                const currentRoleIds =
                    data.roleIds || [];

                setSelectedRoleIds(
                    currentRoleIds
                );

                setDirectPermissionIds(
                    data.directPermissionIds || []
                );

                const calculatedRolePermissions =
                    await getPermissionsForRoles(
                        currentRoleIds
                    );

                setRolePermissionIds(
                    calculatedRolePermissions
                );

                setUserAuthDialog(true);
            }
            catch (error) {
                alert(error.message);
            }
        };


    const toggleUserRole =
        async (roleId) => {
            let newRoleIds;

            if (
                selectedRoleIds.includes(
                    roleId
                )
            ) {
                newRoleIds =
                    selectedRoleIds.filter(
                        id => id !== roleId
                    );
            }
            else {
                newRoleIds = [
                    ...selectedRoleIds,
                    roleId
                ];
            }

            setSelectedRoleIds(
                newRoleIds
            );

            const newRolePermissionIds =
                await getPermissionsForRoles(
                    newRoleIds
                );

            setRolePermissionIds(
                newRolePermissionIds
            );

            setDirectPermissionIds(
                previous =>
                    previous.filter(
                        id =>
                            !newRolePermissionIds
                                .includes(id)
                    )
            );
        };


    const toggleDirectPermission =
        (permissionId) => {
            if (
                rolePermissionIds.includes(
                    permissionId
                )
            ) {
                return;
            }

            setDirectPermissionIds(
                previous => {
                    if (
                        previous.includes(
                            permissionId
                        )
                    ) {
                        return previous.filter(
                            id =>
                                id !==
                                permissionId
                        );
                    }

                    return [
                        ...previous,
                        permissionId
                    ];
                }
            );
        };


    const saveUserAuthorization =
        async () => {
            if (!selectedUser) {
                return;
            }

            try {
                const response =
                    await fetchWithAuth(
                        `${API_URL}/users/${selectedUser.id}/authorization`,
                        {
                            method: 'PUT',

                            body: JSON.stringify({
                                roleIds:
                                    selectedRoleIds,

                                directPermissionIds:
                                    directPermissionIds
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        'Yetkilendirme kaydedilemedi.'
                    );
                }

                setUserAuthDialog(false);

                alert(
                    'Kullanıcı rol ve yetkileri kaydedildi.'
                );
            }
            catch (error) {
                alert(error.message);
            }
        };


    // =========================================
    // GEOGRAPHIC AUTHORIZATION
    // =========================================

    const openUserGeoAuthorization = (user) => {
        setGeoEntityType('user');
        setGeoEntity(user);
        setGeoDialog(true);
    };


    const openRoleGeoAuthorization = (role) => {
        setGeoEntityType('role');
        setGeoEntity(role);
        setGeoDialog(true);
    };


    const closeGeoAuthorization = () => {
        setGeoDialog(false);
        setGeoEntityType(null);
        setGeoEntity(null);
    };


    // =========================================
    // UI
    // =========================================

    return (
        <div className="admin-layout">

            <aside className="admin-sidebar">
                <div className="admin-logo">
                    Admin Paneli
                </div>

                <button
                    className={
                        page === 'dashboard'
                            ? 'admin-nav active'
                            : 'admin-nav'
                    }
                    onClick={() =>
                        setPage('dashboard')
                    }
                >
                    Dashboard
                </button>

                <button
                    className={
                        page === 'users'
                            ? 'admin-nav active'
                            : 'admin-nav'
                    }
                    onClick={() =>
                        setPage('users')
                    }
                >
                    Kullanıcı Listesi
                </button>

                <button
                    className={
                        page === 'roles'
                            ? 'admin-nav active'
                            : 'admin-nav'
                    }
                    onClick={() =>
                        setPage('roles')
                    }
                >
                    Rol Listesi
                </button>

                <div className="admin-sidebar-bottom">

                    {onBack && (
                        <button
                            className="admin-nav"
                            onClick={onBack}
                        >
                            Haritaya Dön
                        </button>
                    )}

                    {onLogout && (
                        <button
                            className="admin-nav logout"
                            onClick={onLogout}
                        >
                            Çıkış Yap
                        </button>
                    )}

                </div>
            </aside>


            <main className="admin-content">

                {page === 'dashboard' && (
                    <>
                        <div className="admin-header">
                            <div>
                                <h1>
                                    Dashboard
                                </h1>

                                <p>
                                    Sistem genel durumunu
                                    hızlıca görüntüle.
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(210px, 1fr))',
                                gap: '18px',
                                marginBottom: '24px'
                            }}
                        >
                            <div
                                className="admin-card"
                                style={{
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '14px'
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            color: '#64748b',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Toplam Kullanıcı
                                    </div>

                                    <div
                                        style={{
                                            fontSize: '32px',
                                            fontWeight: 800,
                                            color: '#0f172a'
                                        }}
                                    >
                                        {users.length}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: '#eff6ff',
                                        color: '#2563eb',
                                        fontSize: '20px'
                                    }}
                                >
                                    <i className="pi pi-users" />
                                </div>
                            </div>

                            <div
                                className="admin-card"
                                style={{
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '14px'
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            color: '#64748b',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Aktif Kullanıcı
                                    </div>

                                    <div
                                        style={{
                                            fontSize: '32px',
                                            fontWeight: 800,
                                            color: '#0f172a'
                                        }}
                                    >
                                        {
                                            users.filter(
                                                user =>
                                                    user.isActive
                                            ).length
                                        }
                                    </div>
                                </div>

                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: '#ecfdf5',
                                        color: '#059669',
                                        fontSize: '20px'
                                    }}
                                >
                                    <i className="pi pi-user-plus" />
                                </div>
                            </div>

                            <div
                                className="admin-card"
                                style={{
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '14px'
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            color: '#64748b',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Toplam Rol
                                    </div>

                                    <div
                                        style={{
                                            fontSize: '32px',
                                            fontWeight: 800,
                                            color: '#0f172a'
                                        }}
                                    >
                                        {roles.length}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: '#f5f3ff',
                                        color: '#7c3aed',
                                        fontSize: '20px'
                                    }}
                                >
                                    <i className="pi pi-id-card" />
                                </div>
                            </div>

                            <div
                                className="admin-card"
                                style={{
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '14px'
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            color: '#64748b',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Toplam Yetki
                                    </div>

                                    <div
                                        style={{
                                            fontSize: '32px',
                                            fontWeight: 800,
                                            color: '#0f172a'
                                        }}
                                    >
                                        {permissions.length}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: '#fff7ed',
                                        color: '#ea580c',
                                        fontSize: '20px'
                                    }}
                                >
                                    <i className="pi pi-shield" />
                                </div>
                            </div>
                        </div>

                        <div
                            className="admin-card"
                            style={{
                                padding: '20px'
                            }}
                        >
                            <h3
                                style={{
                                    marginTop: 0,
                                    marginBottom: '16px'
                                }}
                            >
                                Sistem Özeti
                            </h3>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '12px'
                                }}
                            >
                                <div
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <strong>
                                        Pasif Kullanıcı
                                    </strong>

                                    <div
                                        style={{
                                            marginTop: '6px',
                                            color: '#64748b'
                                        }}
                                    >
                                        {
                                            users.filter(
                                                user =>
                                                    !user.isActive
                                            ).length
                                        } kullanıcı
                                    </div>
                                </div>

                                <div
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <strong>
                                        Rol Yönetimi
                                    </strong>

                                    <div
                                        style={{
                                            marginTop: '6px',
                                            color: '#64748b'
                                        }}
                                    >
                                        {roles.length} aktif rol
                                    </div>
                                </div>

                                <div
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <strong>
                                        Yetkilendirme
                                    </strong>

                                    <div
                                        style={{
                                            marginTop: '6px',
                                            color: '#64748b'
                                        }}
                                    >
                                        {permissions.length} izin tanımlı
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {page === 'users' && (
                    <>
                        <div className="admin-header">
                            <div>
                                <h1>
                                    Kullanıcı Listesi
                                </h1>

                                <p>
                                    Kullanıcıları ve
                                    yetkilerini yönet.
                                </p>
                            </div>

                            <Button
                                label="Kullanıcı Ekle"
                                icon="pi pi-plus"
                                onClick={openAddUser}
                            />
                        </div>


                        <div className="admin-card">

                            <table className="admin-table">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Ad</th>
                                        <th>Kullanıcı Adı</th>
                                        <th>E-posta</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {users.map(user => (
                                        <tr key={user.id}>

                                            <td>
                                                {user.id}
                                            </td>

                                            <td>
                                                {user.name}
                                            </td>

                                            <td>
                                                {user.username || '-'}
                                            </td>

                                            <td>
                                                {user.email}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        user.isActive
                                                            ? 'status active'
                                                            : 'status passive'
                                                    }
                                                >
                                                    {user.isActive
                                                        ? 'Aktif'
                                                        : 'Pasif'}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    <Button
                                                        label="Yetkiler"
                                                        size="small"
                                                        outlined
                                                        onClick={() =>
                                                            openUserAuthorization(
                                                                user
                                                            )
                                                        }
                                                    />

                                                    <Button
                                                        label="Coğrafi Yetki"
                                                        icon="pi pi-map-marker"
                                                        size="small"
                                                        outlined
                                                        severity="info"
                                                        onClick={() =>
                                                            openUserGeoAuthorization(
                                                                user
                                                            )
                                                        }
                                                    />

                                                    <Button
                                                        icon="pi pi-pencil"
                                                        size="small"
                                                        severity="secondary"
                                                        onClick={() =>
                                                            openEditUser(
                                                                user
                                                            )
                                                        }
                                                    />

                                                    <Button
                                                        icon="pi pi-trash"
                                                        size="small"
                                                        severity="danger"
                                                        onClick={() =>
                                                            deleteUser(
                                                                user
                                                            )
                                                        }
                                                    />

                                                </div>
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    </>
                )}


                {page === 'roles' && (
                    <>
                        <div className="admin-header">

                            <div>
                                <h1>
                                    Rol Listesi
                                </h1>

                                <p>
                                    Rolleri ve role ait
                                    yetkileri yönet.
                                </p>
                            </div>

                            <Button
                                label="Rol Ekle"
                                icon="pi pi-plus"
                                onClick={openAddRole}
                            />

                        </div>


                        <div className="admin-card">

                            <table className="admin-table">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Rol</th>
                                        <th>Açıklama</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {roles.map(role => (
                                        <tr key={role.id}>

                                            <td>
                                                {role.id}
                                            </td>

                                            <td>
                                                {role.name}
                                            </td>

                                            <td>
                                                {role.description}
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    <Button
                                                        label="Yetkiler"
                                                        size="small"
                                                        outlined
                                                        onClick={() =>
                                                            openRolePermissions(
                                                                role
                                                            )
                                                        }
                                                    />

                                                    <Button
                                                        label="Coğrafi Yetki"
                                                        icon="pi pi-map-marker"
                                                        size="small"
                                                        outlined
                                                        severity="info"
                                                        onClick={() =>
                                                            openRoleGeoAuthorization(
                                                                role
                                                            )
                                                        }
                                                    />

                                                    <Button
                                                        icon="pi pi-pencil"
                                                        size="small"
                                                        severity="secondary"
                                                        onClick={() =>
                                                            openEditRole(
                                                                role
                                                            )
                                                        }
                                                    />

                                                    <Button
                                                        icon="pi pi-trash"
                                                        size="small"
                                                        severity="danger"
                                                        onClick={() =>
                                                            deleteRole(
                                                                role
                                                            )
                                                        }
                                                    />

                                                </div>
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    </>
                )}

            </main>


            {/* USER ADD / UPDATE */}

            <Dialog
                header={
                    editingUser
                        ? 'Kullanıcı Güncelle'
                        : 'Kullanıcı Ekle'
                }
                visible={userDialog}
                style={{ width: '430px' }}
                modal
                onHide={() =>
                    setUserDialog(false)
                }
            >

                <div className="dialog-form">

                    <label>
                        Ad
                    </label>

                    <input
                        value={userName}
                        onChange={e =>
                            setUserName(
                                e.target.value
                            )
                        }
                    />


                    <label>
                        E-posta
                    </label>

                    <input
                        value={userEmail}
                        onChange={e =>
                            setUserEmail(
                                e.target.value
                            )
                        }
                    />


                    <label>
                        Kullanıcı Adı
                    </label>

                    <input
                        value={userUsername}
                        onChange={e =>
                            setUserUsername(
                                e.target.value
                            )
                        }
                        autoComplete="username"
                    />


                    <label>
                        Şifre
                    </label>

                    <input
                        type="password"
                        value={userPassword}
                        onChange={e =>
                            setUserPassword(
                                e.target.value
                            )
                        }
                        placeholder={
                            editingUser
                                ? 'Değiştirmeyeceksen boş bırak'
                                : 'Kullanıcı şifresi'
                        }
                        autoComplete="new-password"
                    />


                    {editingUser && (
                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={userActive}
                                onChange={e =>
                                    setUserActive(
                                        e.target.checked
                                    )
                                }
                            />

                            Aktif kullanıcı
                        </label>
                    )}


                    <Button
                        label="Kaydet"
                        onClick={saveUser}
                    />

                </div>

            </Dialog>


            {/* ROLE ADD / UPDATE */}

            <Dialog
                header={
                    editingRole
                        ? 'Rol Güncelle'
                        : 'Rol Ekle'
                }
                visible={roleDialog}
                style={{ width: '430px' }}
                modal
                onHide={() =>
                    setRoleDialog(false)
                }
            >

                <div className="dialog-form">

                    <label>
                        Rol Adı
                    </label>

                    <input
                        value={roleName}
                        onChange={e =>
                            setRoleName(
                                e.target.value
                            )
                        }
                    />


                    <label>
                        Açıklama
                    </label>

                    <textarea
                        rows="4"
                        value={roleDescription}
                        onChange={e =>
                            setRoleDescription(
                                e.target.value
                            )
                        }
                    />


                    <Button
                        label="Kaydet"
                        onClick={saveRole}
                    />

                </div>

            </Dialog>


            {/* ROLE PERMISSIONS */}

            <Dialog
                header={
                    selectedRole
                        ? `${selectedRole.name} - Yetkiler`
                        : 'Rol Yetkileri'
                }
                visible={rolePermissionDialog}
                style={{ width: '500px' }}
                modal
                onHide={() =>
                    setRolePermissionDialog(false)
                }
            >

                <div className="permission-list">

                    {permissions.map(permission => (
                        <label
                            key={permission.id}
                            className="permission-item"
                        >

                            <input
                                type="checkbox"
                                checked={
                                    selectedRolePermissionIds.includes(
                                        permission.id
                                    )
                                }
                                onChange={() =>
                                    toggleRolePermission(
                                        permission.id
                                    )
                                }
                            />

                            <div>
                                <strong>
                                    {permission.name}
                                </strong>

                                <span>
                                    {permission.description}
                                </span>
                            </div>

                        </label>
                    ))}

                </div>


                <Button
                    label="Yetkileri Kaydet"
                    onClick={saveRolePermissions}
                />

            </Dialog>


            {/* USER AUTHORIZATION */}

            <Dialog
                header={
                    selectedUser
                        ? `${selectedUser.name} - Rol ve Yetkiler`
                        : 'Kullanıcı Yetkilendirme'
                }
                visible={userAuthDialog}
                style={{ width: '600px' }}
                modal
                onHide={() =>
                    setUserAuthDialog(false)
                }
            >

                <h3>Roller</h3>

                <div className="permission-list">

                    {roles.map(role => (
                        <label
                            key={role.id}
                            className="permission-item"
                        >

                            <input
                                type="checkbox"
                                checked={
                                    selectedRoleIds.includes(
                                        role.id
                                    )
                                }
                                onChange={() =>
                                    toggleUserRole(
                                        role.id
                                    )
                                }
                            />

                            <div>
                                <strong>
                                    {role.name}
                                </strong>

                                <span>
                                    {role.description}
                                </span>
                            </div>

                        </label>
                    ))}

                </div>


                <h3>
                    Kullanıcıya Özel Yetkiler
                </h3>

                <div className="permission-list">

                    {permissions.map(permission => {

                        const comesFromRole =
                            rolePermissionIds.includes(
                                permission.id
                            );

                        return (
                            <label
                                key={permission.id}
                                className={
                                    comesFromRole
                                        ? 'permission-item inherited'
                                        : 'permission-item'
                                }
                            >

                                <input
                                    type="checkbox"
                                    disabled={
                                        comesFromRole
                                    }
                                    checked={
                                        comesFromRole ||
                                        directPermissionIds.includes(
                                            permission.id
                                        )
                                    }
                                    onChange={() =>
                                        toggleDirectPermission(
                                            permission.id
                                        )
                                    }
                                />

                                <div>
                                    <strong>
                                        {permission.name}
                                    </strong>

                                    <span>
                                        {comesFromRole
                                            ? 'Rol üzerinden geliyor'
                                            : permission.description}
                                    </span>
                                </div>

                            </label>
                        );
                    })}

                </div>


                <Button
                    label="Rol ve Yetkileri Kaydet"
                    onClick={saveUserAuthorization}
                />

            </Dialog>

            {/* GEOGRAPHIC AUTHORIZATION */}

            <GeoAuthorizationDialog
                visible={geoDialog}
                onHide={closeGeoAuthorization}
                entityType={geoEntityType}
                entityId={geoEntity?.id}
                entityName={geoEntity?.name}
                token={token}
                apiBaseUrl="http://localhost:5092"
            />

        </div>
    );
}

export default AdminPanel;