export const weekDays = [
  { key: "Monday", value: "1" },
  { key: "Tuesday", value: "2" },
  { key: "Wednesday", value: "3" },
  { key: "Thursday", value: "4" },
  { key: "Friday", value: "5" },
  { key: "Saturday", value: "6" },
  { key: "Sunday", value: "7" },
];

export const domainOptions = [
  { key: "Grocery", value: "ONDC:RET10" },
  { key: "F&B", value: "ONDC:RET11" },
  { key: "Fashion", value: "ONDC:RET12" },
  { key: "BPC", value: "ONDC:RET13" },
  { key: "Electronics", value: "ONDC:RET14" },
  { key: "Appliances", value: "ONDC:RET15" },
  { key: "Home & Kitchen", value: "ONDC:RET16" },
  { key: "Health & Wellness", value: "ONDC:RET18" },
];

export const Types = [
  { key: "Order", value: "Order" },
  { key: "Delivery", value: "Delivery" },
  { key: "Self-Pickup", value: "Self-Pickup" },
  { key: "All ", value: "All" },
];

export const indianStates = [
  { key: "Andhra Pradesh", value: "Andhra Pradesh" },
  { key: "Arunachal Pradesh", value: "Arunachal Pradesh" },
  { key: "Assam", value: "Assam" },
  { key: "Bihar", value: "Bihar" },
  { key: "Chattisgarh", value: "Chattisgarh" },
  { key: "Delhi", value: "Delhi" },
  { key: "Goa", value: "Goa" },
  { key: "Gujarat", value: "Gujarat" },
  { key: "Haryana", value: "Haryana" },
  { key: "Himachal Pradesh", value: "Himachal Pradesh" },
  { key: "Jammu and Kashmir", value: "Jammu and Kashmir" },
  { key: "Jharkhand", value: "Jharkhand" },
  { key: "Karnataka", value: "Karnataka" },
  { key: "Kerala", value: "Kerala" },
  { key: "Lakshadweep Islands", value: "Lakshadweep Islands" },
  { key: "Madhya Pradesh", value: "Madhya Pradesh" },
  { key: "Maharashtra", value: "Maharashtra" },
  { key: "Manipur", value: "Manipur" },
  { key: "Meghalaya", value: "Meghalaya" },
  { key: "Mizoram", value: "Mizoram" },
  { key: "Nagaland", value: "Nagaland" },
  { key: "Odisha", value: "Odisha" },
  { key: "Pondicherry", value: "Pondicherry" },
  { key: "Punjab", value: "Punjab" },
  { key: "Rajasthan", value: "Rajasthan" },
  { key: "Sikkim", value: "Sikkim" },
  { key: "Tamil Nadu", value: "Tamil Nadu" },
  { key: "Telangana", value: "Telangana" },
  { key: "Tripura", value: "Tripura" },
  { key: "Uttar Pradesh", value: "Uttar Pradesh" },
  { key: "Uttarakhand", value: "Uttarakhand" },
  { key: "West Bengal", value: "West Bengal" },
  { key: "Andaman and Nicobar Islands", value: "Andaman and Nicobar Islands" },
  { key: "Chandigarh", value: "Chandigarh" },
  {
    key: "Dadra & Nagar Haveli and Daman & Diu",
    value: "Dadra & Nagar Haveli and Daman & Diu",
  },
  { key: "Ladakh", value: "Ladakh" },
  { key: "Other Territory", value: "Other Territory" },
];

export const serviceabilityOptions = [
  { key: "Hyperlocal (Radius-based)", value: "10" },
  // { key: "Intercity (Pincode-based)", value: "11" },
  { key: "PAN India", value: "12" },
  { key: "Polygon", value: "13" },
];

export const unitOptions = [
  { key: "Kilometers", value: "km" },
  { key: "Miles", value: "mi" },
];

type CategoryProtocolMapping = {
  category: string;
  brand?: string; // "O" means own brand; undefined means not applicable
  protocolKeys: string[];
};

const PACKAGED = "@ondc/org/statutory_reqs_packaged_commodities";
const PREPACKAGED = "@ondc/org/statutory_reqs_prepackaged_food";
const BOTH = [PREPACKAGED, PACKAGED];

export const countries = [{ key: "India", value: "IND" }];

export const categoryProtocolMappings: CategoryProtocolMapping[] = [
  { category: "Fruits and Vegetables", protocolKeys: [] },
  { category: "Masala & Seasoning", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Oil & Ghee", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Eggs, Meat & Fish", protocolKeys: [PACKAGED] },
  { category: "Cleaning & Household", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Bakery, Cakes & Dairy", brand: "O", protocolKeys: BOTH },
  { category: "Pet Care", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Stationery", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Detergents and Dishwash", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Dairy and Cheese", brand: "O", protocolKeys: BOTH },
  { category: "Snacks, Dry Fruits, Nuts", brand: "O", protocolKeys: BOTH },
  { category: "Pasta, Soup and Noodles", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Cereals and Breakfast", brand: "O", protocolKeys: BOTH },
  { category: "Sauces, Spreads and Dips", brand: "O", protocolKeys: BOTH },
  { category: "Chocolates and Biscuits", brand: "O", protocolKeys: BOTH },
  {
    category: "Cooking and Baking Needs",
    brand: "O",
    protocolKeys: [PACKAGED],
  },
  { category: "Tinned and Processed Food", brand: "O", protocolKeys: BOTH },
  { category: "Atta, Flours and Sooji", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Rice and Rice Products", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Dals and Pulses", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Salt, Sugar and Jaggery", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Energy and Soft Drinks", brand: "O", protocolKeys: BOTH },
  { category: "Water", brand: "O", protocolKeys: [] },
  { category: "Tea and Coffee", brand: "O", protocolKeys: [PACKAGED] },
  { category: "Fruit Juices and Fruit Drinks", brand: "O", protocolKeys: BOTH },
  { category: "Snacks and Namkeen", brand: "O", protocolKeys: BOTH },
  { category: "Ready to Cook and Eat", brand: "O", protocolKeys: BOTH },
  { category: "Pickles and Chutney", brand: "O", protocolKeys: BOTH },
  { category: "Indian Sweets", brand: "O", protocolKeys: BOTH },
  { category: "Frozen Vegetables", brand: "O", protocolKeys: [] },
  { category: "Frozen Snacks", brand: "O", protocolKeys: BOTH },
  { category: "Gift Voucher", brand: "O", protocolKeys: [] },
];
