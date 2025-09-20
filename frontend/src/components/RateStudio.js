import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RateStudio = ({ requestId, onPriceUpdate }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [simulation, setSimulation] = useState({
    basePrice: 100000,
    hotelStar: 4,
    transportClass: 'economy',
    durationDays: 3
  });
  const [competitorRates, setCompetitorRates] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchRateRecommendation();
      fetchCompetitorRates();
    }
  }, [requestId]);

  const fetchRateRecommendation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/rate-optimization/recommendations/${requestId}`);
      setRecommendation(response.data);
      setSimulation(prev => ({ ...prev, basePrice: response.data.recommended_price }));
    } catch (error) {
      toast.error('Failed to fetch rate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitorRates = async () => {
    try {
      const response = await axios.get(`${API}/rate-optimization/competitor-rates/goa`);
      setCompetitorRates(response.data);
    } catch (error) {
      console.error('Failed to fetch competitor rates:', error);
    }
  };

  const runSimulation = async () => {
    try {
      const response = await axios.post(`${API}/rate-optimization/simulate`, simulation);
      return response.data;
    } catch (error) {
      toast.error('Failed to run price simulation');
      return null;
    }
  };

  const applyRecommendation = () => {
    if (recommendation && onPriceUpdate) {
      onPriceUpdate(recommendation.recommended_price);
      toast.success('Rate recommendation applied successfully');
    }
  };

  const PriceRecommendationCard = () => (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-600" />
          <span>AI Price Recommendation</span>
        </CardTitle>
        <CardDescription>
          Optimized pricing based on market intelligence and historical data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Calculating optimal price...</span>
          </div>
        ) : recommendation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  ₹{recommendation.recommended_price.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {Math.round(recommendation.confidence * 100)}% Confidence
                  </Badge>
                  <Badge variant="outline">
                    High Acceptance Probability
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={applyRecommendation}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply Recommendation
              </Button>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Pricing Factors</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Seasonal Factor:</span>
                  <span>{recommendation.seasonal_factor}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Demand Factor:</span>
                  <span>{recommendation.demand_factor}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Competitor Delta:</span>
                  <span>{(recommendation.competitor_delta * 100).toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">{recommendation.reasoning}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No recommendation available
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ScenarioSimulator = () => {
    const [simResult, setSimResult] = useState(null);
    const [simLoading, setSimLoading] = useState(false);

    const handleSimulation = async () => {
      setSimLoading(true);
      const result = await runSimulation();
      setSimResult(result);
      setSimLoading(false);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span>Scenario Simulator</span>
          </CardTitle>
          <CardDescription>
            Test different pricing scenarios and see projected outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Price (₹)</Label>
              <Input
                type="number"
                value={simulation.basePrice}
                onChange={(e) => setSimulation(prev => ({ ...prev, basePrice: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (Days)</Label>
              <Input
                type="number"
                value={simulation.durationDays}
                onChange={(e) => setSimulation(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hotel Star Rating</Label>
              <Select 
                value={simulation.hotelStar.toString()} 
                onValueChange={(value) => setSimulation(prev => ({ ...prev, hotelStar: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Star</SelectItem>
                  <SelectItem value="4">4 Star</SelectItem>
                  <SelectItem value="5">5 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transport Class</Label>
              <Select 
                value={simulation.transportClass} 
                onValueChange={(value) => setSimulation(prev => ({ ...prev, transportClass: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSimulation} 
            disabled={simLoading}
            className="w-full"
          >
            {simLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>

          {simResult && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Simulation Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Adjusted Price:</span>
                  <div className="text-xl font-bold text-blue-800">
                    ₹{simResult.adjusted_price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-blue-600">Est. Conversion:</span>
                  <div className="text-xl font-bold text-blue-800">
                    {(simResult.estimated_conversion * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between text-sm">
                  <span>Price Change:</span>
                  <span className={simResult.price_change_percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {simResult.price_change_percentage >= 0 ? '+' : ''}{simResult.price_change_percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Margin Impact:</span>
                  <span className={simResult.margin_impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{simResult.margin_impact.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const CompetitorIntelligence = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span>Competitor Intelligence</span>
        </CardTitle>
        <CardDescription>
          Market pricing data and competitive positioning
        </CardDescription>
      </CardHeader>
      <CardContent>
        {competitorRates ? (
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Market Average</span>
                <span className="text-lg font-bold text-purple-600">
                  ₹{competitorRates.market_average.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-purple-600">{competitorRates.suggested_action}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Competitor Rates</h4>
              {competitorRates.competitors.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{competitor.name}</span>
                    <Badge variant={competitor.confidence === 'high' ? 'default' : 'secondary'}>
                      {competitor.confidence} confidence
                    </Badge>
                  </div>
                  <span className="font-medium">₹{competitor.rate.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            No competitor data available
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ElasticityChart = () => {
    const [priceRange, setPriceRange] = useState([80000]);
    const basePrice = recommendation?.recommended_price || 100000;
    
    const calculateConversion = (price) => {
      const baseConversion = 0.75;
      const priceRatio = price / basePrice;
      return Math.max(0.1, Math.min(0.95, baseConversion * (2 - priceRatio)));
    };

    const currentPrice = priceRange[0];
    const estimatedConversion = calculateConversion(currentPrice);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span>Price Elasticity</span>
          </CardTitle>
          <CardDescription>
            Adjust price to see estimated conversion probability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={200000}
              min={50000}
              step={5000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>₹50,000</span>
              <span>₹200,000</span>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{currentPrice.toLocaleString()}
                </div>
                <div className="text-sm text-orange-600">Selected Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(estimatedConversion * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-orange-600">Est. Conversion</div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-orange-200">
              <div className="flex items-center justify-center space-x-2">
                {estimatedConversion >= 0.7 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm">
                  {estimatedConversion >= 0.7 ? 'Optimal pricing zone' : 'Consider price adjustment'}
                </span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => onPriceUpdate && onPriceUpdate(currentPrice)}
            className="w-full"
            variant="outline"
          >
            Apply This Price
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rate Studio</h2>
          <p className="text-gray-600">AI-powered pricing optimization and market intelligence</p>
        </div>
        <Button onClick={fetchRateRecommendation} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="elasticity">Elasticity</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <PriceRecommendationCard />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <ScenarioSimulator />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <CompetitorIntelligence />
        </TabsContent>

        <TabsContent value="elasticity" className="space-y-6">
          <ElasticityChart />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RateStudio;