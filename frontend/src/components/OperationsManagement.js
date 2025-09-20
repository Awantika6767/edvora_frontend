import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  DollarSign,
  Users,
  Plane,
  Hotel,
  Car,
  Utensils,
  Camera,
  RefreshCw,
  Download,
  Upload,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OperationsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [operationNotes, setOperationNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCapture = async (bookingId, amount) => {
    try {
      await axios.post(`${API}/payments/capture`, {
        booking_id: bookingId,
        amount: parseFloat(amount),
        payment_method: paymentMethod
      });
      
      toast.success('Payment captured successfully');
      fetchBookings(); // Refresh data
      setPaymentAmount('');
    } catch (error) {
      toast.error('Failed to capture payment');
    }
  };

  const handleRefund = async (bookingId, amount) => {
    try {
      await axios.post(`${API}/payments/refund`, {
        booking_id: bookingId,
        amount: parseFloat(amount)
      });
      
      toast.success('Refund processed successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };

  const updateBookingStatus = async (bookingId, status, notes = '') => {
    try {
      // Mock API call to update booking status
      const updatedBookings = bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, booking_status: status, operation_notes: notes }
          : booking
      );
      
      setBookings(updatedBookings);
      toast.success('Booking status updated successfully');
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const BookingDetailDialog = ({ booking, isOpen, onClose }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Booking Details - {booking?.customer_name}</span>
          </DialogTitle>
          <DialogDescription>
            Manage booking confirmation, payments, and operations
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="space-y-6">
            {/* Booking Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Travel Date</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">{booking.travel_date}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Total Amount</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">₹{booking.total_amount?.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Status</span>
                  </div>
                  <Badge className={`mt-1 ${getStatusColor(booking.booking_status)}`}>
                    {booking.booking_status}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">Payment Status: </span>
                        <Badge className={getPaymentStatusColor(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Amount Paid</p>
                        <p className="font-semibold">₹{(booking.amount_paid || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {booking.payment_status !== 'paid' && (
                      <div className="flex space-x-3">
                        <Input
                          placeholder="Payment amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          type="number"
                        />
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={() => handlePaymentCapture(booking.id, paymentAmount)}
                          disabled={!paymentAmount}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Capture
                        </Button>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Invoice
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Receipt
                      </Button>
                      {booking.payment_status === 'paid' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRefund(booking.id, booking.total_amount * 0.1)}
                        >
                          Process Refund
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suppliers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Confirmations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { type: 'Hotel', name: 'Grand Beach Resort', status: 'confirmed', contact: '+91-9876543210' },
                      { type: 'Transport', name: 'Premium Travels', status: 'pending', contact: '+91-9876543211' },
                      { type: 'Activities', name: 'Adventure Tours Goa', status: 'confirmed', contact: '+91-9876543212' }
                    ].map((supplier, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            supplier.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-gray-600">{supplier.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            {supplier.contact}
                          </Button>
                          <Badge className={supplier.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {supplier.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <FileText className="w-6 h-6" />
                        <span>Generate Voucher</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <Download className="w-6 h-6" />
                        <span>Download Itinerary</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <Upload className="w-6 h-6" />
                        <span>Upload Documents</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <ExternalLink className="w-6 h-6" />
                        <span>Share with Customer</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Communication</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <Button size="sm">
                          <Phone className="w-4 h-4 mr-2" />
                          Schedule Call
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </Button>
                        <Button size="sm" variant="outline">
                          <span className="mr-2">📱</span>
                          WhatsApp
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Operation Notes</Label>
                        <Textarea
                          placeholder="Add notes about this booking..."
                          value={operationNotes}
                          onChange={(e) => setOperationNotes(e.target.value)}
                        />
                        <Button 
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, booking.booking_status, operationNotes)}
                        >
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Management</h1>
          <p className="text-gray-600">Manage bookings, payments, and customer operations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchBookings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">{booking.customer_name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{booking.travel_date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">₹{booking.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(booking.booking_status)}>
                        {booking.booking_status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(booking.payment_status)}>
                        {booking.payment_status}
                      </Badge>
                      <Button 
                        onClick={() => setSelectedBooking(booking)}
                        size="sm"
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>Track all payment transactions and pending amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.filter(b => b.payment_status !== 'paid').map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{booking.customer_name}</h4>
                      <p className="text-sm text-gray-600">
                        Outstanding: ₹{(booking.total_amount - (booking.amount_paid || 0)).toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setSelectedBooking(booking)}>
                      Process Payment
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Network</CardTitle>
              <CardDescription>Manage relationships with travel suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Hotel className="w-12 h-12 mx-auto mb-4" />
                <p>Supplier management interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operations Calendar</CardTitle>
              <CardDescription>View upcoming trips and important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
                <p>Calendar integration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BookingDetailDialog
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
};

export default OperationsManagement;