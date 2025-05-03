import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ allowedRoles = [] }) => {
  const userRole = localStorage.getItem("userRole")?.trim().toLowerCase();

  if (!userRole || !allowedRoles.map(role => role.toLowerCase()).includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;

