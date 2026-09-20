import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const API_URL = "http://127.0.0.1:8000/api";

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

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [isKioskOpen, setIsKioskOpen] = useState(false);

  const refreshEmployeeData = async (empId, role) => {
    const roleKey = role || currentRole;
    if (!roleKey) return;
    const idToFetch = empId || DEMO_USERS[roleKey].employee_id;
    try {
      const res = await fetch(`${API_URL}/employees/${idToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentEmployee(data);
      } else {
        // Mock fallback if backend is down
        setCurrentEmployee({
          id: idToFetch,
          first_name: DEMO_USERS[roleKey].user.first_name,
          last_name: DEMO_USERS[roleKey].user.last_name,
          email: DEMO_USERS[roleKey].user.email,
          department_name: "Company Department",
          position: "Staff",
          manager_name: "System Admin",
          leave_balance: 18,
          allocated_leave: 25,
          used_leave: 7
        });
      }
    } catch (e) {
      console.warn("API fetch employee error", e);
      // Mock fallback if backend is down
      setCurrentEmployee({
        id: idToFetch,
        first_name: DEMO_USERS[roleKey].user.first_name,
        last_name: DEMO_USERS[roleKey].user.last_name,
        email: DEMO_USERS[roleKey].user.email,
        department_name: "Company Department",
        position: "Staff",
        manager_name: "System Admin",
        leave_balance: 18,
        allocated_leave: 25,
        used_leave: 7
      });
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/notifications?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.warn("API fetch notifications error", e);
    }
  };

  const login = (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setCurrentRole(roleKey);
      setCurrentUser(DEMO_USERS[roleKey].user);
      setIsAuthenticated(true);
      refreshEmployeeData(DEMO_USERS[roleKey].employee_id, roleKey);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUser(null);
    setCurrentEmployee(null);
  };

  const switchRole = (roleKey) => {
    login(roleKey);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshEmployeeData();
      fetchNotifications();
    }
  }, [currentRole, isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      currentRole,
      currentUser,
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
