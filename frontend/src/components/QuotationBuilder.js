import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  ArrowLeft,
  Plus,
  Minus,
  Save,
  Send,
  Eye,
  Calculator,
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Plane,
  Hotel,
  Car,
  Camera,
  Utensils,
  Edit3,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Target,
  Settings,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import RateStudio from './RateStudio';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationBuilder = ({ request, onBack, onSave }) => {
  const [quotation, setQuotation] = useState({
    title: `${request.title} - Quotation`,
    options: [
      {
        id: 'A',
        name: 'Option A - Premium',
        duration: '5 Days 4 Nights',
        total_price: 0,
        margin_percentage: 15,
        line_items: [
          { id: 1, category: 'transport', description: 'Flight (Round Trip)', quantity: request.travelers_count, unit_price: 8000, total: 0, is_fixed: true },
          { id: 2, category: 'accommodation', description: '4-Star Hotel (Per Night)', quantity: 4, unit_price: 6000, total: 0, is_fixed: false },
          { id: 3, category: 'activities', description: 'Sightseeing Package', quantity: 1, unit_price: 15000, total: 0, is_fixed: false },
          { id: 4, category: 'meals', description: 'All Meals Included', quantity: request.travelers_count, unit_price: 2000, total: 0, is_fixed: false },
          { id: 5, category: 'taxes', description: 'GST & Service Charges', quantity: 1, unit_price: 0, total: 0, is_fixed: true }
        ]
      },
      {
        id: 'B',
        name: 'Option B - Standard',
        duration: '5 Days 4 Nights',
        total_price: 0,
        margin_percentage: 18,
        line_items: [
          { id: 1, category: 'transport', description: 'Train (Round Trip)', quantity: request.travelers_count, unit_price: 3000, total: 0, is_fixed: true },
          { id: 2, category: 'accommodation', description: '3-Star Hotel (Per Night)', quantity: 4, unit_price: 4000, total: 0, is_fixed: false },
          { id: 3, category: 'activities', description: 'Basic Sightseeing', quantity: 1, unit_price: 8000, total: 0, is_fixed: false },
          { id: 4, category: 'meals', description: 'Breakfast & Dinner', quantity: request.travelers_count, unit_price: 1200, total: 0, is_fixed: false },
          { id: 5, category: 'taxes', description: 'GST & Service Charges', quantity: 1, unit_price: 0, total: 0, is_fixed: true }
        ]
      },
      {
        id: 'C',
        name: 'Option C - Budget',
        duration: '4 Days 3 Nights',
        total_price: 0,
        margin_percentage: 22,
        line_items: [
          { id: 1, category: 'transport', description: 'Bus (Round Trip)', quantity: request.travelers_count, unit_price: 1500, total: 0, is_fixed: true },
          { id: 2, category: 'accommodation', description: 'Budget Hotel (Per Night)', quantity: 3, unit_price: 2500, total: 0, is_fixed: false },
          { id: 3, category: 'activities', description: 'Self-Guided Tours', quantity: 1, unit_price: 5000, total: 0, is_fixed: false },
          { id: 4, category: 'meals', description: 'Breakfast Only', quantity: request.travelers_count, unit_price: 800, total: 0, is_fixed: false },
          { id: 5, category: 'taxes', description: 'GST & Service Charges', quantity: 1, unit_price: 0, total: 0, is_fixed: true }
        ]
      }
    ],
    validity_days: 7,
    terms_conditions: 'Standard travel terms and conditions apply. Prices subject to availability.',
    status: 'draft'
  });

  const [activeOption, setActiveOption] = useState('A');
  const [showRatePanel, setShowRatePanel] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [recommendations, setRecommendations] = useState({
    suggested_price: 85000,
    confidence: 82,
    factors: ['Peak season demand', 'Competitor analysis', 'Historical conversions'],
    market_intelligence: {
      competitor_avg: 92000,
      our_position: 'competitive',
      conversion_probability: 75
    }
  });

  useEffect(() => {
    calculateTotals();
  }, []); // Remove dependency to prevent infinite loop

  const calculateTotals = () => {
    // Initialize totals on first load only
    if (quotation.options[0].line_items[0].total === 0) {
      const updatedOptions = quotation.options.map(option => {
        let subtotal = 0;
        const updatedLineItems = option.line_items.map(item => {
          const total = item.quantity * item.unit_price;
          subtotal += total;
          return { ...item, total };
        });

        // Calculate taxes (assuming 18% GST)
        const taxItem = updatedLineItems.find(item => item.category === 'taxes');
        if (taxItem) {
          const taxableAmount = subtotal - taxItem.total;
          taxItem.total = taxableAmount * 0.18;
          taxItem.unit_price = taxItem.total;
          subtotal = taxableAmount + taxItem.total;
        }

        // Add margin
        const total_price = subtotal * (1 + option.margin_percentage / 100);

        return {
          ...option,
          line_items: updatedLineItems,
          total_price: Math.round(total_price)
        };
      });

      setQuotation(prev => ({ ...prev, options: updatedOptions }));
    }
  };

  const updateLineItem = (optionId, itemId, field, value) => {
    setQuotation(prev => ({
      ...prev,
      options: prev.options.map(option => 
        option.id === optionId
          ? {
              ...option,
              line_items: option.line_items.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
              )
            }
          : option
      )
    }));
  };

  const addLineItem = (optionId) => {
    const newItem = {
      id: Date.now(),
      category: 'miscellaneous',
      description: 'New Item',
      quantity: 1,
      unit_price: 0,
      total: 0,
      is_fixed: false
    };

    setQuotation(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === optionId
          ? { ...option, line_items: [...option.line_items, newItem] }
          : option
      )
    }));
  };

  const removeLineItem = (optionId, itemId) => {
    setQuotation(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === optionId
          ? { ...option, line_items: option.line_items.filter(item => item.id !== itemId) }
          : option
      )
    }));
  };

  const applyRecommendation = () => {
    const currentOption = quotation.options.find(opt => opt.id === activeOption);
    if (!currentOption) return;

    const suggestedPrice = recommendations.suggested_price;
    const currentSubtotal = currentOption.line_items.reduce((sum, item) => sum + item.total, 0);
    const requiredMargin = ((suggestedPrice - currentSubtotal) / currentSubtotal) * 100;

    setQuotation(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === activeOption
          ? { ...option, margin_percentage: Math.max(5, Math.round(requiredMargin)) }
          : option
      )
    }));

    toast.success('Price recommendation applied successfully!');
  };

  const simulateScenario = (hotelStar, transportClass, durationDays) => {
    // Mock scenario simulation
    const basePrices = {
      hotel: { 3: 3000, 4: 5000, 5: 8000 },
      transport: { economy: 5000, premium: 8000, luxury: 12000 }
    };

    const estimatedPrice = (basePrices.hotel[hotelStar] || 5000) * durationDays * request.travelers_count +
                          (basePrices.transport[transportClass] || 8000) * request.travelers_count;

    return {
      estimated_price: estimatedPrice,
      conversion_probability: Math.max(30, 90 - (estimatedPrice / 1000)),
      margin_estimate: estimatedPrice * 0.15
    };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      transport: Plane,
      accommodation: Hotel,
      activities: Camera,
      meals: Utensils,
      taxes: Calculator,
      miscellaneous: Plus
    };
    return icons[category] || Plus;
  };

  const handleSave = async () => {
    try {
      const quotationData = {
        ...quotation,
        request_id: request.id
      };
      
      // Mock save to backend
      console.log('Saving quotation:', quotationData);
      toast.success('Quotation saved as draft');
      if (onSave) onSave(quotationData);
    } catch (error) {
      toast.error('Failed to save quotation');
    }
  };

  const handleSend = async () => {
    try {
      const currentOption = quotation.options.find(opt => opt.id === activeOption);
      const discountPercentage = calculateDiscountPercentage(currentOption);
      
      // Check if approval is required (discount > 15%)
      if (discountPercentage > 15) {
        setApprovalRequired(true);
        return;
      }

      const quotationData = {
        ...quotation,
        request_id: request.id,
        status: 'sent'
      };
      
      console.log('Sending quotation:', quotationData);
      toast.success('Quotation sent to customer successfully');
      if (onSave) onSave(quotationData);
    } catch (error) {
      toast.error('Failed to send quotation');
    }
  };

  const handleApprovalRequest = async () => {
    try {
      const currentOption = quotation.options.find(opt => opt.id === activeOption);
      const discountPercentage = calculateDiscountPercentage(currentOption);
      
      await axios.post(`${API}/quotations/mock-id/approval`, {
        quotation_id: 'mock-quotation-id',
        discount_percentage: discountPercentage,
        reason: approvalReason,
        requested_by: 'current-user'
      });
      
      toast.success('Approval request submitted to manager');
      setApprovalRequired(false);
      setApprovalReason('');
    } catch (error) {
      toast.error('Failed to submit approval request');
    }
  };

  const calculateDiscountPercentage = (option) => {
    if (!option) return 0;
    const cost = option.line_items.reduce((sum, item) => sum + item.total, 0);
    const sellingPrice = option.total_price;
    const standardMargin = 20; // 20% standard margin
    const standardPrice = cost * (1 + standardMargin / 100);
    return Math.max(0, ((standardPrice - sellingPrice) / standardPrice) * 100);
  };

  const handleRateStudioPriceUpdate = (newPrice) => {
    setQuotation(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === activeOption
          ? { ...option, total_price: Math.round(newPrice) }
          : option
      )
    }));
  };

  const currentOption = quotation.options.find(opt => opt.id === activeOption);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Builder</h1>
            <p className="text-gray-600">{request.title} • {request.customer_name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowRatePanel(!showRatePanel)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Rate Studio
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSend} className="bg-orange-500 hover:bg-orange-600">
            <Send className="w-4 h-4 mr-2" />
            Send to Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Request Constraints */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Constraints</CardTitle>
              <CardDescription>Fixed vs flexible requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Travelers</span>
                  <Badge className="bg-red-100 text-red-800">Fixed</Badge>
                </div>
                <p className="text-xs text-gray-600">{request.travelers_count} travelers</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dates</span>
                  <Badge className={request.is_flexible_dates ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}>
                    {request.is_flexible_dates ? 'Flexible' : 'Fixed'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Budget Range</span>
                  <Badge className="bg-orange-100 text-orange-800">Flexible</Badge>
                </div>
                <p className="text-xs text-gray-600">₹{request.budget_min?.toLocaleString()} - ₹{request.budget_max?.toLocaleString()}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Destinations</span>
                  <Badge className="bg-red-100 text-red-800">Fixed</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {request.destinations.slice(0, 2).map((dest, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{dest}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{request.customer_name}</p>
                <p className="text-sm text-gray-600">customer@demo.com</p>
              </div>
              <div className="text-sm">
                <p><strong>Type:</strong> {request.travel_type}</p>
                <p><strong>Star Rating:</strong> {request.accommodation_star} Star</p>
                <p><strong>Meals:</strong> {request.meal_preference}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Quotation Options */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeOption} onValueChange={setActiveOption}>
            <TabsList className="grid w-full grid-cols-3">
              {quotation.options.map(option => (
                <TabsTrigger key={option.id} value={option.id} className="relative">
                  <div className="text-center">
                    <div className="font-medium">Option {option.id}</div>
                    <div className="text-xs text-gray-500">₹{option.total_price.toLocaleString()}</div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {quotation.options.map(option => (
              <TabsContent key={option.id} value={option.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Input
                            value={option.name}
                            onChange={(e) => setQuotation(prev => ({
                              ...prev,
                              options: prev.options.map(opt =>
                                opt.id === option.id ? { ...opt, name: e.target.value } : opt
                              )
                            }))}
                            className="text-lg font-semibold border-none p-0 h-auto"
                          />
                          <Edit3 className="w-4 h-4 text-gray-400" />
                        </CardTitle>
                        <CardDescription>{option.duration}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          ₹{option.total_price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.margin_percentage}% margin
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Line Items */}
                      <div className="space-y-3">
                        {option.line_items.map(item => {
                          const Icon = getCategoryIcon(item.category);
                          return (
                            <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                              <div className="col-span-1">
                                <Icon className="w-4 h-4 text-gray-600" />
                              </div>
                              
                              <div className="col-span-4">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'description', e.target.value)}
                                  className="text-sm border-none bg-transparent p-0 h-auto"
                                />
                                {item.is_fixed && (
                                  <Badge className="bg-red-100 text-red-700 text-xs mt-1">Fixed</Badge>
                                )}
                              </div>
                              
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'quantity', parseInt(e.target.value) || 0)}
                                  className="text-sm h-8"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className="text-sm h-8"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <div className="text-sm font-medium">
                                  ₹{item.total.toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="col-span-1">
                                {!item.is_fixed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLineItem(option.id, item.id)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          onClick={() => addLineItem(option.id)}
                          className="w-full border-dashed"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Line Item
                        </Button>
                      </div>

                      {/* Margin Control */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <Label>Margin Percentage</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={option.margin_percentage}
                              onChange={(e) => setQuotation(prev => ({
                                ...prev,
                                options: prev.options.map(opt =>
                                  opt.id === option.id ? { ...opt, margin_percentage: parseFloat(e.target.value) || 0 } : opt
                                )
                              }))}
                              className="w-16 h-8 text-center"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                        <Slider
                          value={[option.margin_percentage]}
                          onValueChange={(value) => setQuotation(prev => ({
                            ...prev,
                            options: prev.options.map(opt =>
                              opt.id === option.id ? { ...opt, margin_percentage: value[0] } : opt
                            )
                          }))}
                          max={50}
                          min={5}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Right Sidebar - Rate Optimization */}
        <div className="lg:col-span-1 space-y-6">
          {showRatePanel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-orange-500" />
                  <span>AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Suggested Price</span>
                    <Badge className="bg-green-100 text-green-800">{recommendations.confidence}% confident</Badge>
                  </div>
                  <div className="text-xl font-bold text-green-600 mb-2">
                    ₹{recommendations.suggested_price.toLocaleString()}
                  </div>
                  <Button
                    size="sm"
                    onClick={applyRecommendation}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Apply Suggestion
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Factors:</h4>
                  {recommendations.factors.map((factor, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Market Intelligence</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Competitor Avg:</span>
                      <span>₹{recommendations.market_intelligence.competitor_avg.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Our Position:</span>
                      <Badge variant="outline" className="text-xs">
                        {recommendations.market_intelligence.our_position}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Probability:</span>
                      <span className="font-medium">{recommendations.market_intelligence.conversion_probability}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scenario Simulator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <span>Quick Scenarios</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Hotel Category</Label>
                  <Select defaultValue="4">
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Star</SelectItem>
                      <SelectItem value="4">4 Star</SelectItem>
                      <SelectItem value="5">5 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Transport</Label>
                  <Select defaultValue="premium">
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Simulate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Option
              </Button>
              
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
              
              <Button variant="outline" size="sm" className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Cost Breakdown
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuotationBuilder;