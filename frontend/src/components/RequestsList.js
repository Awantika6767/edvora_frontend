import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign,
  Clock,
  Eye,
  MessageCircle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RequestsList = ({ userRole, onCreateNew, onViewRequest }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API}/requests`);
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (request) => {
    const budget = request.budget_max || 0;
    const isUrgent = new Date(request.departure_date) - new Date() < 7 * 24 * 60 * 60 * 1000; // Less than 7 days
    
    if (isUrgent) return 'border-l-red-500';
    if (budget > 200000) return 'border-l-orange-500';
    return 'border-l-gray-300';
  };

  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.destinations.some(dest => dest.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'departure_date':
          return new Date(a.departure_date) - new Date(b.departure_date);
        case 'budget':
          return (b.budget_max || 0) - (a.budget_max || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === 'customer' ? 'My Travel Requests' : 'Travel Requests'}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'customer' 
              ? 'Track your travel request submissions and quotations' 
              : 'Manage and respond to customer travel requests'}
          </p>
        </div>
        
        {(userRole === 'customer' || onCreateNew) && (
          <Button 
            onClick={onCreateNew}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Latest First</SelectItem>
                <SelectItem value="departure_date">Departure Date</SelectItem>
                <SelectItem value="budget">Budget (High to Low)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="h-12">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-500 mb-4">
                {userRole === 'customer' 
                  ? "You haven't created any travel requests yet." 
                  : "No travel requests match your current filters."}
              </p>
              {userRole === 'customer' && (
                <Button onClick={onCreateNew} className="bg-orange-500 hover:bg-orange-600">
                  Create Your First Request
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className={`hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(request)}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      {request.is_flexible_dates && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Flexible
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{request.travelers_count} travelers</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(request.departure_date), 'MMM dd, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{request.destinations.slice(0, 2).join(', ')}{request.destinations.length > 2 && '...'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{request.budget_min?.toLocaleString()} - ₹{request.budget_max?.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          {userRole !== 'customer' && (
                            <>
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                  {request.customer_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{request.customer_name}</span>
                            </>
                          )}
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                        </span>
                        
                        {request.assigned_salesperson && userRole !== 'salesperson' && (
                          <span className="text-green-600">
                            Assigned to Sales
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {userRole === 'salesperson' && request.status === 'pending' && (
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            Create Quote
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewRequest && onViewRequest(request)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">{requests.length}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'quoted').length}</div>
              <div className="text-sm text-gray-600">Quoted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'confirmed').length}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestsList;