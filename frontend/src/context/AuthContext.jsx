import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setKycStatus(response.data.kyc_status || "not_submitted");
    } catch (error) {
      console.error("Error fetching user:", error);
      // Token might be invalid, clear it
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setKycStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshKycStatus = async () => {
    try {
      const response = await axios.get(`${API}/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(response.data.status);
      return response.data.status;
    } catch (error) {
      if (error.response?.status === 404) {
        setKycStatus("not_submitted");
        return "not_submitted";
      }
      return kycStatus;
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setUser(userData);
    setKycStatus(userData.kyc_status || "not_submitted");
    return userData;
  };

  const register = async (name, email, password, phone) => {
    const response = await axios.post(`${API}/auth/register`, { 
      name, 
      email, 
      password,
      phone: phone || null
    });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setUser(userData);
    setKycStatus("not_submitted");
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setKycStatus(null);
  };

  const getAuthHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      getAuthHeader,
      isAuthenticated: !!user,
      kycStatus,
      refreshKycStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
