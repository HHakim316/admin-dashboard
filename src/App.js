// src/App.js
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DASHBOARD_ACCESS, INVENTORY_ACCESS } from "./constants/roles";
import DashboardCards from "./components/DashboardCards";
import ProductTable from "./components/Products/ProductTable";
import RecycleBin from "./components/Products/RecycleBin";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";
import { Footer } from './components/Footer';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // 👈 Add this

const App = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  // Real-time role sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem("userRole"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthProvider>  {/* 👈 Wrap the Router with this */}
    <Router>
      {userRole && (
        <>
          <Sidebar userRole={userRole} />
         
        </>
      )}
      
      <div className="main-content" style={{ marginLeft: userRole ? "250px" : "0" }}>
        <Routes>
          <Route 
            path="/login" 
            element={!userRole ? <Login setUserRole={setUserRole} /> : <Navigate to="/dashboard" replace />} 
          />

          <Route element={<PrivateRoute allowedRoles={DASHBOARD_ACCESS} />}>
            <Route path="/dashboard" element={<DashboardCards />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={INVENTORY_ACCESS} />}>
            <Route path="/products" element={<ProductTable />} />
            <Route path="/recycle" element={<RecycleBin />} />
          </Route>

          <Route path="*" element={<Navigate to={userRole ? "/dashboard" : "/login"} replace />} />
        </Routes>
        {userRole && <Footer />} {/* Only shows when logged in */}
      </div>
    </Router>
    </AuthProvider>
  );
};

export default App;