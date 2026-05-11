import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Members    from './pages/Members';
import Attendance from './pages/Attendance';
import Payments   from './pages/Payments';
import Expenses   from './pages/Expenses';
import Plans      from './pages/Plans';
import Trainers   from './pages/Trainers';

function PrivateRoute({ children }) {
  const user = sessionStorage.getItem('ft_user');
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/members" element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
        <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
        <Route path="/plans" element={<PrivateRoute><Plans /></PrivateRoute>} />
        <Route path="/trainers" element={<PrivateRoute><Trainers /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
