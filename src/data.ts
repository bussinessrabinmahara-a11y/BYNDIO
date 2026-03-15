import { Product } from './store';

export const PRODUCTS: Product[] = [
  {id:1,name:'Floral Kurti Set',brand:'EthnicWear',cat:'Fashion',price:899,mrp:1799,icon:'👗',rating:4.8,reviews:3241,inf:true,creator:'@StyleByRiya',specs:[['Material','Cotton Blend'],['Sizes','XS–3XL'],['Wash','Machine Wash'],['Origin','Made in India']]},
  {id:2,name:'Wireless Earbuds Pro',brand:'SoundMax',cat:'Electronics',price:1299,mrp:2499,icon:'🎧',rating:4.3,reviews:1820,inf:false,specs:[['Driver','13mm Dynamic'],['Battery','30hr total'],['Connectivity','Bluetooth 5.3'],['Water','IPX5']]},
  {id:3,name:'Vitamin C Face Wash',brand:'GlowCare',cat:'Beauty',price:349,mrp:699,icon:'🧴',rating:4.6,reviews:5670,inf:true,creator:'@GlowWithNisha',specs:[['Volume','100ml'],['Skin Type','All skin types'],['Key Ingredient','Vitamin C, Niacinamide'],['Paraben Free','Yes']]},
  {id:4,name:'Running Sport Sneakers',brand:'FlexStep',cat:'Fashion',price:1499,mrp:2999,icon:'👟',rating:4.4,reviews:2103,inf:false,specs:[['Sole','EVA Foam'],['Upper','Mesh'],['Sizes','UK 6–12'],['Weight','280g/pair']]},
  {id:5,name:'Smart Watch Series 5',brand:'TechWrist',cat:'Electronics',price:2299,mrp:4999,icon:'⌚',rating:4.2,reviews:987,inf:true,creator:'@TechByArjun',specs:[['Display','1.75" AMOLED'],['Battery','7 days'],['Water','IP68'],['GPS','Built-in']]},
  {id:6,name:'Premium Denim Jeans',brand:'DenimCo',cat:'Fashion',price:799,mrp:1599,icon:'👖',rating:4.1,reviews:1450,inf:false,specs:[['Fit','Slim Fit'],['Material','98% Cotton'],['Wash','Cold Wash'],['Sizes','28–40 waist']]},
  {id:7,name:'Whey Protein 1kg',brand:'MuscleMax',cat:'Sports',price:899,mrp:1499,icon:'💪',rating:4.7,reviews:4320,inf:true,creator:'@FitIndia',specs:[['Protein','24g per serving'],['Servings','30'],['Flavour','Chocolate, Vanilla'],['Certified','FSSAI']]},
  {id:8,name:'Bluetooth Speaker',brand:'AudioPlus',cat:'Electronics',price:1799,mrp:3499,icon:'🔊',rating:4.0,reviews:780,inf:false,specs:[['Power','20W RMS'],['Battery','12 hrs'],['Waterproof','IPX7'],['Connectivity','BT 5.0 + AUX']]},
  {id:9,name:'Designer Saree',brand:'WeaveIndia',cat:'Fashion',price:1299,mrp:2499,icon:'🥻',rating:4.8,reviews:2890,inf:true,creator:'@DesiLooks',specs:[['Fabric','Banarasi Silk'],['Length','6.3 meters'],['Blouse','Included'],['Care','Dry Clean Only']]},
  {id:10,name:'RGB Gaming Mouse',brand:'GamerZone',cat:'Electronics',price:699,mrp:1299,icon:'🖱️',rating:4.3,reviews:1230,inf:false,specs:[['DPI','100–12000'],['Buttons','7 Programmable'],['Lighting','16.8M RGB'],['Connection','USB 2.0']]},
  {id:11,name:'Lipstick Set (6 pcs)',brand:'GlamFirst',cat:'Beauty',price:599,mrp:1199,icon:'💄',rating:4.7,reviews:6780,inf:true,creator:'@MakeupByMeera',specs:[['Count','6 shades'],['Type','Matte Finish'],['Long Lasting','8+ hours'],['Cruelty Free','Yes']]},
  {id:12,name:'Premium Yoga Mat',brand:'ZenFlex',cat:'Sports',price:799,mrp:1499,icon:'🧘',rating:4.5,reviews:3400,inf:true,creator:'@YogaWithSneha',specs:[['Thickness','6mm'],['Material','TPE'],['Non-Slip','Yes'],['Size','183x61cm']]},
  {id:13,name:'Kids Wooden Puzzle',brand:'ToyLand',cat:'Kids',price:349,mrp:699,icon:'🧩',rating:4.6,reviews:1890,inf:false,specs:[['Age','3+'],['Pieces','48'],['Material','Wood'],['Safety','BIS Certified']]},
  {id:14,name:'Sunscreen SPF 50+',brand:'DermaShield',cat:'Beauty',price:299,mrp:599,icon:'☀️',rating:4.5,reviews:8920,inf:true,creator:'@SkincareByPriya',specs:[['SPF','50+ PA++++'],['Volume','50ml'],['Tint','No White Cast'],['Suitable For','All skin types']]},
  {id:15,name:'Steel Water Bottle',brand:'HydroLife',cat:'Sports',price:499,mrp:999,icon:'🧃',rating:4.4,reviews:2670,inf:false,specs:[['Capacity','1 Litre'],['Material','Food-grade Steel'],['Insulation','24hr cold, 12hr hot'],['Leak Proof','Yes']]},
  {id:16,name:'Kids Backpack',brand:'FunPack',cat:'Kids',price:449,mrp:899,icon:'🎒',rating:4.3,reviews:1120,inf:false,specs:[['Age','5-12'],['Capacity','15L'],['Material','Polyester'],['Waterproof','Yes']]},
];

export const ORDERS = [
  {id:'#ORD-2847',product:'Wireless Earbuds Pro',buyer:'Rahul Sharma',amount:'₹1,299',date:'15 Jan 2024',status:'Delivered'},
  {id:'#ORD-2841',product:'Vitamin C Face Wash',buyer:'Priya Mehta',amount:'₹349',date:'14 Jan 2024',status:'Shipped'},
  {id:'#ORD-2839',product:'Floral Kurti Set',buyer:'Anjali Singh',amount:'₹899',date:'14 Jan 2024',status:'Processing'},
  {id:'#ORD-2835',product:'Smart Watch Series 5',buyer:'Vikram Nair',amount:'₹2,299',date:'13 Jan 2024',status:'Delivered'},
  {id:'#ORD-2832',product:'Designer Saree',buyer:'Sunita Rao',amount:'₹1,299',date:'12 Jan 2024',status:'Delivered'},
  {id:'#ORD-2828',product:'Whey Protein 1kg',buyer:'Arjun Kumar',amount:'₹899',date:'11 Jan 2024',status:'Delivered'},
];

export const SELLER_PRODUCTS = [
  {id:1,image:'👗',name:'Floral Kurti Set',price:'₹899',stock:143,sales:3241,status:'Active',rating:'4.8'},
  {id:2,image:'🧴',name:'Vitamin C Face Wash',price:'₹349',stock:89,sales:5670,status:'Active',rating:'4.6'},
  {id:3,image:'🥻',name:'Designer Saree',price:'₹1,299',stock:45,sales:2890,status:'Active',rating:'4.8'},
  {id:4,image:'💄',name:'Lipstick Set',price:'₹599',stock:12,sales:6780,status:'Low Stock',rating:'4.7'},
];
