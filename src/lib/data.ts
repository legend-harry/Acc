import type { Transaction, BudgetSummary } from '@/types';

const rawData = `Date	Invoice No	G/L Code	Title	Amount	Qty 	unit 	Rate /Unit	Vendor	Description	Notes
2025-09-08	Nil	5001-Miscellaneous Expenses	Miscellaneous Expenses	₹90,000	1	AU		Multiple 	for Clearing the weed , Errecting the coconut plants 	Spent by Mom on our behalf 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹45,200	20	EA	₹45,180	Vijay Lakshmi Engineering 	5' Supreme C Singe Pipes	Bore - Materials 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹37,000	1	EA	₹37,000	Vijay Lakshmi Engineering 	5HP Pump Set 	Bore - Materials 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹2,150	65	M	₹33	Vijay Lakshmi Engineering 	L&T Starter 9-14A	Bore - Materials 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹7,150	60	M	₹119	Vijay Lakshmi Engineering 	2.5 Sqmm 3 core flat cable 	Bore - Materials 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹17,400	60	M	₹290	Vijay Lakshmi Engineering 	75mm supreme 8 kg hdpe Pipe 	Bore - Materials 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹2,000	2	EA	₹1,000	Vijay Lakshmi Engineering 	75mm Hdhpe ss nipple 	Bore - Materials 
7/25/25	VLG455/25	5002-Bore Construction	Bore Construction	₹550	2	EA	₹275	Vijay Lakshmi Engineering 	75mm Iron Clamps	Bore - Materials 
7/25/25	Nil	5002-Bore Construction	Bore Construction	₹1,000	1	Au	₹1,000	Auto 	Transport of Pump, Pipes 	Bore - Services 
7/27/25	Nil	5002-Bore Construction	Bore Construction	₹22,000	200	FT	₹110	Lakshmi Bore Works - Ravulapalem 	Drilling Bore - 6" Bore @ 200 Feet @110/Foot 	Bore - Services 
7/27/25	Nil	5002-Bore Construction	Bore Construction	₹5,250	35	Bags 	₹150	Lakshmi Bore Works - Ravulapalem 	Round Pebbles @150/Bag 	Bore - Services 
7/27/25	Nil	5002-Bore Construction	Bore Construction	₹900	1	LS	₹900	Lakshmi Bore Works - Ravulapalem 	Labour Cost for Unloading Material	Bore - Services 
8/30/25	Nil	5003-Road Work 	Road Work 	₹20,200	1	LS	₹20,200	JCB Vendor 	JCB 5.10 hrs @ 1200 , Tractor 4 Trips @ 3500, Diesel , Beta	Road Work - Services 
8/30/25	Nil	5003-Road Work 	Road Work 	₹30,000	3	EA	₹10,000	Quarry 	Gravel Boulders 3 Trucks @10,000 / Truck 	Road Work - Materials 
8/31/25	Nil	5003-Road Work 	Road Work 	₹12,800	1	EA	₹12,800	Quarry 	Gravel Dust 1 Trucks @13,000 / Truck 	Road Work - Materials 
8/31/25	Nil	5003-Road Work 	Road Work 	₹800	4	EA	₹200	Truck Driver 	200/Truck Driver Beta 	Road Work - Service  
8/31/25	Nil	5003-Road Work 	Road Work 	₹2,000	2	EA	₹1,000	Labour 	Labour Cost for Laying the Road 	Road Work - Service  
8/27/25	Nil	5002-Bore Construction	Bore Construction	₹3,000	1	LS	₹3,000	Abid Ali	Bore Digging Equipment Transporter 	Bore - Services 
8/29/25	Nil	5002-Bore Construction	Bore Construction	₹1,200	1	LS	₹1,200	Abid Ali	Pipe Extraction Equipment Transporter 	Bore - Services 
8/27/25	Nil	5002-Bore Construction	Bore Construction	₹500	1	LS	₹500	Abid Ali	Advance Payment 	Bore - Services 
8/28/25	Nil	5002-Bore Construction	Bore Construction	₹5,000	1	LS	₹5,000	Abid Ali	Advance Payment 	Bore - Services 
9/6/25	Nil	5002-Bore Construction	Bore Construction	₹5,000	1	LS	₹5,000	Abid Ali	Advance Payment 	Bore - Services 
8/29/25	Nil	5012-Tress Cutting 	Tree Cutting	₹6,500	1	LS	₹6,500	Tree Cuttter @500/ tree 	Cutting Coconut trees 	Tree Cutting - Services 
8/27/25	Nil	5014-IT Setup	IT Setup	₹8,500	1	LS	₹8,500	Godrej	Godrej Solar Camera 	IT-Infra - Materials
8/27/25	Nil	5014-IT Setup	IT Setup	₹1,000	1	LS	₹1,000	Welding 	Godrej Solar Camera 	IT-Infra - Materials
9/6/25	Nil	5002-Bore Construction	Bore Construction	₹8,000	8	LS	₹1,000	HPCL Petrol pump	Diesel for Bore Drilling (8 days)	Bore - Services 
9/8/25	Nil	5002-Bore Construction	Bore Construction	₹44,800	25	EA	₹1,792	M/s Srinivasea Mill	Pipes 	Bore - Materials 
9/8/25	Nil	5002-Bore Construction	Bore Construction	₹10,000	3	EA	₹3,333	M/s Srinivasea Mill	Pipes 	Bore - Materials 
9/8/25	Nil	5002-Bore Construction	Bore Construction	₹700	1	LS	₹700	Venkateswara Rao	Transport of Pump, Pipes from Palakol to Agarru	Bore - Services 
8/29/25	Nil	5013-Labour 	Labour 	₹25,200	42	Days	₹600	Rambabu Salary 42 days till 31st October	Salary	Labour
9/6/25	Nil	5004-Weed Removal	Weed Removal	₹1,100	1	LS	₹1,100	Weedremoval	Spray Weed revoer + labour + Spray Can Rent 	Labour`;

export const budgets: BudgetSummary[] = [
    { glCode: '5001', category: 'Misc', budget: 100000 },
    { glCode: '5002', category: 'Bore', budget: 60000 },
    { glCode: '5003', category: 'Road', budget: 0 },
    { glCode: '5004', category: 'Weed Removal', budget: 0 },
    { glCode: '5005', category: 'LT Connection', budget: 500000 },
    { glCode: '5006', category: 'Electrical', budget: 100000 },
    { glCode: '5007', category: 'Pond Prep', budget: 0 },
    { glCode: '5008', category: 'Seed', budget: 0 },
    { glCode: '5009', category: 'Feed', budget: 0 },
    { glCode: '5010', category: 'Transport', budget: 0 },
    { glCode: '5011', category: 'Lab/Testing', budget: 0 },
    { glCode: '5012', category: 'Tree Cutting', budget: 5000 },
    { glCode: '5013', category: 'Labour', budget: 0 },
    { glCode: '5014', category: 'IT Setup', budget: 8000 },
];

const parseAmount = (amount: string) => parseFloat(amount.replace('₹', '').replace(/,/g, '')) || 0;

const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[/\\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) { // YYYY-MM-DD
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else { // MM/DD/YY
        const year = parseInt(parts[2]);
        return new Date((year < 30 ? 2000 : 1900) + year, parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
    }
    return new Date();
  };

const lines = rawData.trim().split('\n').slice(1);

const categoryMapping: Record<string, string> = {
    'Miscellaneous Expenses': 'Misc',
    'Bore Construction': 'Bore',
    'Road Work': 'Road',
    'Weed Removal': 'Weed Removal',
    'Tress Cutting': 'Tree Cutting',
    'IT Setup': 'IT Setup',
    'Labour': 'Labour'
};

export const transactions: Transaction[] = lines.map((line, index) => {
    const columns = line.split('\t').map(c => c.trim());
    
    const title = columns[3] || 'Untitled';
    const category = categoryMapping[title] || title;

    return {
        id: `txn_${index + 1}`,
        date: parseDate(columns[0]),
        invoiceNo: columns[1],
        glCode: columns[2],
        title: title,
        amount: parseAmount(columns[4]),
        quantity: parseFloat(columns[5]) || 0,
        unit: columns[6],
        ratePerUnit: parseAmount(columns[7]),
        vendor: columns[8],
        description: columns[9],
        notes: columns[10],
        category: category,
    };
});

export const categories = [...new Set(budgets.map(b => b.category))];

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
