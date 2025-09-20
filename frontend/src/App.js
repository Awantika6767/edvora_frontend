import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import new components
import RequestForm from './components/RequestForm';
import RequestsList from './components/RequestsList';
import RequestDetail from './components/RequestDetail';
import QuotationBuilder from './components/QuotationBuilder';
import QuotationsList from './components/QuotationsList';
import RateStudio from './components/RateStudio';
import OperationsManagement from './components/OperationsManagement';
import AdminConsole from './components/AdminConsole';

// Import Shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Separator } from './components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { 
  Bell, 
  Search, 
  Menu, 
  Home, 
  FileText, 
  Calculator, 
  Calendar, 
  Settings, 
  Users, 
  BarChart3,
  PlusCircle,
  User
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      
      // Force navigation to dashboard
      window.location.href = '/dashboard';
      return true;
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const demoUsers = [
    { email: 'customer@demo.com', role: 'Customer', name: 'John Customer' },
    { email: 'sales@demo.com', role: 'Salesperson', name: 'Sarah Sales' },
    { email: 'manager@demo.com', role: 'Sales Manager', name: 'Mike Manager' },
    { email: 'ops@demo.com', role: 'Operations', name: 'Olivia Operations' },
    { email: 'admin@demo.com', role: 'Admin', name: 'Alex Admin' }
  ];

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Trip<span className="text-orange-500">Flow</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            High-velocity B2B travel quotation system for modern travel businesses
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">Instant quotation generation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">AI-powered rate optimization</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">Role-based workflow management</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your TripFlow account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 text-center">Demo Accounts</p>
              <div className="grid grid-cols-1 gap-2">
                {demoUsers.map((user, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin(user.email)}
                    className="justify-start h-10 text-left border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">({user.role})</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Navigation Configuration
const getNavigationItems = (role) => {
  const baseItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' }
  ];

  switch (role) {
    case 'customer':
      return [
        ...baseItems,
        { icon: FileText, label: 'My Requests', path: '/requests' },
        { icon: Calculator, label: 'Quotations', path: '/quotations' },
        { icon: Calendar, label: 'My Bookings', path: '/bookings' }
      ];
    case 'salesperson':
      return [
        ...baseItems,
        { icon: FileText, label: 'Requests', path: '/requests' },
        { icon: Calculator, label: 'Quotations', path: '/quotations' },
        { icon: BarChart3, label: 'Rate Studio', path: '/rate-studio' }
      ];
    case 'sales_manager':
      return [
        ...baseItems,
        { icon: FileText, label: 'Requests', path: '/requests' },
        { icon: Calculator, label: 'Quotations', path: '/quotations' },
        { icon: Users, label: 'Team', path: '/team' },
        { icon: BarChart3, label: 'Rate Studio', path: '/rate-studio' },
        { icon: BarChart3, label: 'Reports', path: '/reports' }
      ];
    case 'operations':
      return [
        ...baseItems,
        { icon: Calendar, label: 'Bookings', path: '/bookings' },
        { icon: FileText, label: 'Operations', path: '/operations' },
        { icon: BarChart3, label: 'Reports', path: '/reports' }
      ];
    case 'admin':
      return [
        ...baseItems,
        { icon: Users, label: 'Users', path: '/users' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: BarChart3, label: 'Audit Logs', path: '/audit' }
      ];
    default:
      return baseItems;
  }
};

// Main Layout Component
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navigationItems = getNavigationItems(user?.role);

  const Sidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'w-full' : 'w-64'} h-full bg-white border-r border-gray-200 flex flex-col`}>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Trip<span className="text-orange-500">Flow</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-6 space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className="w-full justify-start h-11 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => window.location.href = item.path}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Button>
        ))}
      </nav>
      
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-orange-100 text-orange-700">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={logout}
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              <div className="relative hidden md:block">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search requests, quotations..." 
                  className="pl-10 w-80"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
              
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => window.location.href = '/requests/new'}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Quick Create
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Components for each role
const CustomerDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <Button 
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => window.location.href = '/requests/new'}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.active_requests || 0}</div>
            <p className="text-xs text-muted-foreground">Pending quotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.total_bookings || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calculator className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pending_payments || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest travel requests and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Corporate Retreat - Manali</h4>
                <p className="text-sm text-gray-600">Quotation received and under review</p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">New Quote</Badge>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Family Trip to Goa</h4>
                <p className="text-sm text-gray-600">Booking confirmed, payment pending</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Confirmed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SalespersonDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Requests</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.assigned_requests || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting quotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotations</CardTitle>
            <Calculator className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_quotations || 0}</div>
            <p className="text-xs text-muted-foreground">Draft status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.conversion_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avg_response_time || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Target: 4 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Priority Requests</CardTitle>
            <CardDescription>High-priority requests needing immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Family Trip to Goa</h4>
                  <p className="text-sm text-gray-600">SLA: 2 hours remaining</p>
                </div>
                <Badge variant="destructive">Urgent</Badge>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Corporate Event - Mumbai</h4>
                  <p className="text-sm text-gray-600">High budget, flexible dates</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">High Value</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Optimization Suggestions</CardTitle>
            <CardDescription>AI-powered pricing recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Pricing Opportunity</h4>
                <p className="text-sm text-green-600">Corporate Retreat - Manali: Suggested 5% increase based on demand</p>
                <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">Apply Suggestion</Button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Market Intelligence</h4>
                <p className="text-sm text-blue-600">Competitor rates 15% higher for similar Goa packages</p>
                <Button size="sm" variant="outline" className="mt-2">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Enhanced dashboard components for other roles
const ManagerDashboard = () => {
  const [stats, setStats] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const [statsRes, approvalsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/approvals/pending`),
        axios.get(`${API}/analytics/conversion-rates`)
      ]);
      
      setStats(statsRes.data);
      setApprovals(approvalsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to load manager dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalDecision = async (approvalId, decision, comment = '') => {
    try {
      await axios.post(`${API}/approvals/${approvalId}/decision`, {
        decision,
        comment
      });
      toast.success(`Approval ${decision} successfully`);
      fetchManagerData(); // Refresh data
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sales Manager Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.href = '/team'}>
            <Users className="w-4 h-4 mr-2" />
            Manage Team
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <BarChart3 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.team_performance || 85.2}%</div>
            <p className="text-xs text-muted-foreground">Above target (+12%)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{approvals.length}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calculator className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{((stats.monthly_revenue || 2500000) / 100000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.team_size || 8}</div>
            <p className="text-xs text-muted-foreground">Active salespeople</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Quotations requiring manager approval</CardDescription>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending approvals</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {approvals.map((approval) => (
                  <div key={approval.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Discount Request</h4>
                        <p className="text-sm text-gray-600">By: {approval.requested_by_name}</p>
                        <p className="text-sm text-gray-600">Discount: {approval.discount_percentage}%</p>
                        <p className="text-sm text-gray-600 mt-1">Reason: {approval.reason}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprovalDecision(approval.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleApprovalDecision(approval.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Team Conversion Rates</CardTitle>
            <CardDescription>Performance by salesperson</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.by_salesperson || {}).map(([name, rate]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                        {name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{width: `${rate * 100}%`}}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12">{(rate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Studio Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Optimization Center</CardTitle>
          <CardDescription>Manage pricing strategies and market intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span>Pricing Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="w-6 h-6" />
              <span>Rate Rules</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span>Competitor Intelligence</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OperationsDashboard = () => {
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/bookings`)
      ]);
      
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      toast.error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCapture = async (bookingId, amount) => {
    try {
      await axios.post(`${API}/payments/capture`, {
        booking_id: bookingId,
        amount: amount,
        payment_method: 'card'
      });
      toast.success('Payment captured successfully');
      fetchOperationsData();
    } catch (error) {
      toast.error('Failed to capture payment');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Call
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Operations KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed_bookings || 47}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calculator className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pending_payments || 12}</div>
            <p className="text-xs text-muted-foreground">Requires follow-up</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
            <FileText className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming_trips || 15}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <User className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.customer_satisfaction || 4.8}</div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
            <CardDescription>Capture payments and process refunds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {bookings.filter(b => b.payment_status !== 'paid').map((booking) => (
                <div key={booking.id} className="p-4 bg-yellow-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{booking.customer_name}</h4>
                      <p className="text-sm text-gray-600">Amount: ₹{booking.total_amount}</p>
                      <Badge variant="secondary" className="mt-1">
                        {booking.payment_status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        onClick={() => handlePaymentCapture(booking.id, booking.total_amount)}
                      >
                        Capture Payment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Pipeline</CardTitle>
            <CardDescription>Track booking confirmations and logistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      booking.booking_status === 'confirmed' ? 'bg-green-500' : 
                      booking.booking_status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-gray-600">{booking.travel_date}</p>
                    </div>
                  </div>
                  <Badge variant={booking.booking_status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.booking_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Operations Workflow</CardTitle>
          <CardDescription>Manage suppliers, vouchers, and customer communication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span>Supplier Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <FileText className="w-6 h-6" />
              <span>Generate Vouchers</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-lg">📞</span>
              <span>Customer Calls</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span>Trip Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const statsRes = await axios.get(`${API}/dashboard/stats`);
      setStats(statsRes.data);
      
      // Mock system health data
      setSystemHealth({
        uptime: "99.9%",
        response_time: "245ms",
        error_rate: "0.1%",
        active_users: 156
      });
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_users || 156}</div>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total_requests || 248}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <Calculator className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.total_quotations || 189}</div>
            <p className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{systemHealth.uptime}</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Real-time system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm text-green-600">{systemHealth.response_time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-green-600">{systemHealth.error_rate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Users</span>
                <span className="text-sm text-blue-600">{systemHealth.active_users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Health</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>Latest user actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>New user registration: john@company.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Quotation approved: #Q-2024-001</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Payment processed: ₹125,000</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>System backup completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Administration Tools</CardTitle>
          <CardDescription>Manage system configuration and user access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span>User Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="w-6 h-6" />
              <span>System Configuration</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <FileText className="w-6 h-6" />
              <span>Audit Logs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span>Analytics & Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-lg">🔒</span>
              <span>Security Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-lg">💾</span>
              <span>Backup & Recovery</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'salesperson':
        return <SalespersonDashboard />;
      case 'sales_manager':
        return <ManagerDashboard />;
      case 'operations':
        return <OperationsDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return getDashboardComponent();
};

// Request Pages
const RequestsPage = () => {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const handleCreateNew = () => {
    window.location.href = '/requests/new';
  };
  
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };
  
  if (selectedRequest) {
    return (
      <RequestDetail
        request={selectedRequest}
        userRole={user?.role}
        onBack={() => setSelectedRequest(null)}
        onCreateQuotation={(request) => {
          window.location.href = `/quotations/builder/${request.id}`;
        }}
      />
    );
  }
  
  return (
    <RequestsList
      userRole={user?.role}
      onCreateNew={handleCreateNew}
      onViewRequest={handleViewRequest}
    />
  );
};

const NewRequestPage = () => {
  const handleSubmit = (requestData) => {
    console.log('Request submitted:', requestData);
    window.location.href = '/requests';
  };
  
  const handleCancel = () => {
    window.location.href = '/requests';
  };
  
  return (
    <RequestForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

const RequestDetailPage = () => {
  const { user } = useAuth();
  // This would normally get the request ID from URL params
  // For now, redirecting to requests list
  useEffect(() => {
    window.location.href = '/requests';
  }, []);
  
  return <div>Loading...</div>;
};

// Quotation Pages
const QuotationsPage = () => {
  const { user } = useAuth();
  
  const handleCreateNew = () => {
    window.location.href = '/quotations/new';
  };
  
  const handleViewQuotation = (quotation) => {
    console.log('View quotation:', quotation);
    toast.success('Quotation detail view coming soon!');
  };
  
  const handleEditQuotation = (quotation) => {
    console.log('Edit quotation:', quotation);
    toast.success('Edit quotation coming soon!');
  };
  
  return (
    <QuotationsList
      userRole={user?.role}
      onCreateNew={handleCreateNew}
      onViewQuotation={handleViewQuotation}
      onEditQuotation={handleEditQuotation}
    />
  );
};

const NewQuotationPage = () => {
  // For now, redirect to requests to create quotation from request
  useEffect(() => {
    toast.info('Please create quotation from a travel request');
    window.location.href = '/requests';
  }, []);
  
  return <div>Redirecting...</div>;
};

const QuotationBuilderPage = () => {
  const [request, setRequest] = useState(null);
  
  useEffect(() => {
    // Mock request data for now
    setRequest({
      id: '1',
      title: 'Family Trip to Goa',
      customer_name: 'John Customer',
      travelers_count: 4,
      adults: 2,
      children: 2,
      infants: 0,
      departure_date: '2024-12-15',
      return_date: '2024-12-22',
      is_flexible_dates: false,
      budget_min: 80000,
      budget_max: 120000,
      budget_per_person: false,
      destinations: ['Goa', 'Beach'],
      transport_modes: ['flight', 'car'],
      accommodation_star: 4,
      meal_preference: 'vegetarian',
      travel_type: 'leisure'
    });
  }, []);
  
  const handleBack = () => {
    window.location.href = '/requests';
  };
  
  const handleSave = (quotationData) => {
    console.log('Quotation saved:', quotationData);
    window.location.href = '/quotations';
  };
  
  if (!request) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <QuotationBuilder
      request={request}
      onBack={handleBack}
      onSave={handleSave}
    />
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </div>
  );
}

// Separate Routes Component
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <RequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/new"
              element={
                <ProtectedRoute>
                  <NewRequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <ProtectedRoute>
                  <RequestDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute>
                  <QuotationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/new"
              element={
                <ProtectedRoute>
                  <NewQuotationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/builder/:requestId"
              element={
                <ProtectedRoute>
                  <QuotationBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <OperationsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations"
              element={
                <ProtectedRoute>
                  <OperationsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rate-studio"
              element={
                <ProtectedRoute>
                  <RateStudio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AdminConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AdminConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Team Management</h1>
                    <p className="text-gray-600">Team management interface coming soon</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
                    <p className="text-gray-600">Advanced reporting interface coming soon</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AdminConsole />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
  );
};

export default App;