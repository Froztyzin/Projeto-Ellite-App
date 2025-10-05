import { FaTachometerAlt, FaFileInvoiceDollar, FaUser, FaBell } from 'react-icons/fa';

export const menuItems = [
    { to: "/portal/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { to: "/portal/invoices", icon: FaFileInvoiceDollar, label: "Faturas" },
    { to: "/portal/notifications", icon: FaBell, label: "Notificações" },
    { to: "/portal/profile", icon: FaUser, label: "Meu Perfil" },
];
