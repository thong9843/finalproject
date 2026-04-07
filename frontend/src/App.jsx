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
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children }) => {
    const token = Cookies.get('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const App = () => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#DA251D',
                    borderRadius: 6,
                },
            }}
        >
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
                    </Route>
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
};

export default App;
