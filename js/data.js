/**
 * data.js — Product catalog data for ALUGAÊ MVP
 * All product information, blocked dates, and sizing data.
 * NOTA: `rentalPrice` agora funciona como PREÇO DA DIÁRIA.
 */

const PRODUCTS = [
  {
    id: 1,
    name: "Vestido Longo Evasê",
    category: "casamento",
    categoryLabel: "Casamento",
    occasions: ["casamento"],
    sizes: ["PP", "P", "M", "G"],
    size: "M",
    measurements: { busto: "88cm", cintura: "68cm", quadril: "94cm", comprimento: "145cm" },
    rentalPrice: 249, // Valor por dia
    deposit: 300,
    rating: 4.9,
    reviews: 34,
    colorScheme: "casamento",
    description: "Vestido longo evasê em tecido crepe de alta gramatura, com decote em V delicado e saia fluida. Ideal para cerimônias de casamento e festas ao ar livre. Inclui cinto de cetim removível.",
    blockedDates: [
      { start: "2026-10-04", end: "2026-10-06" },
      { start: "2026-10-18", end: "2026-10-20" },
      { start: "2026-11-01", end: "2026-11-03" },
    ],
    artType: "dress-long",
    artColor: "#D4C4A8"
  },
  {
    id: 2,
    name: "Vestido Midi de Festa",
    category: "festa",
    categoryLabel: "Festa",
    occasions: ["festa", "casamento"],
    sizes: ["PP", "P", "M", "G", "GG"],
    size: "P ao G",
    measurements: { busto: "90cm", cintura: "70cm", quadril: "96cm", comprimento: "115cm" },
    rentalPrice: 149,
    deposit: 180,
    rating: 4.8,
    reviews: 51,
    colorScheme: "festa",
    description: "Vestido midi em veludo bordô com detalhe de renda na barra. Silhueta ajustada ao corpo com abertura discreta no colarinho. Perfeito para jantares sofisticados e festas noturnas.",
    blockedDates: [
      { start: "2026-10-10", end: "2026-10-12" },
      { start: "2026-10-25", end: "2026-10-27" },
    ],
    artType: "dress-midi",
    artColor: "#8B3A4A"
  },
  {
    id: 3,
    name: "Terno Slim Grafite",
    category: "social",
    categoryLabel: "Social",
    occasions: ["trabalho", "formatura", "casamento"],
    sizes: ["P", "M", "G", "GG"],
    size: "M ao GG",
    measurements: { ombro: "44cm", manga: "63cm", tórax: "100cm", comprimento: "76cm" },
    rentalPrice: 189,
    deposit: 250,
    rating: 4.7,
    reviews: 28,
    colorScheme: "social",
    description: "Terno slim fit em tecido lã-poliéster na cor grafite com leve toque de elastano para conforto de movimento. Acompanha calça de alfaiataria com a mesma combinação. Ideal para cerimônias formais, apresentações e formaturas.",
    blockedDates: [
      { start: "2026-10-08", end: "2026-10-09" },
      { start: "2026-10-22", end: "2026-10-23" },
      { start: "2026-11-05", end: "2026-11-06" },
    ],
    artType: "suit",
    artColor: "#4A4A55"
  },
  {
    id: 4,
    name: "Vestido Longo Azul Royal",
    category: "formatura",
    categoryLabel: "Formatura",
    occasions: ["formatura", "festa"],
    sizes: ["PP", "P", "M"],
    size: "PP ao M",
    measurements: { busto: "86cm", cintura: "66cm", quadril: "92cm", comprimento: "148cm" },
    rentalPrice: 219,
    deposit: 280,
    rating: 5.0,
    reviews: 19,
    colorScheme: "formatura",
    description: "Vestido longo em crepe azul royal com decote nas costas e cauda discreta. Bordado artesanal de cristais na cintura que captura a luz de forma deslumbrante. Uma das peças mais requisitadas do nosso acervo.",
    blockedDates: [
      { start: "2026-10-15", end: "2026-10-17" },
      { start: "2026-10-30", end: "2026-11-01" },
    ],
    artType: "dress-long",
    artColor: "#2C4A9E"
  },
  {
    id: 5,
    name: "Conjunto Praia Linho",
    category: "praia",
    categoryLabel: "Praia",
    occasions: ["praia", "casual"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "libre", cintura: "elástico", quadril: "libre", comprimento: "calça 98cm" },
    rentalPrice: 89,
    deposit: 100,
    rating: 4.6,
    reviews: 42,
    colorScheme: "praia",
    description: "Conjunto de calça wide leg e camisa oversized em linho lavado cor areia. Levíssimo e respirável, ideal para viagens à praia, piscinas e ambientes ao ar livre. Acompanha sacola de praia em palha.",
    blockedDates: [
      { start: "2026-10-05", end: "2026-10-08" },
      { start: "2026-10-20", end: "2026-10-24" },
    ],
    artType: "casual-set",
    artColor: "#C8B898"
  },
  {
    id: 6,
    name: "Vestido Preto Elegante",
    category: "casual",
    categoryLabel: "Casual",
    occasions: ["trabalho", "casual", "festa"],
    sizes: ["PP", "P", "M", "G", "GG"],
    size: "PP ao GG",
    measurements: { busto: "92cm", cintura: "72cm", quadril: "98cm", comprimento: "100cm" },
    rentalPrice: 129,
    deposit: 150,
    rating: 4.8,
    reviews: 67,
    colorScheme: "casual",
    description: "Vestido midi em malha ponto romano preta com manga 3/4 e cinto fino incluso. Peça versátil que transita com facilidade entre o ambiente corporativo e eventos noturnos. Um clássico atemporal.",
    blockedDates: [
      { start: "2026-10-11", end: "2026-10-13" },
    ],
    artType: "dress-midi",
    artColor: "#2A2A2A"
  },
  {
    id: 7,
    name: "Fantasia Veneziana",
    category: "fantasia",
    categoryLabel: "Fantasia",
    occasions: ["fantasia"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "88cm", cintura: "ajustável", quadril: "94cm", comprimento: "130cm" },
    rentalPrice: 199,
    deposit: 250,
    rating: 4.9,
    reviews: 15,
    colorScheme: "fantasia",
    description: "Fantasia veneziana completa com vestido longo em brocado dourado e bordô, máscara artesanal, luvas de renda e tiara. Perfeita para bailes à fantasia, festas de carnaval e eventos temáticos.",
    blockedDates: [
      { start: "2026-10-31", end: "2026-11-02" },
    ],
    artType: "costume",
    artColor: "#8B6914"
  },
  {
    id: 8,
    name: "Kit Acessórios Noiva",
    category: "casamento",
    categoryLabel: "Casamento",
    occasions: ["casamento"],
    sizes: ["Tamanho único"],
    size: "Único",
    measurements: { colar: "42cm", brincos: "5cm comprimento", luvas: "até o cotovelo" },
    rentalPrice: 149,
    deposit: 200,
    rating: 4.9,
    reviews: 22,
    colorScheme: "acessorios",
    description: "Kit completo para noiva com colar de pérolas de água doce, brincos combinando, tiara cravejada de cristais, luvas de renda e bolsa clutch bordada. Todos os itens higienizados e embalados individualmente.",
    blockedDates: [
      { start: "2026-10-18", end: "2026-10-19" },
    ],
    artType: "accessories",
    artColor: "#D4C4A8"
  },
  {
    id: 9,
    name: "Vestido Floral Casual",
    category: "casual",
    categoryLabel: "Casual",
    occasions: ["casual", "praia"],
    sizes: ["PP", "P", "M", "G"],
    size: "PP ao G",
    measurements: { busto: "86cm", cintura: "66cm", quadril: "92cm", comprimento: "110cm" },
    rentalPrice: 79,
    deposit: 90,
    rating: 4.5,
    reviews: 38,
    colorScheme: "praia",
    description: "Vestido midi em viscose floral com alças finas ajustáveis e saia rodada. Levíssimo, ideal para o dia a dia, passeios ao ar livre e viagens.",
    blockedDates: [],
    artType: "dress-midi",
    artColor: "#6B8A5E"
  },
  {
    id: 10,
    name: "Blazer Oversized Premium",
    category: "social",
    categoryLabel: "Social",
    occasions: ["trabalho", "casual", "festa"],
    sizes: ["P", "M", "G", "GG"],
    size: "P ao GG",
    measurements: { ombro: "52cm", manga: "60cm", tórax: "108cm", comprimento: "80cm" },
    rentalPrice: 119,
    deposit: 150,
    rating: 4.7,
    reviews: 29,
    colorScheme: "casual",
    description: "Blazer oversized em tecido alfaiataria caramelo com botões dourados. Versatilidade máxima: use sobre vestidos, calças sociais ou jeans. Peça chave para looks poderosos.",
    blockedDates: [
      { start: "2026-10-14", end: "2026-10-15" },
    ],
    artType: "blazer",
    artColor: "#9B7B4A"
  },
  {
    id: 11,
    name: "Vestido de Inverno Midi",
    category: "social",
    categoryLabel: "Social",
    occasions: ["trabalho", "casual", "festa"],
    sizes: ["PP", "P", "M", "G"],
    size: "PP ao G",
    measurements: { busto: "88cm", cintura: "68cm", quadril: "94cm", comprimento: "108cm" },
    rentalPrice: 159,
    deposit: 180,
    rating: 4.6,
    reviews: 21,
    colorScheme: "social",
    description: "Vestido midi de malha canelada cor vinho com manga longa e gola alta. Quentinho sem perder a elegância para o inverno. Toque suave e textura premium.",
    blockedDates: [],
    artType: "dress-midi",
    artColor: "#6B2A35"
  },
  {
    id: 12,
    name: "Conjunto Formatura Cetim",
    category: "formatura",
    categoryLabel: "Formatura",
    occasions: ["formatura", "festa"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "90cm", cintura: "70cm", quadril: "96cm", comprimento: "120cm" },
    rentalPrice: 199,
    deposit: 240,
    rating: 4.8,
    reviews: 16,
    colorScheme: "formatura",
    description: "Conjunto de saia longa e top cropped em cetim champanhe com bordado de flores na borda. Exclusivo e sofisticado para a grande noite da formatura.",
    blockedDates: [
      { start: "2026-10-28", end: "2026-10-30" },
    ],
    artType: "dress-long",
    artColor: "#C8B070"
  },
  {
    id: 101,
    name: "Bolsa de Mão Trançada de Palha",
    category: "acessorios",
    categoryLabel: "Acessórios",
    occasions: ["praia", "casual"],
    sizes: ["Tamanho único"],
    size: "Único",
    measurements: { largura: "24cm", altura: "18cm", profundidade: "10cm" },
    rentalPrice: 87,
    deposit: 110,
    rating: 4.8,
    reviews: 0,
    colorScheme: "praia",
    description: "Bolsa de mão trançada de palha, leve e charmosa, ideal para produções de verão, praia e passeios ao ar livre.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Bolsa de Mão Trançada de Palha.jpeg",
    artType: "accessories",
    artColor: "#C8B898"
  },
  {
    id: 102,
    name: "Bota Feminina Salto Alto Agulha 11Cm Bico Fino Cano Longo",
    category: "festa",
    categoryLabel: "Festa",
    occasions: ["festa", "casamento"],
    sizes: ["35", "36", "37", "38", "39"],
    size: "35 ao 39",
    measurements: { salto: "11cm", cano: "longo", material: "sintético" },
    rentalPrice: 178,
    deposit: 220,
    rating: 4.7,
    reviews: 0,
    colorScheme: "festa",
    description: "Bota feminina de cano longo com salto agulha de 11 cm e bico fino. Uma escolha marcante para festas e eventos noturnos.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Bota Feminina Salto Alto Agulha 11Cm Bico Fino Cano Longo.jpeg",
    artType: "accessories",
    artColor: "#8B3A4A"
  },
  {
    id: 103,
    name: "Conjunto Tropical de Duas Peças Crop Top e Saia Longa",
    category: "praia",
    categoryLabel: "Praia",
    occasions: ["praia", "festa"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "88cm", cintura: "68cm", comprimento: "saia 105cm" },
    rentalPrice: 126,
    deposit: 160,
    rating: 4.8,
    reviews: 0,
    colorScheme: "praia",
    description: "Conjunto tropical de duas peças com crop top e saia longa. Leve, colorido e perfeito para viagens e celebrações ao ar livre.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Conjunto Tropical de Duas Peças Crop Top e Saia Longa.jpeg",
    artType: "casual-set",
    artColor: "#6B8A5E"
  },
  {
    id: 104,
    name: "Firerie Vestido de Malha de Manga Longa com Decote Redondo Feminino, Vestido de Outono",
    category: "casual",
    categoryLabel: "Casual",
    occasions: ["casual", "trabalho"],
    sizes: ["P", "M", "G", "GG"],
    size: "P ao GG",
    measurements: { busto: "92cm", cintura: "74cm", comprimento: "105cm" },
    rentalPrice: 94,
    deposit: 120,
    rating: 4.6,
    reviews: 0,
    colorScheme: "casual",
    description: "Vestido de malha com mangas longas e decote redondo, confortável e versátil para os dias mais frescos.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Firerie Vestido de Malha de Manga Longa com Decote Redondo Feminino, Vestido de Outono.jpeg",
    artType: "dress-midi",
    artColor: "#6B2A35"
  },
  {
    id: 105,
    name: "Macacão Curto de Festa Bordô com Mangas Bufantes e Babados",
    category: "festa",
    categoryLabel: "Festa",
    occasions: ["festa", "formatura"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "90cm", cintura: "70cm", comprimento: "82cm" },
    rentalPrice: 153,
    deposit: 195,
    rating: 4.9,
    reviews: 0,
    colorScheme: "festa",
    description: "Macacão curto bordô com mangas bufantes e detalhes de babados. Elegante e atual para festas e comemorações especiais.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Macacão Curto de Festa Bordô com Mangas Bufantes e Babados.jpeg",
    artType: "dress-midi",
    artColor: "#8B3A4A"
  },
  {
    id: 106,
    name: "Vestido Bodycon de Crochê com lantejoulas",
    category: "festa",
    categoryLabel: "Festa",
    occasions: ["festa", "praia"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "88cm", cintura: "68cm", quadril: "94cm", comprimento: "92cm" },
    rentalPrice: 219,
    deposit: 270,
    rating: 4.8,
    reviews: 0,
    colorScheme: "festa",
    description: "Vestido bodycon de crochê com lantejoulas, caimento ajustado e brilho especial para festas e eventos de verão.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Vestido Bodycon de Crochê com lantejoulas.jpeg",
    artType: "dress-midi",
    artColor: "#C8B070"
  },
  {
    id: 107,
    name: "Vestido Frente Única em Camadas Off-White",
    category: "casamento",
    categoryLabel: "Casamento",
    occasions: ["casamento", "festa"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "88cm", cintura: "70cm", quadril: "96cm", comprimento: "140cm" },
    rentalPrice: 246,
    deposit: 300,
    rating: 4.9,
    reviews: 0,
    colorScheme: "casamento",
    description: "Vestido frente única off-white com saia em camadas e movimento delicado, ideal para ocasiões especiais.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Vestido Frente Única em Camadas Off-White.jpeg",
    artType: "dress-long",
    artColor: "#D4C4A8"
  },
  {
    id: 108,
    name: "Vestido Maxi Longo de Camadas Verde-Menta",
    category: "formatura",
    categoryLabel: "Formatura",
    occasions: ["formatura", "casamento"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "88cm", cintura: "68cm", quadril: "96cm", comprimento: "150cm" },
    rentalPrice: 287,
    deposit: 300,
    rating: 5.0,
    reviews: 0,
    colorScheme: "formatura",
    description: "Vestido maxi longo verde-menta com camadas fluidas, uma peça romântica e sofisticada para grandes celebrações.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/Vestido Maxi Longo de Camadas Verde-Menta.jpeg",
    artType: "dress-long",
    artColor: "#6B8A5E"
  },
  {
    id: 109,
    name: "blazer casual",
    category: "social",
    categoryLabel: "Social",
    occasions: ["trabalho", "casual"],
    sizes: ["P", "M", "G", "GG"],
    size: "P ao GG",
    measurements: { ombro: "46cm", manga: "61cm", tórax: "104cm", comprimento: "76cm" },
    rentalPrice: 112,
    deposit: 140,
    rating: 4.7,
    reviews: 0,
    colorScheme: "casual",
    description: "Blazer casual de corte versátil para compor looks profissionais ou descontraídos com elegância.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/blazer casual.jpeg",
    artType: "blazer",
    artColor: "#9B7B4A"
  },
  {
    id: 110,
    name: "vestido preto elegante com as costas abertas e barras com babados",
    category: "festa",
    categoryLabel: "Festa",
    occasions: ["festa", "casamento"],
    sizes: ["P", "M", "G"],
    size: "P ao G",
    measurements: { busto: "88cm", cintura: "68cm", quadril: "94cm", comprimento: "112cm" },
    rentalPrice: 198,
    deposit: 250,
    rating: 4.9,
    reviews: 0,
    colorScheme: "casual",
    description: "Vestido preto elegante com costas abertas e barras com babados, perfeito para uma produção sofisticada.",
    blockedDates: [],
    imagePath: "roupas/WhatsApp Unknown 2026-10-06 at 11.49.20/vestido preto elegante com as costas abertas e barras com babados.jpeg",
    artType: "dress-midi",
    artColor: "#2A2A2A"
  }
];

// O catálogo público exibe apenas anúncios com foto.
const PRODUCTS_WITH_PHOTOS = PRODUCTS.filter(product => product.imagePath);
PRODUCTS.splice(0, PRODUCTS.length, ...PRODUCTS_WITH_PHOTOS);

const STORE_CATALOG = {
  "Ateliê Aurora": {
    rating: 4.9,
    reviews: 128,
    location: "São Paulo, SP",
    description: "Curadoria de peças para festas e ocasiões especiais, com atendimento próximo e cuidado em cada entrega."
  },
  "Veste Bem Brechó": {
    rating: 4.8,
    reviews: 96,
    location: "Rio de Janeiro, RJ",
    description: "Moda circular com peças versáteis, higienizadas e prontas para novos momentos."
  },
  "Casa das Tendências": {
    rating: 4.7,
    reviews: 74,
    location: "Belo Horizonte, MG",
    description: "Loja especializada em looks atuais para festas, viagens e produções do dia a dia."
  },
  "Lumière Closet": {
    rating: 4.9,
    reviews: 181,
    location: "Curitiba, PR",
    description: "Peças selecionadas para quem busca elegância, conforto e uma experiência de aluguel sem complicação."
  }
};

const PHOTO_PRODUCT_STORES = [
  "Ateliê Aurora", "Ateliê Aurora", "Veste Bem Brechó",
  "Veste Bem Brechó", "Casa das Tendências", "Casa das Tendências",
  "Lumière Closet", "Lumière Closet", "Ateliê Aurora", "Casa das Tendências"
];

const CUSTOMER_COMMENTS = [
  [
    { author: "Mariana S.", rating: 5, text: "A bolsa chegou muito bem embalada e estava ainda mais bonita ao vivo. O atendimento foi rápido." },
    { author: "Camila R.", rating: 5, text: "Usei em uma viagem e combinou com tudo. Devolução simples e sem burocracia." }
  ],
  [
    { author: "Juliana M.", rating: 5, text: "A bota é linda e confortável para o salto. A loja enviou as medidas certinhas." },
    { author: "Renata F.", rating: 4, text: "Chegou no prazo e bem conservada. Recomendo para eventos à noite." }
  ],
  [
    { author: "Larissa P.", rating: 5, text: "O conjunto veste muito bem e a estampa é igual à foto. Foi perfeito para o fim de semana." },
    { author: "Nathalia C.", rating: 5, text: "Peça leve, fresca e o atendimento da loja foi ótimo do início ao fim." }
  ],
  [
    { author: "Beatriz A.", rating: 5, text: "Muito confortável e elegante. A malha tem um caimento ótimo." },
    { author: "Paula V.", rating: 4, text: "A peça estava limpa e cheirosa, além de ter chegado antes do evento." }
  ],
  [
    { author: "Isabela T.", rating: 5, text: "O macacão fez muito sucesso na festa. As mangas são lindas e o tamanho ficou perfeito." },
    { author: "Fernanda L.", rating: 5, text: "A loja foi super atenciosa com a troca de tamanho e resolveu tudo no mesmo dia." }
  ],
  [
    { author: "Sofia G.", rating: 5, text: "Brilha na medida certa e ficou confortável para dançar. Experiência excelente." },
    { author: "Aline B.", rating: 4, text: "Peça diferenciada e bem cuidada. Voltaria a alugar com certeza." }
  ],
  [
    { author: "Clara R.", rating: 5, text: "Vestido delicado, com movimento lindo. A descrição ajudou bastante na escolha." },
    { author: "Manuela D.", rating: 5, text: "Usei em um casamento durante o dia e recebi muitos elogios." }
  ],
  [
    { author: "Helena F.", rating: 5, text: "A cor é maravilhosa e o vestido veste muito bem. Entrega pontual." },
    { author: "Bruna K.", rating: 5, text: "Tudo impecável, desde a embalagem até a devolução. Recomendo muito." }
  ],
  [
    { author: "Carolina N.", rating: 5, text: "Blazer versátil e com ótimo corte. Usei no trabalho e depois em um jantar." },
    { author: "Luiza E.", rating: 4, text: "Gostei bastante da peça e a loja respondeu todas as minhas dúvidas." }
  ],
  [
    { author: "Amanda S.", rating: 5, text: "O detalhe das costas é lindo e o babado deixa o look muito elegante." },
    { author: "Débora P.", rating: 5, text: "Chegou exatamente como nas fotos, muito bem cuidado e no prazo combinado." }
  ]
];

PRODUCTS.forEach((product, index) => {
  const storeName = PHOTO_PRODUCT_STORES[index];
  product.store = { name: storeName, ...STORE_CATALOG[storeName] };
  product.comments = CUSTOMER_COMMENTS[index];
  product.reviews = product.comments.length;
  product.rating = Number((product.comments.reduce((sum, comment) => sum + comment.rating, 0) / product.comments.length).toFixed(1));
});

// Map of category slugs to display info
const CATEGORIES = {
  casamento: { label: "Casamento", count: PRODUCTS.filter(p => p.category === "casamento").length },
  formatura: { label: "Formatura", count: PRODUCTS.filter(p => p.category === "formatura").length },
  festa: { label: "Festa", count: PRODUCTS.filter(p => p.category === "festa").length },
  social: { label: "Social", count: PRODUCTS.filter(p => p.category === "social").length },
  casual: { label: "Casual", count: PRODUCTS.filter(p => p.category === "casual").length },
  praia: { label: "Praia", count: PRODUCTS.filter(p => p.category === "praia").length },
  fantasia: { label: "Fantasia", count: PRODUCTS.filter(p => p.category === "fantasia").length },
  acessorios: { label: "Acessórios", count: PRODUCTS.filter(p => p.category === "acessorios").length }
};

// Occasion → category mapping for the home search
const OCCASION_TO_CATEGORIES = {
  casamento: ["casamento", "acessorios"],
  formatura: ["formatura", "social"],
  festa: ["festa", "casual", "social"],
  trabalho: ["social", "casual"],
  praia: ["praia", "casual"],
  fantasia: ["fantasia"],
  casual: ["casual", "praia"]
};

/**
 * Filters products by occasion, date range, sizes, and price.
 */
function filterProducts({ occasion, date, sizes, maxPrice, sortBy } = {}) {
  let results = [...PRODUCTS];

  // Filter by occasion
  if (occasion) {
    const allowedCategories = OCCASION_TO_CATEGORIES[occasion] || [occasion];
    results = results.filter(p =>
      p.occasions.some(o => allowedCategories.includes(o)) ||
      allowedCategories.includes(p.category)
    );
  }

  // Filter by availability date
  if (date) {
    results = results.filter(p => isProductAvailable(p, date, date));
  }

  // Filter by sizes
  if (sizes && sizes.length > 0) {
    results = results.filter(p =>
      p.sizes.some(s => sizes.includes(s))
    );
  }

  // Filter by max price (aplica-se ao valor da diária neste novo formato)
  if (maxPrice) {
    results = results.filter(p => p.rentalPrice <= maxPrice);
  }

  // Sort
  if (sortBy === "price-asc") {
    results.sort((a, b) => a.rentalPrice - b.rentalPrice);
  } else if (sortBy === "price-desc") {
    results.sort((a, b) => b.rentalPrice - a.rentalPrice);
  } else if (sortBy === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  }

  return results;
}

/**
 * Checks if a product is available for the given date range.
 */
function isProductAvailable(product, startDate, endDate) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  return !product.blockedDates.some(block => {
    const bStart = new Date(block.start + "T00:00:00");
    const bEnd = new Date(block.end + "T00:00:00");
    return start <= bEnd && end >= bStart;
  });
}

/**
 * Returns all blocked date strings for a product (for calendar rendering).
 */
function getBlockedDatesSet(product) {
  const set = new Set();
  product.blockedDates.forEach(block => {
    let cur = new Date(block.start + "T00:00:00");
    const end = new Date(block.end + "T00:00:00");
    while (cur <= end) {
      set.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  });
  return set;
}

/**
 * Finds a product by ID.
 */
function getProductById(id) {
  return PRODUCTS.find(p => String(p.id) === String(id)) || null;
}

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY).
 */
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Returns today's date in YYYY-MM-DD format.
 */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculates rental duration in days.
 */
function rentalDays(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const a = new Date(startStr + "T00:00:00");
  const b = new Date(endStr + "T00:00:00");
  return Math.max(0, Math.round((b - a) / 86400000) + 1);
}

// --- ADICIONE ESTE TRECHO NO FINAL DO SEU DATA.JS ---

// Verifica se existem produtos criados pelo usuário no localStorage
let produtosSalvos = [];
try {
  produtosSalvos = JSON.parse(localStorage.getItem("alugae_novos_produtos") || "[]");
} catch (error) {
  console.error("Não foi possível carregar os anúncios salvos.", error);
}

// Se existirem, adiciona eles ao catálogo principal
if (Array.isArray(produtosSalvos) && produtosSalvos.length > 0) {
  PRODUCTS.push(...produtosSalvos.filter(product => product.imagePath && product.store));
}

// Recalcula a contagem das categorias para incluir os novos produtos
Object.keys(CATEGORIES).forEach(cat => {
  CATEGORIES[cat].count = PRODUCTS.filter(p => p.category === cat).length;
});