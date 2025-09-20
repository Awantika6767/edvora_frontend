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
  FileText, 
  Calendar, 
  DollarSign,
  Clock,
  Eye,
  Send,
  Edit,
  Plus,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationsList = ({ userRole, onCreateNew, onViewQuotation, onEditQuotation }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(`${API}/quotations`);
      setQuotations(response.data);
    } catch (error) {
      toast.error('Failed to load quotations');
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-emerald-100 text-emerald-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Edit,
      sent: Send,
      approved: CheckCircle,
      rejected: XCircle,
      accepted: CheckCircle,
      expired: AlertCircle
    };
    const Icon = icons[status] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getUrgencyIndicator = (quotation) => {
    const validityDate = new Date(quotation.created_at);
    validityDate.setDate(validityDate.getDate() + quotation.validity_days);
    const daysLeft = Math.ceil((validityDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 1) return 'border-l-red-500';
    if (daysLeft <= 3) return 'border-l-orange-500';
    return 'border-l-gray-300';
  };

  const filteredQuotations = quotations
    .filter(quotation => {
      const matchesSearch = quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quotation.salesperson_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'total_price':
          return b.total_price - a.total_price;
        case 'validity':
          return new Date(a.created_at).getTime() + (a.validity_days * 24 * 60 * 60 * 1000) - 
                 (new Date(b.created_at).getTime() + (b.validity_days * 24 * 60 * 60 * 1000));
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotations...</p>
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
            {userRole === 'customer' ? 'My Quotations' : 'Quotations'}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'customer' 
              ? 'Review and manage your travel quotations' 
              : 'Manage customer quotations and pricing'}
          </p>
        </div>
        
        {(userRole === 'salesperson' || userRole === 'sales_manager') && (
          <Button 
            onClick={onCreateNew}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
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
                placeholder="Search quotations..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Latest First</SelectItem>
                <SelectItem value="total_price">Price (High to Low)</SelectItem>
                <SelectItem value="validity">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="h-12">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <div className="space-y-4">
        {filteredQuotations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
              <p className="text-gray-500 mb-4">
                {userRole === 'customer' 
                  ? "You don't have any quotations yet." 
                  : "No quotations match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuotations.map((quotation) => {
            const validityDate = new Date(quotation.created_at);
            validityDate.setDate(validityDate.getDate() + quotation.validity_days);
            const daysLeft = Math.ceil((validityDate - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={quotation.id} className={`hover:shadow-md transition-shadow border-l-4 ${getUrgencyIndicator(quotation)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{quotation.title}</h3>
                        <Badge className={getStatusColor(quotation.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(quotation.status)}
                            <span>{quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}</span>
                          </div>
                        </Badge>
                        {quotation.options?.length > 1 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            {quotation.options.length} Options
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{quotation.total_price?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Valid {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>{quotation.margin || 15}% margin</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(quotation.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      
                      {/* Options Preview */}
                      {quotation.options && quotation.options.length > 0 && (
                        <div className="mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {quotation.options.slice(0, 3).map((option, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <div className="font-medium text-sm">{option.name}</div>
                                <div className="text-xs text-gray-600">{option.duration}</div>
                                <div className="text-orange-600 font-semibold">₹{option.price?.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {userRole !== 'salesperson' && (
                            <span className="flex items-center space-x-1">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                  {quotation.salesperson_name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{quotation.salesperson_name}</span>
                            </span>
                          )}
                          
                          {daysLeft <= 1 && daysLeft > 0 && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Expires Today
                            </Badge>
                          )}
                          
                          {daysLeft <= 0 && (
                            <Badge className="bg-gray-100 text-gray-800 text-xs">
                              Expired
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {userRole === 'salesperson' && quotation.status === 'draft' && (
                            <Button 
                              size="sm" 
                              className="bg-orange-500 hover:bg-orange-600"
                              onClick={() => onEditQuotation && onEditQuotation(quotation)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          
                          {userRole === 'salesperson' && quotation.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Mock send functionality
                                toast.success('Quotation sent to customer');
                              }}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewQuotation && onViewQuotation(quotation)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">{quotations.length}</div>
              <div className="text-sm text-gray-600">Total Quotations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{quotations.filter(q => q.status === 'draft').length}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{quotations.filter(q => q.status === 'sent').length}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{quotations.filter(q => q.status === 'accepted').length}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                ₹{quotations.reduce((sum, q) => sum + (q.total_price || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationsList;