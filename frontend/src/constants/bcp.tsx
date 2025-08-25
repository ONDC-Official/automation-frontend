export interface ICategoryJSON {
  [key: string]: {
    [key: string]: boolean | string[];
  };
}

const BPCObj: ICategoryJSON = {
  brand: {
    mandatory: true,
    value: [],
  },
  colour: {
    mandatory: false,
    value: [],
  },
  colour_Name: {
    mandatory: false,
    value: [],
  },
  gender: {
    mandatory: false,
    value: [],
  },
  concern: {
    mandatory: false,
    value: [],
  },
  ingredient: {
    mandatory: false,
    value: [],
  },
  conscious: {
    mandatory: false,
    value: [],
  },
  preference: {
    mandatory: false,
    value: [],
  },
  formulation: {
    mandatory: false,
    value: [],
  },
  skin_type: {
    mandatory: false,
    value: [],
  },

};


export const BPCJSON: { [key: string]: ICategoryJSON } = {
  Fragrance: BPCObj,
  "Bath Soaps and Gels": BPCObj,
  "Hair Oils, Care, and Styling": BPCObj,
  "Shampoos and Conditioners": BPCObj,
  "Shaving and Grooming": BPCObj,
  "Beard Care and Tools": BPCObj,
  "Grooming Tools and Accessories": BPCObj,
  "Makeup - Nail Care": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
  },
  "Makeup - Eyes": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
  },
  "Makeup - Face": BPCObj,
  "Makeup - Lips": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
  },
  "Makeup - Body": BPCObj,
  "Makeup - Remover": BPCObj,
  "Makeup - Sets and Kits": BPCObj,
  "Makeup - Tools and Brushes": BPCObj,
  "Makeup - Kits and Combos": BPCObj,
  "Skin Care - Face Cleansers": BPCObj,
  "Skin Care - Hand and Feet": BPCObj,
  "Body Care - Cleansers": BPCObj,
  "Body Care - Moisturizers": BPCObj,
  "Body Care - Loofah and Other Tools": BPCObj,
  "Body Care - Bath Salt and Additives": BPCObj,
  "Hair Care - Shampoo, Oils, Conditioners": BPCObj,
  "Skin Care - Lotions, Moisturisers, and Creams": BPCObj,
  "Skin Care - Oils and Serums": BPCObj,
  Trimmer: BPCObj,
  Shaver: BPCObj,
  Epilator: BPCObj,
  "Hair Straightener": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
    model: {
      mandatory: true,
      value: [],
    },
    special_feature: {
      mandatory: true,
      value: [],
    },
    includes: {
      mandatory: true,
      value: [],
    },
    weight: {
      mandatory: true,
      value: [],
    },
    length: {
      mandatory: true,
      value: [],
    },
    breadth: {
      mandatory: true,
      value: [],
    },
    height: {
      mandatory: true,
      value: [],
    },
    battery: {
      mandatory: false,
      value: [],
    },
    power_input: {
      mandatory: false,
      value: [],
    },
    warranty: {
      mandatory: false,
      value: [],
    },
    wattage: {
      mandatory: false,
      value: [],
    },
    voltage: {
      mandatory: false,
      value: [],
    },
  },
  "Hair Dryer": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
    model: {
      mandatory: true,
      value: [],
    },
    special_feature: {
      mandatory: true,
      value: [],
    },
    includes: {
      mandatory: true,
      value: [],
    },
    weight: {
      mandatory: true,
      value: [],
    },
    length: {
      mandatory: true,
      value: [],
    },
    breadth: {
      mandatory: true,
      value: [],
    },
    height: {
      mandatory: true,
      value: [],
    },
    battery: {
      mandatory: false,
      value: [],
    },
    power_input: {
      mandatory: false,
      value: [],
    },
    warranty: {
      mandatory: false,
      value: [],
    },
    wattage: {
      mandatory: false,
      value: [],
    },
    voltage: {
      mandatory: false,
      value: [],
    },
  },
  "Hair Curler": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
    model: {
      mandatory: true,
      value: [],
    },
    special_feature: {
      mandatory: true,
      value: [],
    },
    includes: {
      mandatory: true,
      value: [],
    },
    weight: {
      mandatory: true,
      value: [],
    },
    length: {
      mandatory: true,
      value: [],
    },
    breadth: {
      mandatory: true,
      value: [],
    },
    height: {
      mandatory: true,
      value: [],
    },
    battery: {
      mandatory: false,
      value: [],
    },
    power_input: {
      mandatory: false,
      value: [],
    },
    warranty: {
      mandatory: false,
      value: [],
    },
    wattage: {
      mandatory: false,
      value: [],
    },
    voltage: {
      mandatory: false,
      value: [],
    },
  },
  "Hair Crimper": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
    model: {
      mandatory: true,
      value: [],
    },
    special_feature: {
      mandatory: true,
      value: [],
    },
    includes: {
      mandatory: true,
      value: [],
    },
    weight: {
      mandatory: true,
      value: [],
    },
    length: {
      mandatory: true,
      value: [],
    },
    breadth: {
      mandatory: true,
      value: [],
    },
    height: {
      mandatory: true,
      value: [],
    },
    battery: {
      mandatory: false,
      value: [],
    },
    power_input: {
      mandatory: false,
      value: [],
    },
    warranty: {
      mandatory: false,
      value: [],
    },
    wattage: {
      mandatory: false,
      value: [],
    },
    voltage: {
      mandatory: false,
      value: [],
    },
  },
  "Hair Care - Colour": {
    brand: {
      mandatory: true,
      value: [],
    },
    colour: {
      mandatory: true,
      value: [],
    },
    colour_Name: {
      mandatory: true,
      value: [],
    },
    gender: {
      mandatory: false,
      value: [],
    },
    concern: {
      mandatory: false,
      value: [],
    },
    ingredient: {
      mandatory: false,
      value: [],
    },
    conscious: {
      mandatory: false,
      value: [],
    },
    preference: {
      mandatory: false,
      value: [],
    },
    formulation: {
      mandatory: false,
      value: [],
    },
    skin_type: {
      mandatory: false,
      value: [],
    },
  },
};
