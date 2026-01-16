import { useMemo } from 'react';
import './FacilityLegend.css';

const getFacilityColor = (type) => {
  switch (type) {
    case 'producer':
      return '#4caf50';
    case 'consumer':
      return '#f44336';
    case 'accumulator':
      return '#2196f3';
    default:
      return '#999';
  }
};

const getFacilityIcon = (type) => {
  switch (type) {
    case 'producer':
      return '⚡';
    case 'consumer':
      return '🏭';
    case 'accumulator':
      return '🔋';
    default:
      return '●';
  }
};

function FacilityLegend({ facilities, selectedFacility, onFacilityClick, timeseriesData }) {
  const facilitiesWithStats = useMemo(() => {
    return facilities.map(facility => {
      const facilityData = timeseriesData.filter(d => d.facility_id === facility.id);
      const avgPower = facilityData.length > 0
        ? facilityData.reduce((sum, d) => sum + parseFloat(d.power_value), 0) / facilityData.length
        : 0;

      // Calculate charge percentage for accumulators
      let chargePercentage = null;
      if (facility.type === 'accumulator' && facility.metadata?.capacity_kwh) {
        const currentCharge = parseFloat(facility.current_charge_kwh || 0);
        const capacity = parseFloat(facility.metadata.capacity_kwh);
        chargePercentage = Math.max(0, Math.min(100, (currentCharge / capacity) * 100));
      }

      return {
        ...facility,
        avgPower: Math.round(avgPower * 100) / 100,
        chargePercentage
      };
    });
  }, [facilities, timeseriesData]);

  return (
    <div className="facility-legend">
      {facilitiesWithStats.map((facility) => (
        <div
          key={facility.id}
          className={`facility-item ${selectedFacility === facility.id ? 'selected' : ''}`}
          onClick={() => onFacilityClick(facility.id)}
        >
          <div className="facility-header">
            <span
              className="facility-icon"
              style={{ color: getFacilityColor(facility.type) }}
            >
              {getFacilityIcon(facility.type)}
            </span>
            <span className="facility-name">{facility.name}</span>
          </div>
          <div className="facility-details">
            <span className="facility-type">{facility.type}</span>
            <span className="facility-power">
              {facility.avgPower > 0 ? '+' : ''}{facility.avgPower} kW
            </span>
          </div>
          {facility.chargePercentage !== null && (
            <div className="facility-charge">
              <div className="charge-bar-container">
                <div
                  className="charge-bar-fill"
                  style={{
                    width: `${facility.chargePercentage}%`,
                    backgroundColor: getFacilityColor(facility.type)
                  }}
                />
              </div>
              <span className="charge-text">
                {facility.chargePercentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default FacilityLegend;
