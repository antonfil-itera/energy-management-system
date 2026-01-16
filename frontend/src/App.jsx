import { useState, useEffect } from 'react';
import { fetchFacilities, fetchTimeseries } from './api';
import GlobalChart from './components/GlobalChart';
import FacilityLegend from './components/FacilityLegend';
import FacilityChart from './components/FacilityChart';
import './App.css';

function App() {
  const [facilities, setFacilities] = useState([]);
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [timeRangePreset, setTimeRangePreset] = useState('day');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (preset = 'day') => {
    try {
      setLoading(true);
      setError(null);

      // Fetch facilities
      const facilitiesData = await fetchFacilities();
      setFacilities(facilitiesData);

      // Calculate time range based on preset (always ending at current time)
      const endTime = new Date();
      let startTime;

      switch (preset) {
        case 'week':
          startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'day':
        default:
          startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
          break;
      }

      setTimeRange({ start: startTime, end: endTime });

      // Fetch all timeseries data
      const timeseries = await fetchTimeseries(startTime, endTime);
      setTimeseriesData(timeseries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (preset) => {
    setTimeRangePreset(preset);
    loadData(preset);
  };

  const handleFacilityClick = (facilityId) => {
    if (selectedFacility === facilityId) {
      setSelectedFacility(null);
    } else {
      setSelectedFacility(facilityId);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading energy data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Energy Management Dashboard</h1>
        <div className="time-controls">
          <button
            className={`time-preset-btn ${timeRangePreset === 'day' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange('day')}
          >
            Last 24 Hours
          </button>
          <button
            className={`time-preset-btn ${timeRangePreset === 'week' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange('week')}
          >
            Last Week
          </button>
          <button
            className={`time-preset-btn ${timeRangePreset === 'month' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange('month')}
          >
            Last Month
          </button>
        </div>
        <p className="subtitle">
          Showing data from {timeRange.start?.toLocaleString()} to {timeRange.end?.toLocaleString()}
        </p>
      </header>

      <div className="content">
        {!selectedFacility ? (
          <div className="chart-section">
            <h2>Global Energy Overview</h2>
            <GlobalChart
              timeseriesData={timeseriesData}
              facilities={facilities}
            />
          </div>
        ) : (
          <div className="chart-section">
            <button
              className="back-button"
              onClick={() => setSelectedFacility(null)}
            >
              ← Back to Global View
            </button>
            <FacilityChart
              facilityId={selectedFacility}
              timeseriesData={timeseriesData}
              facilities={facilities}
            />
          </div>
        )}

        <div className="legend-section">
          <h3>Facilities</h3>
          <FacilityLegend
            facilities={facilities}
            selectedFacility={selectedFacility}
            onFacilityClick={handleFacilityClick}
            timeseriesData={timeseriesData}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
