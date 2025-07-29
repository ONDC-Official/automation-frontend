export const weekDays = [
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
  { label: "Sunday", value: "7" },
];

export const domainOptions = [
  { label: "Grocery", value: "ONDC:RET10" },
  { label: "F&B", value: "ONDC:RET11" },
  { label: "Fashion", value: "ONDC:RET12" },
  { label: "BPC", value: "ONDC:RET13" },
  { label: "Electronics", value: "ONDC:RET14" },
  { label: "Appliances", value: "ONDC:RET15" },
  { label: "Home & Kitchen", value: "ONDC:RET16" },
  { label: "Health & Wellness", value: "ONDC:RET18" },
];

export const Types = [
  { label: "Order", value: "Order" },
  { label: "Delivery", value: "Delivery" },
  { label: "Self-Pickup", value: "Self-Pickup" },
  { label: "All ", value: "All" },
];

export const indianStates = [
  { label: "Andhra Pradesh", value: "andhra_pradesh" },
  { label: "Arunachal Pradesh", value: "arunachal_pradesh" },
  { label: "Assam", value: "assam" },
  { label: "Bihar", value: "bihar" },
  { label: "Chhattisgarh", value: "chhattisgarh" },
  { label: "Goa", value: "goa" },
  { label: "Gujarat", value: "gujarat" },
  { label: "Haryana", value: "haryana" },
  { label: "Himachal Pradesh", value: "himachal_pradesh" },
  { label: "Jharkhand", value: "jharkhand" },
  { label: "Karnataka", value: "karnataka" },
  { label: "Kerala", value: "kerala" },
  { label: "Madhya Pradesh", value: "madhya_pradesh" },
  { label: "Maharashtra", value: "maharashtra" },
  { label: "Manipur", value: "manipur" },
  { label: "Meghalaya", value: "meghalaya" },
  { label: "Mizoram", value: "mizoram" },
  { label: "Nagaland", value: "nagaland" },
  { label: "Odisha", value: "odisha" },
  { label: "Punjab", value: "punjab" },
  { label: "Rajasthan", value: "rajasthan" },
  { label: "Sikkim", value: "sikkim" },
  { label: "Tamil Nadu", value: "tamil_nadu" },
  { label: "Telangana", value: "telangana" },
  { label: "Tripura", value: "tripura" },
  { label: "Uttar Pradesh", value: "uttar_pradesh" },
  { label: "Uttarakhand", value: "uttarakhand" },
  { label: "West Bengal", value: "west_bengal" },
  { label: "Delhi", value: "delhi" },
  { label: "Jammu and Kashmir", value: "jammu_kashmir" },
  { label: "Ladakh", value: "ladakh" },
  { label: "Puducherry", value: "puducherry" },
];

export const serviceabilityOptions = [
  { label: "Hyperlocal (Radius-based)", value: "10" },
  // { label: "Intercity (Pincode-based)", value: "11" },
  { label: "PAN India", value: "12" },
  { label: "Polygon", value: "13" },
];

export const unitOptions = [
  { label: "Kilometers", value: "km" },
  { label: "Miles", value: "mi" },
];

type CategoryProtocolMapping = {
  category: string;
  brand?: string; // "O" means own brand; undefined means not applicable
  protocolKeys: string[];
};

const PACKAGED = "@ondc/org/statutory_reqs_packaged_commodities";
const PREPACKAGED = "@ondc/org/statutory_reqs_prepackaged_food";
const BOTH = [PREPACKAGED, PACKAGED];

export const countries = [{ label: "India", value: "IND" }];

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
