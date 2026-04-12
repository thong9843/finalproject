import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
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
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children }) => {
    const token = Cookies.get('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const AppConfig = ({ children }) => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#DA251D',
                    borderRadius: 6,
                },
            }}
        >
            {children}
        </ConfigProvider>
    );
};

const App = () => {
    return (
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
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppConfig>
    );
};

export default App;
