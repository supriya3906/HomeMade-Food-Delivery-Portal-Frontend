import React, { useState } from 'react';
import DishImage from './DishImage';

// Shows the dish photo if one is set (food.photo), otherwise the built-in
// illustration. Also falls back to the illustration if a photo fails to load.
const FoodImage = ({ food, variant = 'card', className = '' }) => {
  const [broken, setBroken] = useState(false);
  return (
    <div className={`food-img food-img-${variant} ${className}`}>
      {food.photo && !broken ? (
        <img src={food.photo} alt={food.name} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <DishImage food={food} />
      )}
    </div>
  );
};

export default FoodImage;
