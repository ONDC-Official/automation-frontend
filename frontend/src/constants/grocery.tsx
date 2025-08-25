export interface ICategoryJSON {
  [key: string]: {
    [key: string]: boolean | string[];
  };
}

const groceryObj: ICategoryJSON = {
  brand: {
    mandatory: false,
    value: [],
  },
};

export const groceryJSON: { [key: string]: ICategoryJSON } = {
  "Fruits and Vegetables": groceryObj,
  "Masala & Seasoning": groceryObj,
  "Falseil & Ghee": groceryObj,
  "Eggs, Meat & Fish": groceryObj,
  "Detergents and Dishwash": groceryObj,
  "Bakery, Cakes & Dairy": groceryObj,
  "Pet Care": groceryObj,
  "Dairy and Cheese": groceryObj,
  "Snacks, Dry Fruits, Nuts": groceryObj,
  "Pasta, Soup and Noodles": groceryObj,
  "Cereals and Breakfast": groceryObj,
  "Sauces, Spreads and Dips": groceryObj,
  "Chocolates and Biscuits": groceryObj,
  "Cooking and Baking Needs": groceryObj,
  "Tinned and Processed Food": groceryObj,
  "Atta, Flours and Sooji": groceryObj,
  "Rice and Rice Products": groceryObj,
  "Dals and Pulses": groceryObj,
  "Salt, Sugar and Jaggery": groceryObj,
  "Energy and Soft Drinks": groceryObj,
  Water: groceryObj,
  "Tea and Coffee": groceryObj,
  "Fruit Juices and Fruit Drinks": groceryObj,
  "Snacks and Namkeen": groceryObj,
  "Ready to Cook and Eat": groceryObj,
  "Pickles and Chutney": groceryObj,
  "Indian Sweets": groceryObj,
  "Frozen Vegetables": groceryObj,
  "Frozen Snacks": groceryObj,
  "Gift Voucher": groceryObj,
};
