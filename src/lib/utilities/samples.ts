export interface SamplePhotoItem {
  id: string;
  title: string;
  category: string;
  url: string;
  aspectLabel: string;
}

export const SAMPLE_PHOTOS: SamplePhotoItem[] = [
  {
    id: 'alpine-architecture',
    title: 'Lakeside Pavilion',
    category: 'Architecture',
    url: '/src/assets/images/sample_alpine_architecture_1795553664005.jpg',
    aspectLabel: '16:9',
  },
  {
    id: 'golden-portrait',
    title: 'Window Light Portrait',
    category: 'Portrait',
    url: '/src/assets/images/sample_golden_portrait_1795553663476.jpg',
    aspectLabel: '3:4',
  },
  {
    id: 'vintage-cafe',
    title: 'Morning Rangefinder',
    category: 'Still Life',
    url: '/src/assets/images/sample_vintage_cafe_1795553663244.jpg',
    aspectLabel: '4:3',
  },
  {
    id: 'botanical-product',
    title: 'Ceramic & Citrus',
    category: 'Studio Object',
    url: '/src/assets/images/sample_botanical_product_1795553664740.jpg',
    aspectLabel: '1:1',
  },
  {
    id: 'coastal-road',
    title: 'Mediterranean Coast',
    category: 'Landscape',
    url: '/src/assets/images/sample_coastal_road_1795553665667.jpg',
    aspectLabel: '4:3',
  },
];
