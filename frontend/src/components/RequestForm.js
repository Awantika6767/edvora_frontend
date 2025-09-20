import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  CalendarIcon, 
  Users, 
  MapPin, 
  DollarSign, 
  Plane, 
  Car, 
  Train, 
  Bus,
  Hotel,
  Utensils,
  Camera,
  FileText,
  Plus,
  X,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RequestForm = ({ onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    travel_type: 'leisure',
    travelers_count: 2,
    adults: 2,
    children: 0,
    infants: 0,
    departure_date: null,
    return_date: null,
    is_flexible_dates: false,
    flexible_days: 3,
    budget_min: '',
    budget_max: '',
    budget_per_person: false,
    destinations: [],
    destination_preferences: 'specific', // specific or terrain
    terrain_types: [],
    transport_modes: [],
    accommodation_star: 3,
    meal_preference: 'vegetarian',
    special_requirements: '',
    attachments: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addDestination = (destination) => {
    if (destination && !formData.destinations.includes(destination)) {
      updateFormData('destinations', [...formData.destinations, destination]);
    }
  };

  const removeDestination = (destination) => {
    updateFormData('destinations', formData.destinations.filter(d => d !== destination));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare data for API
      const requestData = {
        ...formData,
        departure_date: formData.departure_date ? format(formData.departure_date, 'yyyy-MM-dd') : '',
        return_date: formData.return_date ? format(formData.return_date, 'yyyy-MM-dd') : '',
        budget_min: parseFloat(formData.budget_min) || null,
        budget_max: parseFloat(formData.budget_max) || null,
      };

      const response = await axios.post(`${API}/requests`, requestData);
      toast.success('Travel request submitted successfully!');
      
      if (onSubmit) {
        onSubmit(response.data);
      }
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
      console.error('Request submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Trip Basics', icon: FileText },
    { id: 2, title: 'Travelers', icon: Users },
    { id: 3, title: 'Dates', icon: CalendarIcon },
    { id: 4, title: 'Budget', icon: DollarSign },
    { id: 5, title: 'Destinations', icon: MapPin },
    { id: 6, title: 'Preferences', icon: Hotel },
    { id: 7, title: 'Review', icon: Check }
  ];

  const terrainOptions = [
    'Beach', 'Mountains', 'Hills', 'Desert', 'Forest', 'Lakes', 'Cold Climate', 'Warm Climate'
  ];

  const transportOptions = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'car', label: 'Car', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus }
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
              ${isActive ? 'bg-orange-500 border-orange-500 text-white' : 
                isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                'bg-white border-gray-300 text-gray-400'}
            `}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="ml-2 hidden md:block">
              <p className={`text-sm font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Trip Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Family Vacation to Goa"
          value={formData.title}
          onChange={(e) => updateFormData('title', e.target.value)}
          className="h-12"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Travel Type</Label>
        <Select value={formData.travel_type} onValueChange={(value) => updateFormData('travel_type', value)}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="leisure">Leisure</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="adventure">Adventure</SelectItem>
            <SelectItem value="religious">Religious</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Adults</Label>
          <Input
            type="number"
            min="1"
            value={formData.adults}
            onChange={(e) => {
              const adults = parseInt(e.target.value) || 1;
              updateFormData('adults', adults);
              updateFormData('travelers_count', adults + formData.children + formData.infants);
            }}
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Children (2-12 years)</Label>
          <Input
            type="number"
            min="0"
            value={formData.children}
            onChange={(e) => {
              const children = parseInt(e.target.value) || 0;
              updateFormData('children', children);
              updateFormData('travelers_count', formData.adults + children + formData.infants);
            }}
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Infants (Under 2)</Label>
          <Input
            type="number"
            min="0"
            value={formData.infants}
            onChange={(e) => {
              const infants = parseInt(e.target.value) || 0;
              updateFormData('infants', infants);
              updateFormData('travelers_count', formData.adults + formData.children + infants);
            }}
            className="h-12"
          />
        </div>
      </div>
      
      <div className="p-4 bg-orange-50 rounded-lg">
        <p className="text-sm text-orange-800">
          <strong>Total Travelers: {formData.travelers_count}</strong>
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Switch
          checked={formData.is_flexible_dates}
          onCheckedChange={(checked) => updateFormData('is_flexible_dates', checked)}
        />
        <Label>Flexible dates (±{formData.flexible_days} days)</Label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Departure Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-12">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.departure_date ? format(formData.departure_date, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.departure_date}
                onSelect={(date) => updateFormData('departure_date', date)}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>Return Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-12">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.return_date ? format(formData.return_date, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.return_date}
                onSelect={(date) => updateFormData('return_date', date)}
                disabled={(date) => date < formData.departure_date}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {formData.is_flexible_dates && (
        <div className="p-4 bg-orange-50 rounded-lg">
          <Badge className="bg-orange-100 text-orange-700 mb-2">Flexible</Badge>
          <p className="text-sm text-orange-800">
            We'll suggest options within ±{formData.flexible_days} days of your preferred dates for better rates.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Switch
          checked={formData.budget_per_person}
          onCheckedChange={(checked) => updateFormData('budget_per_person', checked)}
        />
        <Label>Budget per person</Label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Minimum Budget (₹)</Label>
          <Input
            type="number"
            placeholder="50000"
            value={formData.budget_min}
            onChange={(e) => updateFormData('budget_min', e.target.value)}
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Maximum Budget (₹)</Label>
          <Input
            type="number"
            placeholder="100000"
            value={formData.budget_max}
            onChange={(e) => updateFormData('budget_max', e.target.value)}
            className="h-12"
          />
        </div>
      </div>
      
      {formData.budget_min && formData.budget_max && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Budget Range: ₹{formData.budget_min} - ₹{formData.budget_max}</strong>
            {formData.budget_per_person && (
              <span> per person (Total: ₹{(parseFloat(formData.budget_min) || 0) * formData.travelers_count} - ₹{(parseFloat(formData.budget_max) || 0) * formData.travelers_count})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <Tabs value={formData.destination_preferences} onValueChange={(value) => updateFormData('destination_preferences', value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="specific">Specific Places</TabsTrigger>
          <TabsTrigger value="terrain">Type of Terrain</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specific" className="space-y-4">
          <div className="space-y-2">
            <Label>Add Destinations</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., Goa, Mumbai, Kerala"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addDestination(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="h-12"
              />
              <Button
                type="button"
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  addDestination(input.value);
                  input.value = '';
                }}
                className="h-12 px-6"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.destinations.map((dest, index) => (
              <Badge key={index} variant="secondary" className="flex items-center space-x-1 px-3 py-1">
                <span>{dest}</span>
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeDestination(dest)}
                />
              </Badge>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="terrain" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {terrainOptions.map((terrain) => (
              <div key={terrain} className="flex items-center space-x-2">
                <Checkbox
                  id={terrain}
                  checked={formData.terrain_types.includes(terrain)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFormData('terrain_types', [...formData.terrain_types, terrain]);
                    } else {
                      updateFormData('terrain_types', formData.terrain_types.filter(t => t !== terrain));
                    }
                  }}
                />
                <Label htmlFor={terrain} className="text-sm">{terrain}</Label>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Preferred Transport Modes</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {transportOptions.map((transport) => {
            const Icon = transport.icon;
            return (
              <div key={transport.id} className="flex items-center space-x-2">
                <Checkbox
                  id={transport.id}
                  checked={formData.transport_modes.includes(transport.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFormData('transport_modes', [...formData.transport_modes, transport.id]);
                    } else {
                      updateFormData('transport_modes', formData.transport_modes.filter(t => t !== transport.id));
                    }
                  }}
                />
                <Label htmlFor={transport.id} className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{transport.label}</span>
                </Label>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Accommodation Star Rating</Label>
        <Select value={formData.accommodation_star.toString()} onValueChange={(value) => updateFormData('accommodation_star', parseInt(value))}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 Star</SelectItem>
            <SelectItem value="4">4 Star</SelectItem>
            <SelectItem value="5">5 Star</SelectItem>
            <SelectItem value="6">Luxury</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Meal Preference</Label>
        <Select value={formData.meal_preference} onValueChange={(value) => updateFormData('meal_preference', value)}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vegetarian">Vegetarian</SelectItem>
            <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
            <SelectItem value="vegan">Vegan</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Special Requirements</Label>
        <Textarea
          placeholder="Any special requirements, accessibility needs, or preferences..."
          value={formData.special_requirements}
          onChange={(e) => updateFormData('special_requirements', e.target.value)}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Review Your Request</CardTitle>
          <CardDescription>Please review all details before submitting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-orange-600">Trip Details</h4>
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Type:</strong> {formData.travel_type}</p>
              <p><strong>Travelers:</strong> {formData.travelers_count} ({formData.adults} adults, {formData.children} children, {formData.infants} infants)</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-600">Dates & Budget</h4>
              <p><strong>Departure:</strong> {formData.departure_date ? format(formData.departure_date, 'PPP') : 'Not selected'}</p>
              <p><strong>Return:</strong> {formData.return_date ? format(formData.return_date, 'PPP') : 'Not selected'}</p>
              <p><strong>Budget:</strong> ₹{formData.budget_min} - ₹{formData.budget_max} {formData.budget_per_person ? 'per person' : 'total'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-600">Destinations</h4>
              {formData.destination_preferences === 'specific' ? (
                <div className="flex flex-wrap gap-1">
                  {formData.destinations.map((dest, index) => (
                    <Badge key={index} variant="outline">{dest}</Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {formData.terrain_types.map((terrain, index) => (
                    <Badge key={index} variant="outline">{terrain}</Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-600">Preferences</h4>
              <p><strong>Transport:</strong> {formData.transport_modes.join(', ')}</p>
              <p><strong>Accommodation:</strong> {formData.accommodation_star} Star</p>
              <p><strong>Meals:</strong> {formData.meal_preference}</p>
            </div>
          </div>
          
          {formData.special_requirements && (
            <div>
              <h4 className="font-semibold text-orange-600">Special Requirements</h4>
              <p className="text-sm text-gray-600">{formData.special_requirements}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();  
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.title.trim() !== '';
      case 2: return formData.adults > 0;
      case 3: return formData.departure_date && formData.return_date;
      case 4: return formData.budget_min && formData.budget_max;
      case 5: return formData.destinations.length > 0 || formData.terrain_types.length > 0;
      case 6: return formData.transport_modes.length > 0;
      case 7: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900">Create Travel Request</CardTitle>
          <CardDescription>Tell us about your dream trip and we'll create perfect quotations for you</CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderStepIndicator()}
          
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex justify-between">
            <div className="space-x-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              {currentStep < 7 ? (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestForm;