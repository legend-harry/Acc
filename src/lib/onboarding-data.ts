import {
    Wheat,
    Apple,
    Beef,
    Bird,
    Sprout,
    Waves,
    Bug
} from "lucide-react";

export type FarmType = {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    presetCategories: string[];
};

export const FARM_TYPES: FarmType[] = [
    {
        id: "arable",
        title: "Arable & Row Crop Farming",
        description: "Cultivation of large-scale crops like wheat, corn, soybeans, cotton, and rice.",
        icon: Wheat,
        presetCategories: [
            "Seeds / Traits",
            "Synthetic Fertilizers (NPK)",
            "Soil Amendments (Lime/Gypsum)",
            "Agrochemicals (Herbicides/Pesticides)",
            "Machinery Fuel (Diesel)",
            "Tractor / Combine Maintenance",
            "Custom Applicator Fees",
            "Irrigation Water Pumping",
            "Grain Drying (Propane/Gas)",
            "Storage / Silo Maintenance",
            "Grain Elevator Transport Freight",
            "Seasonal Operators Labor",
            "Land Lease / Mortgages",
            "Crop Yield Insurance"
        ]
    },
    {
        id: "horticulture",
        title: "Horticulture & Orchards",
        description: "Cultivation of fruits, vegetables, nuts, flowers, and nursery plants.",
        icon: Apple,
        presetCategories: [
            "Saplings / Rootstock",
            "Specialty Seeds",
            "Targeted Micronutrients",
            "Pollinator Rentals (Beehives)",
            "Trellising & Stakes",
            "Bird Netting / Shade Cloth",
            "Micro-Drip Irrigation Systems",
            "Pruning & Hand-Harvest Labor",
            "H-2A Visa Admin & Labor",
            "Washing Station Utilities",
            "Food-grade Packaging",
            "Cold-Storage Electricity"
        ]
    },
    {
        id: "ruminants",
        title: "Ruminants Husbandry",
        description: "Raising hoofed animals for meat, milk, or wool (Beef, Dairy, Sheep, Goats).",
        icon: Beef,
        presetCategories: [
            "Breeding Stock & Genetics",
            "Stud Fees & AI",
            "Pasture Seed / Fertilizer",
            "Bulk Hay / Alfalfa / Silage",
            "Supplemental Mineral Blocks",
            "Routine Vet Care & Vaccines",
            "Hoof Trimming / Shearing Labor",
            "Milking Parlor Sanitizers / Parts",
            "Milk Cooling Electricity",
            "Milk Hauling Fees",
            "Fencing & Infrastructure",
            "Livestock Trailers",
            "Barn Bedding (Straw/Sand)",
            "Manure Management Systems"
        ]
    },
    {
        id: "monogastrics",
        title: "Poultry & Swine",
        description: "Intensive rearing of birds (layers/broilers) and pigs.",
        icon: Bird,
        presetCategories: [
            "Flock / Herd Replacements",
            "High-Protein Feed Rations",
            "Grit & Feeder Maintenance",
            "Brooder Heating (Propane)",
            "Ventilation / Fan Electricity",
            "Bulk Wood Shavings / Litter",
            "Mass Waterline Vaccines",
            "Disinfectants & Boot Washes",
            "Pest / Rodent Control",
            "Egg-Washing / Processing Chemicals",
            "Cartons & Packaging",
            "Slaughterhouse Transport Fees"
        ]
    },
    {
        id: "cea",
        title: "CEA & Hydroponics",
        description: "Indoor farming, vertical farms, and high-tech greenhouses.",
        icon: Sprout,
        presetCategories: [
            "Specialized Pelleted Seeds",
            "Growing Media (Coir/Rockwool/Peat)",
            "Liquid Nutrient Salts (A/B)",
            "LED Lighting Arrays Energy",
            "HVAC / Dehumidification Electricity",
            "12/P Municipal Water Usage",
            "Sensors (pH, EC, Temp)",
            "Automated Dosing Systems",
            "Grow Trays & Plumbing Supplies",
            "CO2 Enrichment Tanks",
            "Greenhouse Technicians Labor",
            "Daily Harvesting / Packing",
            "Facility Sanitation Supplies"
        ]
    },
    {
        id: "aquaculture",
        title: "Aquaculture",
        description: "Cultivation of aquatic organisms like fish, shrimp, and seafood.",
        icon: Waves,
        presetCategories: [
            "Fingerlings / Fry / Spat",
            "High-Protein Pelleted Feed",
            "Live Feed Cultures (Algae/Rotifers)",
            "Aeration Pump Electricity",
            "Water Quality Testing Kits",
            "Bio-filter Media & UV Scrubber",
            "Submersible Cages / Tanks",
            "Anti-Predator Netting",
            "Specialized Harvesting Pumps",
            "Flake Ice Machines",
            "Insulated Shipping Totes",
            "Expedited Cold-Chain Freight"
        ]
    },
    {
        id: "apiculture",
        title: "Apiculture (Beekeeping)",
        description: "Raising bees for honey production, wax, and pollination services.",
        icon: Bug,
        presetCategories: [
            "Packaged Bees & Mated Queens",
            "Supplemental Winter Feed (Fondant/Syrup)",
            "Pollen Patties",
            "Hive Boxes (Supers/Brood Chambers)",
            "Wooden Frames & Wax Foundations",
            "Varroa Mite / Foulbrood Treatments",
            "Extraction Equipment Maintenance",
            "Food-Grade Buckets & Bottling",
            "Protective Suits / Smokers",
            "Pollination Transport Fuel"
        ]
    }
];

export const BUSINESS_CATEGORIES = [
    "Payroll & Benefits",
    "Office Supplies",
    "Software Subscriptions (SaaS)",
    "Rent / Lease Agreements",
    "Utilities & Internet",
    "Marketing & Advertising",
    "Legal & Accounting Fees",
    "Travel & Entertainment",
    "Insurance Premiums"
];
