import React from 'react';

const Loader = ({ 
  fullScreen = false, 
  size = "h-10 w-10", 
  color = "border-blue-600",
  text = "" 
}) => {
  const containerClasses = fullScreen 
    ? "flex flex-col justify-center items-center h-screen bg-slate-50 gap-4" 
    : "flex flex-col justify-center items-center p-4 gap-2";

  return (
    <div className={containerClasses}>
      <div 
        className={`animate-spin rounded-full ${size} border-b-2 ${color}`}
      ></div>
      {text && <p className="text-slate-600 animate-pulse">{text}</p>}
    </div>
  );
};

export default Loader;