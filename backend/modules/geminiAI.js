// Google Gemini AI Integration for Supply Chain Analytics

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
  constructor(options = {}) {
    const settings = typeof options === 'string' ? { apiKey: options } : options;

    this.apiKey = settings.apiKey || '';
    this.modelName = settings.model || 'gemini-2.5-flash';
    this.isConfigured = Boolean(this.apiKey);
    this.client = null;
    this.model = null;

    if (this.isConfigured) {
      this.client = new GoogleGenerativeAI(this.apiKey);
      this.model = this.client.getGenerativeModel({ model: this.modelName });
    }

    // Simple in-memory cache for AI responses
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 1 hour in milliseconds
  }

  ensureConfigured() {
    if (!this.isConfigured || !this.model) {
      throw new Error('Gemini API is not configured. Set GEMINI_API_KEY in backend/.env and restart the server.');
    }
  }

  // Generate cache key from inputs
  getCacheKey(data, context) {
    return `${JSON.stringify(data).substring(0, 100)}_${JSON.stringify(context).substring(0, 100)}`;
  }

  // Get cached response if available
  getCachedResponse(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    // Remove expired cache
    if (cached) this.cache.delete(key);
    return null;
  }

  // Store response in cache
  setCachedResponse(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheExpiry
    });
  }

  /**
   * Advanced statistical analysis for demand trends
   */
  analyzeDemandTrend(demandData) {
    if (!demandData || demandData.length < 2) return { trend: 'insufficient_data', slope: 0, volatility: 0 };
    
    // Calculate linear trend
    const n = demandData.length;
    const xMean = (n + 1) / 2;
    const yMean = demandData.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i + 1 - xMean) * (demandData[i] - yMean);
      denominator += Math.pow(i + 1 - xMean, 2);
    }
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Calculate volatility (standard deviation)
    const variance = demandData.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n;
    const volatility = Math.sqrt(variance);
    const cv = yMean !== 0 ? volatility / yMean : 0; // Coefficient of variation
    
    // Determine trend
    let trend = 'stable';
    if (slope > yMean * 0.05) trend = 'increasing';
    else if (slope < -yMean * 0.05) trend = 'decreasing';
    
    return { trend, slope, volatility, cv, mean: yMean };
  }

  /**
   * Generate AI-powered demand forecast insights
   */
  async generateForecastInsights(demandData, historicalContext) {
    try {
      this.ensureConfigured();
      const cacheKey = this.getCacheKey(demandData, historicalContext);
      
      // Check cache first
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const prompt = `
        You are a supply chain expert. Analyze this demand data and provide insights:
        
        Current Demand Data: ${JSON.stringify(demandData)}
        Historical Context: ${JSON.stringify(historicalContext)}
        
        Provide:
        1. Demand trend analysis (increasing/decreasing/stable)
        2. Potential risks or anomalies
        3. Recommended inventory levels
        4. Forecast confidence level (high/medium/low)
        
        Format as JSON with keys: trend, risks, recommendations, confidence
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        this.setCachedResponse(cacheKey, parsed);
        return parsed;
      }
      
      const fallback = { 
        trend: 'stable', 
        risks: [], 
        recommendations: [text],
        confidence: 'medium'
      };
      this.setCachedResponse(cacheKey, fallback);
      return fallback;
    } catch (error) {
      console.error('Error generating Gemini insights:', error.message);
      
      // Advanced statistical fallback analysis
      const trendAnalysis = this.analyzeDemandTrend(demandData);
      
      const risks = [];
      if (trendAnalysis.cv > 0.4) risks.push('High demand volatility detected');
      if (trendAnalysis.trend === 'increasing') risks.push('Rising demand - inventory pressure');
      if (trendAnalysis.trend === 'decreasing') risks.push('Declining demand - potential overstock');
      if (trendAnalysis.slope > 0.5) risks.push('Sharp demand increase - supply chain stress');
      
      const recommendations = [];
      recommendations.push('Maintain inventory at 75-80% of warehouse capacity');
      if (trendAnalysis.cv > 0.5) {
        recommendations.push('Implement dynamic safety stock due to high volatility');
      }
      if (trendAnalysis.trend === 'increasing') {
        recommendations.push('Increase supplier lead time buffers');
        recommendations.push('Negotiate volume discounts for upcoming demand');
      }
      if (trendAnalysis.trend === 'decreasing') {
        recommendations.push('Monitor slow-moving SKUs closely');
        recommendations.push('Consider promotional activities to stimulate demand');
      }
      recommendations.push('Review demand patterns every 7 days');
      
      return {
        trend: trendAnalysis.trend,
        risks: risks.length > 0 ? risks : ['High variability in demand'],
        recommendations,
        confidence: 'medium',
        analysis: {
          slope: trendAnalysis.slope,
          volatility: trendAnalysis.volatility,
          coefficient_of_variation: (trendAnalysis.cv * 100).toFixed(1) + '%'
        },
        note: 'Advanced statistical analysis (API quota exceeded)',
        error: error.message
      };
    }
  }

  /**
   * Optimize warehouse allocation using AI
   */
  async optimizeAllocation(orders, warehouses, inventory) {
    try {
      this.ensureConfigured();
      const prompt = `
        As a logistics optimization expert, recommend the best warehouse allocation:
        
        Orders: ${JSON.stringify(orders.slice(0, 3))}
        Warehouses: ${JSON.stringify(warehouses.slice(0, 3))}
        Current Inventory: ${JSON.stringify(inventory)}
        
        Consider: distance, capacity, stock levels, cost, delivery time.
        
        Provide recommendations as JSON with keys: allocation, reasoning, costSavings, estimatedDeliveryTime
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { allocation: {}, reasoning: text };
    } catch (error) {
      console.error('Error optimizing allocation:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate supply chain insights and recommendations
   */
  async generateSupplyChainInsights(dashboardData) {
    try {
      this.ensureConfigured();
      const cacheKey = this.getCacheKey(dashboardData, {});
      
      // Check cache first
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const prompt = `
        Analyze this supply chain dashboard data and provide strategic insights:
        
        Dashboard Data: ${JSON.stringify(dashboardData)}
        
        Provide:
        1. Key Performance Observations
        2. Bottlenecks or inefficiencies
        3. Cost optimization opportunities
        4. Risk mitigation strategies
        5. Actionable recommendations
        
        Format as a structured JSON report.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const report = {
        report: text,
        timestamp: new Date().toISOString(),
        analyzed: true
      };
      this.setCachedResponse(cacheKey, report);
      return report;
    } catch (error) {
      console.error('Error generating insights:', error.message);
      
      // Advanced heuristic-based fallback insights
      const insights = [];
      
      // Calculate key metrics
      const capacityUtilization = dashboardData.usedCapacity / dashboardData.totalCapacity;
      const ordersPerWarehouse = dashboardData.totalOrders / (dashboardData.warehouses || 1);
      const pendingRatio = (dashboardData.pendingOrders || 0) / (dashboardData.totalOrders || 1);
      const avgOrderValue = dashboardData.totalOrderValue / (dashboardData.totalOrders || 1);
      
      // Performance insights
      if (pendingRatio > 0.3) {
        insights.push('🚨 High pending order ratio (' + (pendingRatio * 100).toFixed(0) + '%) - improve order fulfillment speed');
      } else if (pendingRatio > 0.15) {
        insights.push('⚠️  Moderate pending orders (' + (pendingRatio * 100).toFixed(0) + '%) - monitor fulfillment pipeline');
      } else {
        insights.push('✅ Good order fulfillment rate - maintain current operations');
      }
      
      // Capacity insights
      if (capacityUtilization > 0.85) {
        insights.push('📦 Critical: Warehouse capacity at ' + (capacityUtilization * 100).toFixed(0) + '% - plan expansion or redistribution');
      } else if (capacityUtilization > 0.70) {
        insights.push('📊 Warehouse utilization at ' + (capacityUtilization * 100).toFixed(0) + '% - approaching optimal levels');
      } else {
        insights.push('💾 Warehouse has ' + ((1 - capacityUtilization) * 100).toFixed(0) + '% available capacity');
      }
      
      // Distribution insights
      if (dashboardData.warehouses < 3) {
        insights.push('🌍 Limited warehouse footprint - consider regional distribution to reduce delivery times');
      }
      
      // Volume insights
      if (ordersPerWarehouse > 30) {
        insights.push('📈 High order volume per warehouse (' + ordersPerWarehouse.toFixed(0) + ') - consider load balancing');
      }
      
      // Supply chain efficiency
      insights.push('💡 Review supplier lead times to optimize inventory levels');
      insights.push('📊 Implement real-time demand forecasting for better planning');
      insights.push('🔗 Strengthen supplier relationships for volume discounts');
      
      const report = insights.join('\n');
      
      return {
        report,
        timestamp: new Date().toISOString(),
        metrics: {
          capacity_utilization: (capacityUtilization * 100).toFixed(1) + '%',
          orders_per_warehouse: ordersPerWarehouse.toFixed(1),
          pending_ratio: (pendingRatio * 100).toFixed(1) + '%',
          avg_order_value: '$' + avgOrderValue.toFixed(2)
        },
        analyzed: true,
        note: 'Intelligent heuristic analysis (API quota exceeded)'
      };
    }
  }

  /**
   * Predict demand anomalies
   */
  async detectAnomalies(historicalData, currentDemand) {
    try {
      this.ensureConfigured();
      const cacheKey = this.getCacheKey(historicalData, currentDemand);
      
      // Check cache first
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const prompt = `
        Analyze this demand data for anomalies and pattern breaks:
        
        Historical Data: ${JSON.stringify(historicalData.slice(0, 30))}
        Current Demand: ${JSON.stringify(currentDemand)}
        
        Identify:
        1. Any significant deviations from normal patterns
        2. Potential causes
        3. Expected impact on supply chain
        4. Recommended actions
        
        Return JSON with: anomalies, severity, cause, impact, actions
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        this.setCachedResponse(cacheKey, parsed);
        return parsed;
      }
      
      const fallback = { anomalies: [], severity: 'low' };
      this.setCachedResponse(cacheKey, fallback);
      return fallback;
    } catch (error) {
      console.error('Error detecting anomalies:', error.message);
      
      // Calculate simple statistical anomaly detection
      const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      const stdDev = Math.sqrt(
        historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length
      );
      
      const recentAnom = currentDemand.filter(val => Math.abs(val - mean) > 2 * stdDev);
      
      return {
        anomalies: recentAnom.length > 0 ? [`Detected ${recentAnom.length} outlier(s) in recent demand`] : [],
        severity: recentAnom.length > 0 ? 'medium' : 'low',
        cause: recentAnom.length > 0 ? 'Statistical deviation from historical mean' : 'No anomalies detected',
        impact: recentAnom.length > 0 ? 'May require inventory adjustment' : 'Normal pattern',
        actions: recentAnom.length > 0 ? ['Review recent orders', 'Check for seasonal patterns'] : [],
        note: 'Offline mode - using statistical analysis',
        error: error.message
      };
    }
  }

  async recommendRoute(routeContext) {
    try {
      this.ensureConfigured();
      const prompt = `
        You are a logistics route planner. Recommend the best route for a delivery driver.

        Context: ${JSON.stringify(routeContext)}

        Return JSON with keys:
        summary,
        recommendedRouteReason,
        watchouts
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        summary: text,
        recommendedRouteReason: 'AI summary generated from route context',
        watchouts: ['Traffic congestion', 'Weather disruption']
      };
    } catch (error) {
      return {
        summary: 'Use the shortest route first and move to the traffic-aware option when congestion appears.',
        recommendedRouteReason: 'Fallback heuristic route guidance',
        watchouts: ['Traffic congestion', 'Weather disruption', 'Customer ETA changes'],
        error: error.message
      };
    }
  }
}

module.exports = GeminiAI;
