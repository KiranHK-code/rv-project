// Demand Forecasting Module

/**
 * Simple Moving Average Forecasting
 * F(t+1) = (D(t) + D(t-1) + ... + D(t-n+1)) / n
 */
function movingAverageForecast(historicalData, periods = 7, forecastDays = 30) {
  const forecast = [];
  const data = [...historicalData];

  for (let i = 0; i < forecastDays; i++) {
    if (data.length < periods) {
      // Not enough historical data, use simple average
      const avg = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;
      forecast.push(avg);
      data.push(avg);
    } else {
      // Calculate moving average
      const window = data.slice(-periods);
      const avg = window.reduce((a, b) => a + b, 0) / periods;
      forecast.push(avg);
      data.push(avg);
    }
  }

  return forecast.map(v => Math.round(v));
}

/**
 * Linear Regression Forecasting
 * Fits a line y = mx + b to historical data
 */
function linearRegressionForecast(historicalData, forecastDays = 30) {
  const n = historicalData.length;
  if (n < 2) {
    // Not enough data, return average
    const avg = historicalData.length > 0 ? historicalData[0] : 0;
    return Array(forecastDays).fill(avg);
  }

  // Calculate means
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += historicalData[i];
    sumXY += i * historicalData[i];
    sumX2 += i * i;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope (m) and intercept (b)
  const m = (sumXY - n * meanX * meanY) / (sumX2 - n * meanX * meanX);
  const b = meanY - m * meanX;

  // Generate forecast
  const forecast = [];
  for (let i = 0; i < forecastDays; i++) {
    const x = n + i;
    const predicted = m * x + b;
    forecast.push(Math.max(0, Math.round(predicted)));
  }

  return forecast;
}

/**
 * Exponential Smoothing Forecasting
 * F(t+1) = α * D(t) + (1-α) * F(t)
 */
function exponentialSmoothingForecast(historicalData, alpha = 0.3, forecastDays = 30) {
  const forecast = [];
  const data = [...historicalData];

  if (data.length === 0) {
    return Array(forecastDays).fill(0);
  }

  let prevForecast = data[0];

  for (let i = 0; i < forecastDays; i++) {
    const nextForecast = alpha * (data.length > i ? data[i] : prevForecast) + (1 - alpha) * prevForecast;
    forecast.push(Math.round(nextForecast));
    prevForecast = nextForecast;
  }

  return forecast;
}

/**
 * Seasonality-adjusted forecast (simple approach)
 * Identifies seasonal patterns in last year of data
 */
function seasonalForecast(historicalData, seasonalPeriod = 7, forecastDays = 30) {
  const forecast = [];
  
  if (historicalData.length < seasonalPeriod) {
    return movingAverageForecast(historicalData, 3, forecastDays);
  }

  // Get average for each seasonal period
  const seasonalAverages = {};
  const sevenDayWindow = historicalData.slice(-seasonalPeriod * 4);

  for (let i = 0; i < seasonalPeriod; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i; j < sevenDayWindow.length; j += seasonalPeriod) {
      sum += sevenDayWindow[j];
      count++;
    }
    seasonalAverages[i] = count > 0 ? sum / count : 0;
  }

  // Generate forecast using seasonal pattern
  for (let i = 0; i < forecastDays; i++) {
    const seasonIndex = i % seasonalPeriod;
    forecast.push(Math.round(seasonalAverages[seasonIndex]));
  }

  return forecast;
}

/**
 * Combined ensemble forecast
 * Weights multiple methods for better prediction
 */
function ensembleForecast(
  historicalData,
  forecastDays = 30,
  weights = { movingAvg: 0.4, linear: 0.3, exponential: 0.3 }
) {
  const maForecast = movingAverageForecast(historicalData, 7, forecastDays);
  const lrForecast = linearRegressionForecast(historicalData, forecastDays);
  const expForecast = exponentialSmoothingForecast(historicalData, 0.3, forecastDays);

  const combined = [];
  for (let i = 0; i < forecastDays; i++) {
    const weighted = 
      (maForecast[i] * weights.movingAvg) +
      (lrForecast[i] * weights.linear) +
      (expForecast[i] * weights.exponential);
    combined.push(Math.round(weighted));
  }

  return combined;
}

/**
 * Forecast demand for multiple products (hierarchical)
 */
function hierarchicalForecast(customerDemand, method = 'movingAverage', forecastDays = 30) {
  const forecast = {};

  for (const [productId, data] of Object.entries(customerDemand)) {
    switch (method) {
      case 'movingAverage':
        forecast[productId] = movingAverageForecast(data, 7, forecastDays);
        break;
      case 'linear':
        forecast[productId] = linearRegressionForecast(data, forecastDays);
        break;
      case 'exponential':
        forecast[productId] = exponentialSmoothingForecast(data, 0.3, forecastDays);
        break;
      case 'seasonal':
        forecast[productId] = seasonalForecast(data, 7, forecastDays);
        break;
      case 'ensemble':
        forecast[productId] = ensembleForecast(data, forecastDays);
        break;
      default:
        forecast[productId] = movingAverageForecast(data, 7, forecastDays);
    }
  }

  return forecast;
}

/**
 * Calculate demand statistics
 */
function calculateDemandStats(historicalData) {
  if (historicalData.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0 };
  }

  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const variance = historicalData.reduce((sum, val) => sum + (val - mean) ** 2, 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...historicalData);
  const max = Math.max(...historicalData);

  return { mean, stdDev, min, max };
}

module.exports = {
  movingAverageForecast,
  linearRegressionForecast,
  exponentialSmoothingForecast,
  seasonalForecast,
  ensembleForecast,
  hierarchicalForecast,
  calculateDemandStats
};
