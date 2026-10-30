import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function clearStoredSession() {
  localStorage.removeItem('workflow_user_role');
  localStorage.removeItem('workflow_access_token');
  localStorage.removeItem('workflow_user');
}

export async function apiFetch(input, init = {}) {
  const requestUrl = typeof input === 'string' ? input : input.url;
  const isLoginRequest = new URL(requestUrl, window.location.origin).pathname.endsWith('/auth/login');
  const token = isLoginRequest ? null : localStorage.getItem('workflow_access_token');
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && token) {
    clearStoredSession();
    window.dispatchEvent(new CustomEvent('workflow:unauthorized'));
  }
  return response;
}

export const DEMO_USERS = {
  EMPLOYEE: {
    user: { id: "usr_ahmed", email: "ahmed@company.com", role: "EMPLOYEE", first_name: "Ahmed", last_name: "Ben Ali", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    employee_id: "EMP-00124"
  },
  MANAGER: {
    user: { id: "usr_sarah", email: "sarah@company.com", role: "MANAGER", first_name: "Sarah", last_name: "Martin", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
    employee_id: "EMP-00101"
  },
  HR: {
    user: { id: "usr_marie", email: "marie@company.com", role: "HR", first_name: "Marie", last_name: "Laurent", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
    employee_id: "EMP-00100"
  }
};

function readStoredSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('workflow_access_token');
  const role = localStorage.getItem('workflow_user_role');
  if (!token || !role || !DEMO_USERS[role]) {
    clearStoredSession();
    return null;
  }
  try {
    const encoded = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!encoded) throw new Error('Jeton mal formé');
    const claims = JSON.parse(atob(encoded));
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now() + 15000 || String(claims.role).toUpperCase() !== role) {
      throw new Error('Session expirée ou invalide');
    }
    const user = JSON.parse(localStorage.getItem('workflow_user') || 'null') || DEMO_USERS[role].user;
    return { token, role, user };
  } catch {
    clearStoredSession();
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [storedSession] = useState(readStoredSession);
  const [accessToken, setAccessToken] = useState(() => storedSession?.token || null);
  const [currentRole, setCurrentRole] = useState(() => storedSession?.role || null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(storedSession));
  const [currentUser, setCurrentUser] = useState(() => storedSession?.user || null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [isKioskOpen, setIsKioskOpen] = useState(false);

  const refreshEmployeeData = async (empId, role) => {
    const roleKey = role || currentRole;
    if (!roleKey) return;
    const idToFetch = empId || currentUser?.employee_id || DEMO_USERS[roleKey]?.employee_id;
    if (!idToFetch) {
      setCurrentEmployee(null);
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/employees/${idToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentEmployee(data);
      } else {
        setCurrentEmployee(null);
      }
    } catch (e) {
      console.warn("API fetch employee error", e);
      setCurrentEmployee(null);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`${API_URL}/notifications?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.warn("API fetch notifications error", e);
    }
  };

  const login = (roleKey, token, user) => {
    if (['EMPLOYEE', 'MANAGER', 'HR'].includes(roleKey) && token) {
      localStorage.setItem('workflow_access_token', token);
      localStorage.setItem('workflow_user_role', roleKey);
      localStorage.setItem('workflow_user', JSON.stringify(user || DEMO_USERS[roleKey]?.user || null));
      setAccessToken(token);
      setCurrentRole(roleKey);
      setCurrentUser(user || DEMO_USERS[roleKey]?.user || null);
      setIsAuthenticated(true);
      refreshEmployeeData(user?.employee_id || DEMO_USERS[roleKey]?.employee_id, roleKey);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearStoredSession();
    setAccessToken(null);
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUser(null);
    setCurrentEmployee(null);
  };

  const switchRole = (roleKey, token, user) => login(roleKey, token, user);

  useEffect(() => {
    if (isAuthenticated) {
      refreshEmployeeData();
      fetchNotifications();
    }
  }, [currentRole, isAuthenticated]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('workflow:unauthorized', onUnauthorized);
    return () => window.removeEventListener('workflow:unauthorized', onUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      currentRole,
      currentUser,
      accessToken,
      currentEmployee,
      refreshEmployeeData,
      switchRole,
      notifications,
      fetchNotifications,
      isKioskOpen,
      setIsKioskOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
