import React from 'react';

interface PairwiseSliderProps {
  leftAttribute: string;
  rightAttribute: string;
  value: number;
  onChange: (value: number) => void;
}

const PairwiseSlider: React.FC<PairwiseSliderProps> = ({
  leftAttribute,
  rightAttribute,
  value,
  onChange
}) => {
  // Define importance labels with blue color scheme
  const getImportanceLabel = () => {
    switch (value) {
      case -5:
        return {
          left: "Much more important",
          right: "",
          leftColor: "text-blue-800 font-bold",
          rightColor: "text-gray-400"
        };
      case -3:
        return {
          left: "More important",
          right: "",
          leftColor: "text-blue-700 font-semibold",
          rightColor: "text-gray-400"
        };
      case -1:
        return {
          left: "Slightly more important",
          right: "",
          leftColor: "text-blue-600",
          rightColor: "text-gray-400"
        };
      case 1:
        return {
          left: "",
          right: "Slightly more important",
          leftColor: "text-gray-400",
          rightColor: "text-blue-600"
        };
      case 3:
        return {
          left: "",
          right: "More important",
          leftColor: "text-gray-400",
          rightColor: "text-blue-700 font-semibold"
        };
      case 5:
        return {
          left: "",
          right: "Much more important",
          leftColor: "text-gray-400",
          rightColor: "text-blue-800 font-bold"
        };
      default:
        return {
          left: "Slightly more important",
          right: "",
          leftColor: "text-blue-600",
          rightColor: "text-gray-400"
        };
    }
  };

  // Get current labels
  const labels = getImportanceLabel();

  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className="relative py-4">
      {/* Attribute names above slider */}
      <div className="flex justify-between text-sm mb-2">
        <div className="text-blue-700 font-medium">{leftAttribute}</div>
        <div className="text-blue-700 font-medium">{rightAttribute}</div>
      </div>
      
      {/* Simple HTML range input with marks */}
      <div className="relative">
        <input
          type="range"
          min="-5"
          max="5"
          step="2"
          value={value}
          onChange={handleChange}
          className="w-full h-8 appearance-none bg-transparent focus:outline-none"
          style={{ backgroundColor: 'transparent' }}
        />
        
        {/* Custom slider track with gradient */}
        <div className="absolute top-3 left-0 right-0 h-2 rounded-full -z-10 bg-gradient-to-r from-blue-600 via-gray-200 to-blue-600"></div>
        
        {/* Position indicators */}
        <div className="absolute top-1 left-0 right-0 flex justify-between -z-10">
          <div className={`h-6 w-6 rounded-full transition-all duration-200 ${value === -5 ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-gray-300'}`}></div>
          <div className={`h-6 w-6 rounded-full transition-all duration-200 ${value === -3 ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-gray-300'}`}></div>
          <div className={`h-6 w-6 rounded-full transition-all duration-200 ${value === -1 ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-gray-300'}`}></div>
          <div className={`h-6 w-6 rounded-full transition-all duration-200 ${value === 1 ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-gray-300'}`}></div>
          <div className={`h-6 w-6 rounded-full transition-all duration-200 ${value === 3 ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-gray-300'}`}></div>
          <div className={`h-6 w-6 rounded-full transition-all duration-200 ${value === 5 ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-gray-300'}`}></div>
        </div>
      </div>
      
      {/* Dynamic importance labels below slider */}
      <div className="flex justify-between text-sm mt-4">
        <div className={labels.leftColor}>{labels.left}</div>
        <div className={labels.rightColor}>{labels.right}</div>
      </div>
      
      {/* Add global styles to the document */}
      <style jsx global>{`
        /* Style the range input */
        input[type=range] {
          -webkit-appearance: none;
          margin: 0;
          width: 100%;
        }
        
        /* Style the thumb (handle) */
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          margin-top: -11px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease-in-out;
        }
        
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(37, 99, 235, 0.4);
        }
        
        input[type=range]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease-in-out;
        }
        
        input[type=range]::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(37, 99, 235, 0.4);
        }
        
        /* Remove the default track */
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 1px;
          cursor: pointer;
          background: transparent;
          border: none;
        }
        
        input[type=range]::-moz-range-track {
          width: 100%;
          height: 1px;
          cursor: pointer;
          background: transparent;
          border: none;
        }
        
        /* Fix Firefox issues */
        input[type=range]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default PairwiseSlider;