import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme, App as AntApp } from 'antd';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EnterpriseList from './pages/EnterpriseList';
import ActivityList from './pages/ActivityList';
import Settings from './pages/Settings';
import StudentList from './pages/StudentList';
import ReportStudents from './pages/ReportStudents';
import ReportActivities from './pages/ReportActivities';
import Layout from './components/Layout';
import KanbanBoard from './pages/KanbanBoard';
import CalendarView from './pages/CalendarView';
import ActivityTypes from './pages/ActivityTypes';
import MOUList from './pages/MOUList';
import UserList from './pages/UserList';
import DuplicateDataTool from './pages/DuplicateDataTool';
import AiImportTool from './pages/AiImportTool';
import HistoryLog from './pages/HistoryLog';
import Cookies from 'js-cookie';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
    const token = Cookies.get('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const AdminRoute = ({ children }) => {
    const userCookie = Cookies.get('user');
    let user = null;
    try {
        if (userCookie) user = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const AdminOrManagerRoute = ({ children }) => {
    const userCookie = Cookies.get('user');
    let user = null;
    try {
        if (userCookie) user = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    if (!user || (user.role !== 'ADMIN' && user.role !== 'FACULTY_MANAGER')) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const AppConfig = ({ children }) => {
    const { isDark } = useTheme();
    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#DA251D',
                    borderRadius: 6,
                    ...(isDark && {
                        colorBgBase: '#111827', // Tailwind gray-900
                        colorBgContainer: '#1f2937', // Tailwind gray-800
                        colorBgElevated: '#1f2937', // Tailwind gray-800 (Modals, Dropdowns)
                        colorBorder: '#374151', // Tailwind gray-700
                        colorTextBase: '#f3f4f6', // Tailwind gray-100
                        colorTextHeading: '#f3f4f6',
                    })
                },
                components: {
                    ...(isDark && {
                        Modal: {
                            contentBg: '#1f2937',
                            headerBg: '#1f2937',
                            footerBg: '#1f2937',
                            titleColor: '#f3f4f6',
                        }
                    })
                }
            }}
        >
            <AntApp>
                {children}
            </AntApp>
        </ConfigProvider>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <AppConfig>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="kanban" element={<KanbanBoard />} />
                            <Route path="calendar" element={<CalendarView />} />
                            <Route path="enterprises" element={<EnterpriseList />} />
                            <Route path="activities" element={<ActivityList />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="students" element={<StudentList />} />
                            <Route path="reports/students" element={<ReportStudents />} />
                            <Route path="reports/activities" element={<ReportActivities />} />
                            <Route path="activity-types" element={<ActivityTypes />} />
                            <Route path="mous" element={<MOUList />} />
                            <Route path="users" element={<AdminRoute><UserList /></AdminRoute>} />
                            <Route path="duplicates" element={<AdminRoute><DuplicateDataTool /></AdminRoute>} />
                            <Route path="ai-import" element={<AdminRoute><AiImportTool /></AdminRoute>} />
                            <Route path="history" element={<AdminOrManagerRoute><HistoryLog /></AdminOrManagerRoute>} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AppConfig>
        </ThemeProvider>
    );
};

export default App;
