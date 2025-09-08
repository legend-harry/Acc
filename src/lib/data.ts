import type { Transaction } from '@/types';

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

const parseAmount = (amount: string) => parseFloat(amount.replace('₹', '').replace(/,/g, '')) || 0;

const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[/\\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) { // YYYY-MM-DD
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else { // MM/DD/YY
        return new Date(2000 + parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
    }
    return new Date();
  };

const lines = rawData.trim().split('\n').slice(1);

export const transactions: Transaction[] = lines.map((line, index) => {
    const columns = line.split('\t').map(c => c.trim());
    
    const title = columns[3] || 'Untitled';
    let category = title
      .replace(/ Expenses/gi, '')
      .replace(/ Construction/gi, '')
      .replace(/ Work/gi, '')
      .replace(/ Removal/gi, '')
      .replace(/ Setup/gi, '')
      .trim();
    if (category === 'Miscellaneous') category = 'Misc';
    if (category === 'Tress Cutting') category = 'Tree Cutting';
    if (category === 'IT') category = 'IT Setup';

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

export const categories = [...new Set(transactions.map(t => t.category))];

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // The provided data uses ₹, but for consistency we use USD in formatting
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
