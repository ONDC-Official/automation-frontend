const homeObj = {
    brand: {
        mandatory: true,
        value: [],
    },
    colour: {
        mandatory: true,
        value: "/^#([a-fA-F0-9]{6})/",
    },
    colour_name: {
        mandatory: true,
        value: [],
    },
    material: {
        mandatory: true,
        value: [],
    },
    size: {
        mandatory: false,
        value: [],
    },
    weight: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,3})?$/",
    },
    length: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,2})?$/",
    },
    breadth: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,2})?$/",
    },
    height: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,2})?$/",
    },
    model: {
        mandatory: false,
        value: [],
    },
    assembly_required: {
        mandatory: false,
        value: [],
    },
    care_instructions: {
        mandatory: false,
        value: [],
    },
    special_features: {
        mandatory: false,
        value: [],
    },
};
const homeObj_colour_not_mandatory = {
    brand: {
        mandatory: true,
        value: [],
    },
    colour: {
        mandatory: false,
        value: "/^#([a-fA-F0-9]{6})/",
    },
    colour_name: {
        mandatory: false,
        value: [],
    },
    material: {
        mandatory: true,
        value: [],
    },
    size: {
        mandatory: false,
        value: [],
    },
    weight: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,3})?$/",
    },
    length: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,2})?$/",
    },
    breadth: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,2})?$/",
    },
    height: {
        mandatory: false,
        value: "/^[0-9]+(.[0-9]{1,2})?$/",
    },
    model: {
        mandatory: false,
        value: [],
    },
    assembly_required: {
        mandatory: false,
        value: [],
    },
    care_instructions: {
        mandatory: false,
        value: [],
    },
    special_features: {
        mandatory: false,
        value: [],
    },
};

export const homeJSON = {
    "Home Decor": homeObj,
    Furniture: homeObj,
    "Home Furnishing - Bedding and Linen": homeObj,
    "Cleaning Supplies": homeObj,
    Electricals: homeObj,
    "Bathroom and Kitchen fixtures": homeObj,
    "Garden & Outdoor": homeObj,
    "Sports and Fitness Equipment": homeObj,
    Cookware: homeObj,
    Serveware: homeObj,
    "Kitchen Storage and Containers": homeObj,
    "Kitchen Tools": homeObj,
    "Closet/Laundry/Shoe Organization": homeObj,
    "Toys and Games": homeObj,
    Stationery: homeObj,
    "Gift Voucher": {},
    "Disposables and Garbage Bags": homeObj,
    "Fresheners and Repellents": homeObj_colour_not_mandatory,
    "Mops, Brushes and Scrubs": homeObj_colour_not_mandatory,
    "Party and Festive Needs": homeObj_colour_not_mandatory,
    Flowers: homeObj,
    "Pooja Needs": homeObj_colour_not_mandatory,
    "Car and Shoe Care": homeObj_colour_not_mandatory,
};
