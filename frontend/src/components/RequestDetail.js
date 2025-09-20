import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  Users, 
  Calendar, 
  MapPin, 
  DollarSign,
  Clock,
  MessageCircle,
  Send,
  FileText,
  Star,
  Phone,
  Mail,
  Plane,
  Car,
  Train,
  Bus,
  Hotel,
  Utensils
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RequestDetail = ({ request, userRole, onBack, onCreateQuotation }) => {
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load conversations for this request
    // For now, using mock data
    setConversations([
      {
        id: 1,
        user: 'John Customer',
        role: 'customer',
        message: 'Hi, I would like to add that we prefer beachfront accommodation if possible.',
        timestamp: new Date('2024-09-19T10:30:00'),
        avatar: 'JC'
      },
      {
        id: 2,
        user: 'Sarah Sales',
        role: 'salesperson',
        message: 'Thank you for the additional details! I will make sure to include beachfront options in your quotation. Expect to hear back from us within 24 hours.',
        timestamp: new Date('2024-09-19T11:15:00'),
        avatar: 'SS'
      }
    ]);
  }, [request.id]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTransportIcon = (transport) => {
    const icons = {
      flight: Plane,
      car: Car,
      train: Train,
      bus: Bus
    };
    return icons[transport] || Car;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // Mock sending message
      const newConversation = {
        id: conversations.length + 1,
        user: userRole === 'customer' ? request.customer_name : 'Sarah Sales',
        role: userRole,
        message: newMessage,
        timestamp: new Date(),
        avatar: userRole === 'customer' ? 'JC' : 'SS'
      };

      setConversations([...conversations, newConversation]);
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
            <p className="text-gray-600">Request ID: #{request.id.slice(0, 8)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(request.status)}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
          {request.is_flexible_dates && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Flexible Dates
            </Badge>
          )}
          {userRole === 'salesperson' && request.status === 'pending' && (
            <Button 
              onClick={() => onCreateQuotation && onCreateQuotation(request)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Create Quotation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Request Details</TabsTrigger>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              {/* Trip Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span>Trip Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Travelers</p>
                        <p className="text-sm text-gray-600">
                          {request.travelers_count} total ({request.adults} adults, {request.children} children, {request.infants} infants)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Travel Dates</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(request.departure_date), 'MMM dd, yyyy')} - {format(new Date(request.return_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Budget Range</p>
                        <p className="text-sm text-gray-600">
                          ₹{request.budget_min?.toLocaleString()} - ₹{request.budget_max?.toLocaleString()}
                          {request.budget_per_person && ' per person'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Trip Type</p>
                        <p className="text-sm text-gray-600 capitalize">{request.travel_type}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              <Card>
                <CardHeader>
                  <CardTitle>Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {request.destinations.map((destination, index) => (
                      <Badge key={index} variant="outline" className="text-orange-600 border-orange-300">
                        {destination}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Travel Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Transport Modes</h4>
                    <div className="flex space-x-4">
                      {request.transport_modes.map((transport, index) => {
                        const Icon = getTransportIcon(transport);
                        return (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="capitalize">{transport}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Hotel className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Accommodation</p>
                        <div className="flex items-center space-x-1">
                          {[...Array(request.accommodation_star)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">{request.accommodation_star} Star</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Utensils className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Meals</p>
                        <p className="text-sm text-gray-600 capitalize">{request.meal_preference}</p>
                      </div>
                    </div>
                  </div>
                  
                  {request.special_requirements && (
                    <div>
                      <h4 className="font-medium mb-2">Special Requirements</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {request.special_requirements}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conversation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-orange-500" />
                    <span>Conversation Thread</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {conversations.map((conv) => (
                      <div key={conv.id} className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`text-xs ${conv.role === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {conv.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{conv.user}</span>
                            <span className="text-xs text-gray-500">{format(conv.timestamp, 'MMM dd, HH:mm')}</span>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {conv.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || loading}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span>Request Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Request Created</p>
                        <p className="text-sm text-gray-600">{format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                    
                    {request.assigned_salesperson && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Assigned to Salesperson</p>
                          <p className="text-sm text-gray-600">{format(new Date(request.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-500">Quotation Generation</p>
                        <p className="text-sm text-gray-400">Pending</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {userRole !== 'customer' && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {request.customer_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.customer_name}</p>
                    <p className="text-sm text-gray-600">Customer</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>customer@demo.com</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>+91-9876543210</span>
                  </div>
                </div>
                
                <Separator />
                
                {userRole === 'salesperson' && (
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userRole === 'salesperson' && request.status === 'pending' && (
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => onCreateQuotation && onCreateQuotation(request)}
                >
                  Create Quotation
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                Export Details
              </Button>
              
              <Button variant="outline" className="w-full">
                Set Follow-up
              </Button>
              
              {userRole !== 'customer' && (
                <Button variant="outline" className="w-full">
                  Assign to Team
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Request Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Request Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Days until departure</span>
                <span className="font-medium">
                  {Math.ceil((new Date(request.departure_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trip duration</span>
                <span className="font-medium">
                  {Math.ceil((new Date(request.return_date) - new Date(request.departure_date)) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget per person</span>
                <span className="font-medium">
                  ₹{request.budget_per_person 
                    ? `${request.budget_min?.toLocaleString()} - ${request.budget_max?.toLocaleString()}`
                    : `${Math.floor((request.budget_min || 0) / request.travelers_count).toLocaleString()} - ${Math.floor((request.budget_max || 0) / request.travelers_count).toLocaleString()}`
                  }
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Request age</span>
                <span className="font-medium">
                  {Math.floor((new Date() - new Date(request.created_at)) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;