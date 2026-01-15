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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch facilities
      const facilitiesData = await fetchFacilities();
      setFacilities(facilitiesData);

      // Calculate time range (last 24 hours from now)
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
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
